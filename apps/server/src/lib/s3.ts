import { S3Client } from "bun";

export const s3 = new S3Client({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	endpoint: process.env.AWS_ENDPOINT,
	region: process.env.AWS_REGION,
	bucket: process.env.AWS_BUCKET,
});
