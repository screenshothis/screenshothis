import { EventEmitter } from "node:events";
import { Agent } from "node:https";
import type { Readable } from "node:stream";

import {
	CopyObjectCommand,
	DeleteObjectCommand,
	DeleteObjectsCommand,
	GetObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { ConfiguredRetryStrategy } from "@smithy/util-retry";

import { env } from "../utils/env";
import { logger } from "./logger";

interface StorageConfig {
	accessKeyId?: string;
	secretAccessKey?: string;
	endpoint?: string;
	region?: string;
	bucket?: string;
	forcePathStyle?: boolean;
	maxSockets?: number;
	requestTimeout?: number;
	cacheMiddleware?: boolean;
	maxRetries?: number;
}

interface FileOptions {
	contentType?: string;
	metadata?: Record<string, string>;
	cacheControl?: string;
	contentEncoding?: string;
	contentDisposition?: string;
	expires?: Date;
	acl?: string;
}

interface UploadOptions extends FileOptions {
	partSize?: number;
	queueSize?: number;
	leavePartsOnError?: boolean;
	tags?: Array<{ Key: string; Value: string }>;
	onProgress?: (progress: {
		loaded: number;
		total?: number;
		percentage?: number;
	}) => void;
}

interface ListOptions {
	prefix?: string;
	maxKeys?: number;
	continuationToken?: string;
	delimiter?: string;
}

interface FileMetadata {
	key: string;
	size: number;
	lastModified: Date;
	etag: string;
	contentType?: string;
	metadata?: Record<string, string>;
}

class StorageFile {
	constructor(
		private client: S3Client,
		private bucket: string,
		private key: string,
	) {}

	/**
	 * Get file as ArrayBuffer with efficient memory usage
	 */
	async arrayBuffer(): Promise<ArrayBuffer> {
		try {
			const command = new GetObjectCommand({
				Bucket: this.bucket,
				Key: this.key,
			});

			const response = await this.client.send(command);

			if (!response.Body) {
				throw new Error(`File not found: ${this.key}`);
			}

			// Handle different body types
			if (response.Body instanceof Uint8Array) {
				const buffer = response.Body.buffer as ArrayBuffer;
				return buffer.slice(
					response.Body.byteOffset,
					response.Body.byteOffset + response.Body.byteLength,
				);
			}

			// For streams, collect chunks efficiently
			const chunks: Uint8Array[] = [];
			const stream = response.Body as Readable;

			for await (const chunk of stream) {
				chunks.push(chunk);
			}

			const buffer = Buffer.concat(chunks);
			return buffer.buffer.slice(
				buffer.byteOffset,
				buffer.byteOffset + buffer.byteLength,
			) as ArrayBuffer;
		} catch (error) {
			logger.error(
				{ error, key: this.key },
				"Failed to get file as ArrayBuffer",
			);
			throw error;
		}
	}

	/**
	 * Get file as a readable stream with proper resource management
	 */
	stream(): ReadableStream<Uint8Array> {
		const fileKey = this.key;
		const client = this.client;
		const bucket = this.bucket;

		return new ReadableStream<Uint8Array>({
			async start(controller) {
				try {
					const command = new GetObjectCommand({
						Bucket: bucket,
						Key: fileKey,
					});

					const response = await client.send(command);

					if (!response.Body) {
						throw new Error(`File not found: ${fileKey}`);
					}

					const stream = response.Body as Readable;

					stream.on("data", (chunk) => {
						controller.enqueue(new Uint8Array(chunk));
					});

					stream.on("end", () => {
						controller.close();
					});

					stream.on("error", (error) => {
						logger.error({ error, key: fileKey }, "Stream error");
						controller.error(error);
					});
				} catch (error) {
					logger.error({ error, key: fileKey }, "Failed to create stream");
					controller.error(error);
				}
			},
		});
	}

	/**
	 * Get file metadata and statistics
	 */
	async stat(): Promise<FileMetadata> {
		try {
			const command = new HeadObjectCommand({
				Bucket: this.bucket,
				Key: this.key,
			});

			const response = await this.client.send(command);

			return {
				key: this.key,
				size: response.ContentLength || 0,
				lastModified: response.LastModified || new Date(),
				etag: response.ETag?.replace(/"/g, "") || "",
				contentType: response.ContentType,
				metadata: response.Metadata,
			};
		} catch (error) {
			logger.error({ error, key: this.key }, "Failed to get file stats");
			throw error;
		}
	}

	/**
	 * Check if file exists
	 */
	async exists(): Promise<boolean> {
		try {
			await this.stat();
			return true;
		} catch (error) {
			const err = error as {
				name?: string;
				$metadata?: { httpStatusCode?: number };
			};
			if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
				return false;
			}
			throw error;
		}
	}

	/**
	 * Delete the file
	 */
	async delete(): Promise<void> {
		try {
			const command = new DeleteObjectCommand({
				Bucket: this.bucket,
				Key: this.key,
			});

			await this.client.send(command);
			logger.info({ key: this.key }, "File deleted successfully");
		} catch (error) {
			logger.error({ error, key: this.key }, "Failed to delete file");
			throw error;
		}
	}
}

/**
 * Enhanced Storage class with advanced AWS S3 capabilities
 */
class Storage extends EventEmitter {
	private client: S3Client;
	private bucket: string;

	// S3 batch delete limit
	private static readonly S3_BATCH_DELETE_LIMIT = 1000;

	constructor(config?: StorageConfig) {
		super();

		const resolvedConfig = {
			accessKeyId: config?.accessKeyId || env.AWS_ACCESS_KEY_ID || "",
			secretAccessKey:
				config?.secretAccessKey || env.AWS_SECRET_ACCESS_KEY || "",
			endpoint: config?.endpoint || env.AWS_ENDPOINT,
			region: config?.region || env.AWS_REGION || "us-east-1",
			bucket: config?.bucket || env.AWS_BUCKET || "",
			forcePathStyle: config?.forcePathStyle ?? env.AWS_USE_PATH_STYLE_ENDPOINT,
			maxSockets: config?.maxSockets || 50,
			requestTimeout: config?.requestTimeout || 30000,
			cacheMiddleware: config?.cacheMiddleware ?? true,
			maxRetries: config?.maxRetries || 3,
		};

		this.bucket = resolvedConfig.bucket;

		// Configure optimized HTTP handler for performance
		const requestHandler = new NodeHttpHandler({
			requestTimeout: resolvedConfig.requestTimeout,
			httpsAgent: new Agent({
				keepAlive: true,
				maxSockets: resolvedConfig.maxSockets,
			}),
		});

		// Configure retry strategy with exponential backoff for transient failures
		const retryStrategy = new ConfiguredRetryStrategy(
			resolvedConfig.maxRetries,
			// Exponential backoff: 100ms, 200ms, 400ms, 800ms, etc.
			(attempt: number) => 100 * 2 ** attempt,
		);

		this.client = new S3Client({
			credentials: {
				accessKeyId: resolvedConfig.accessKeyId,
				secretAccessKey: resolvedConfig.secretAccessKey,
			},
			endpoint: resolvedConfig.endpoint,
			region: resolvedConfig.region,
			forcePathStyle: resolvedConfig.forcePathStyle,
			requestHandler,
			retryStrategy,
		});

		logger.info(
			{
				region: resolvedConfig.region,
				bucket: this.bucket,
				endpoint: resolvedConfig.endpoint,
				maxRetries: resolvedConfig.maxRetries,
			},
			"Storage client initialized with retry strategy",
		);
	}

	/**
	 * Get a file reference for operations
	 */
	file(key: string): StorageFile {
		return new StorageFile(this.client, this.bucket, key);
	}

	/**
	 * Simple write operation for small files
	 */
	async write(
		key: string,
		data: Uint8Array | Buffer | string,
		options: FileOptions = {},
	): Promise<void> {
		try {
			const command = new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: data,
				ContentType: options.contentType,
				Metadata: options.metadata,
				CacheControl: options.cacheControl,
				ContentEncoding: options.contentEncoding,
				ContentDisposition: options.contentDisposition,
				Expires: options.expires,
			});

			await this.client.send(command);

			// Calculate actual byte size - use Buffer.byteLength for strings, data.length for binary data
			const size =
				typeof data === "string" ? Buffer.byteLength(data) : data.length;
			logger.info({ key, size }, "File written successfully");
		} catch (error) {
			logger.error({ error, key }, "Failed to write file");
			throw error;
		}
	}

	/**
	 * Advanced upload with multipart support and progress tracking
	 */
	async upload(
		key: string,
		data: Uint8Array | Buffer | Readable | string,
		options: UploadOptions = {},
	): Promise<void> {
		try {
			const upload = new Upload({
				client: this.client,
				params: {
					Bucket: this.bucket,
					Key: key,
					Body: data,
					ContentType: options.contentType,
					Metadata: options.metadata,
					CacheControl: options.cacheControl,
					ContentEncoding: options.contentEncoding,
					ContentDisposition: options.contentDisposition,
					Expires: options.expires,
					Tagging: options.tags
						?.map((tag) => `${tag.Key}=${tag.Value}`)
						.join("&"),
				},
				// Multipart upload configuration
				partSize: options.partSize || 1024 * 1024 * 5, // 5MB default
				queueSize: options.queueSize || 4, // 4 concurrent parts
				leavePartsOnError: options.leavePartsOnError || false,
			});

			// Progress tracking
			if (options.onProgress) {
				upload.on("httpUploadProgress", (progress) => {
					const loaded = progress.loaded || 0;
					const percentage = progress.total
						? Math.round((loaded / progress.total) * 100)
						: undefined;

					options.onProgress?.({
						loaded,
						total: progress.total,
						percentage,
					});
				});
			}

			await upload.done();
			logger.info({ key }, "File uploaded successfully");
		} catch (error) {
			logger.error({ error, key }, "Failed to upload file");
			throw error;
		}
	}

	/**
	 * List objects in the bucket
	 */
	async list(options: ListOptions = {}) {
		try {
			const command = new ListObjectsV2Command({
				Bucket: this.bucket,
				Prefix: options.prefix,
				MaxKeys: options.maxKeys,
				ContinuationToken: options.continuationToken,
				Delimiter: options.delimiter,
			});

			const response = await this.client.send(command);

			return {
				contents:
					response.Contents?.map((object) => ({
						key: object.Key || "",
						size: object.Size || 0,
						lastModified: object.LastModified || new Date(),
						etag: object.ETag?.replace(/"/g, "") || "",
					})) || [],
				isTruncated: response.IsTruncated || false,
				nextContinuationToken: response.NextContinuationToken,
				commonPrefixes:
					response.CommonPrefixes?.map((prefix) => prefix.Prefix || "") || [],
			};
		} catch (error) {
			logger.error({ error, options }, "Failed to list objects");
			throw error;
		}
	}

	/**
	 * Delete multiple files efficiently with S3 batch limit handling
	 *
	 * S3 has a limit of 1000 objects per batch delete operation.
	 * This method automatically splits larger arrays into batches.
	 */
	async deleteMany(keys: string[]): Promise<{
		deleted: string[];
		errors: Array<{ key: string; error: string }>;
	}> {
		if (keys.length === 0) {
			return { deleted: [], errors: [] };
		}

		// Check if we exceed the S3 batch limit
		if (keys.length > Storage.S3_BATCH_DELETE_LIMIT) {
			logger.info(
				{ keyCount: keys.length, limit: Storage.S3_BATCH_DELETE_LIMIT },
				"Splitting delete operation into batches due to S3 limit",
			);

			// Split into batches and process sequentially
			const allDeleted: string[] = [];
			const allErrors: Array<{ key: string; error: string }> = [];

			for (let i = 0; i < keys.length; i += Storage.S3_BATCH_DELETE_LIMIT) {
				const batchKeys = keys.slice(i, i + Storage.S3_BATCH_DELETE_LIMIT);
				const batchNumber = Math.floor(i / Storage.S3_BATCH_DELETE_LIMIT) + 1;
				const totalBatches = Math.ceil(
					keys.length / Storage.S3_BATCH_DELETE_LIMIT,
				);

				logger.info(
					{ batchNumber, totalBatches, batchSize: batchKeys.length },
					"Processing delete batch",
				);

				try {
					const batchResult = await this.deleteBatch(batchKeys);
					allDeleted.push(...batchResult.deleted);
					allErrors.push(...batchResult.errors);
				} catch (error) {
					// If entire batch fails, add all keys as errors
					const batchErrors = batchKeys.map((key) => ({
						key,
						error:
							error instanceof Error ? error.message : "Batch operation failed",
					}));
					allErrors.push(...batchErrors);

					logger.error(
						{ error, batchNumber, batchSize: batchKeys.length },
						"Batch delete operation failed",
					);
				}
			}

			logger.info(
				{
					totalKeys: keys.length,
					deletedCount: allDeleted.length,
					errorCount: allErrors.length,
				},
				"Batched delete operation completed",
			);

			return { deleted: allDeleted, errors: allErrors };
		}

		// Single batch operation for arrays under the limit
		return this.deleteBatch(keys);
	}

	/**
	 * Internal method to delete a single batch of objects (max 1000)
	 */
	private async deleteBatch(keys: string[]): Promise<{
		deleted: string[];
		errors: Array<{ key: string; error: string }>;
	}> {
		try {
			const command = new DeleteObjectsCommand({
				Bucket: this.bucket,
				Delete: {
					Objects: keys.map((key) => ({ Key: key })),
					Quiet: false,
				},
			});

			const response = await this.client.send(command);

			const deleted =
				response.Deleted?.map((obj) => obj.Key || "").filter(Boolean) || [];
			const errors =
				response.Errors?.map((err) => ({
					key: err.Key || "",
					error: err.Message || "Unknown error",
				})) || [];

			logger.info(
				{ deletedCount: deleted.length, errorCount: errors.length },
				"Batch delete completed",
			);

			return { deleted, errors };
		} catch (error) {
			logger.error({ error, keyCount: keys.length }, "Failed to delete batch");
			throw error;
		}
	}

	/**
	 * Copy a file to a new location
	 */
	async copy(
		sourceKey: string,
		destinationKey: string,
		options: FileOptions = {},
	): Promise<void> {
		try {
			const command = new CopyObjectCommand({
				Bucket: this.bucket,
				Key: destinationKey,
				CopySource: `${this.bucket}/${sourceKey}`,
				ContentType: options.contentType,
				Metadata: options.metadata,
				CacheControl: options.cacheControl,
				ContentEncoding: options.contentEncoding,
				ContentDisposition: options.contentDisposition,
				Expires: options.expires,
			});

			await this.client.send(command);
			logger.info({ sourceKey, destinationKey }, "File copied successfully");
		} catch (error) {
			logger.error({ error, sourceKey, destinationKey }, "Failed to copy file");
			throw error;
		}
	}

	/**
	 * Get storage usage statistics
	 */
	async getStats(
		prefix?: string,
	): Promise<{ count: number; totalSize: number }> {
		let count = 0;
		let totalSize = 0;
		let continuationToken: string | undefined;

		try {
			do {
				const response = await this.list({
					prefix,
					maxKeys: 1000,
					continuationToken,
				});

				count += response.contents.length;
				totalSize += response.contents.reduce((sum, obj) => sum + obj.size, 0);
				continuationToken = response.nextContinuationToken;
			} while (continuationToken);

			return { count, totalSize };
		} catch (error) {
			logger.error({ error, prefix }, "Failed to get storage stats");
			throw error;
		}
	}

	/**
	 * Health check for the storage service
	 */
	async healthCheck(): Promise<{
		healthy: boolean;
		latency: number;
		error?: string;
	}> {
		const start = Date.now();

		try {
			await this.list({ maxKeys: 1 });
			const latency = Date.now() - start;

			return { healthy: true, latency };
		} catch (error) {
			const latency = Date.now() - start;
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			return {
				healthy: false,
				latency,
				error: errorMessage,
			};
		}
	}
}

export const storage = new Storage();
export {
	Storage,
	type FileMetadata,
	type FileOptions,
	type StorageConfig,
	type UploadOptions,
};
