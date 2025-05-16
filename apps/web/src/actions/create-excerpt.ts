export function createExcerpt(content: string, maxLength = 200) {
	let cleanText = content
		.replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
		.replace(/\[.*?\]\(.*?\)/g, "") // Remove links
		.replace(/[`*_~>]/g, "") // Remove Markdown special characters
		.replace(/#+\s/g, "") // Remove headers
		.replace(/-\s/g, "") // Remove list markers
		.replace(/\r?\n|\r/g, " ") // Convert line breaks to spaces
		.replace(/\s+/g, " ") // Collapse multiple spaces
		.trim();

	// Truncate the text to the desired length, preserving whole words
	if (cleanText.length > maxLength) {
		cleanText = `${cleanText.slice(0, maxLength).trim()}...`;
	}

	return cleanText;
}
