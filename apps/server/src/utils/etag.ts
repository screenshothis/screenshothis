export function generateETag(
	cacheKey: string,
	format: string,
	timestamp: number,
	additionalEntropy?: {
		s3Key?: string;
		s3ETag?: string;
		fileSize?: number;
	},
): string {
	// Always ensure we have a valid timestamp
	const safeTimestamp = timestamp || Date.now();

	// Build content with multiple entropy sources
	const baseContent = `${cacheKey}-${format}-${safeTimestamp}`;

	// Add additional entropy if available (S3 metadata provides strong uniqueness)
	const entropyParts = [baseContent];
	if (additionalEntropy?.s3Key) {
		entropyParts.push(`key:${additionalEntropy.s3Key}`);
	}
	if (additionalEntropy?.s3ETag) {
		entropyParts.push(`etag:${additionalEntropy.s3ETag}`);
	}
	if (additionalEntropy?.fileSize) {
		entropyParts.push(`size:${additionalEntropy.fileSize}`);
	}

	const content = entropyParts.join("|");
	const hasher = new Bun.CryptoHasher("sha256");
	hasher.update(content);
	return `"${hasher.digest("hex").slice(0, 16)}"`;
}
