/**
 * Compress an image File before upload. Resizes the longest edge to `maxEdge`
 * and re-encodes as JPEG at the given quality. Typical mobile photos (~8MB)
 * drop to 300-700KB while staying visually crisp at listing-card sizes.
 *
 * Returns the original file if the browser can't decode it (rare) or if the
 * compressed result would be larger than the original.
 */
export async function compressImage(
	file: File,
	opts: { maxEdge?: number; quality?: number } = {}
): Promise<File> {
	const maxEdge = opts.maxEdge ?? 1920;
	const quality = opts.quality ?? 0.82;

	if (!file.type.startsWith("image/")) return file;

	const dataUrl = await readAsDataURL(file);
	const img = await loadImage(dataUrl);

	const { width, height } = img;
	const longest = Math.max(width, height);
	const scale = longest > maxEdge ? maxEdge / longest : 1;
	const targetW = Math.round(width * scale);
	const targetH = Math.round(height * scale);

	const canvas = document.createElement("canvas");
	canvas.width = targetW;
	canvas.height = targetH;
	const ctx = canvas.getContext("2d");
	if (!ctx) return file;
	ctx.drawImage(img, 0, 0, targetW, targetH);

	const blob: Blob | null = await new Promise((resolve) =>
		canvas.toBlob(resolve, "image/jpeg", quality)
	);
	if (!blob || blob.size >= file.size) return file;

	const baseName = file.name.replace(/\.[^.]+$/, "");
	return new File([blob], `${baseName}.jpg`, {
		type: "image/jpeg",
		lastModified: Date.now(),
	});
}

function readAsDataURL(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const fr = new FileReader();
		fr.onload = () => resolve(fr.result as string);
		fr.onerror = () => reject(fr.error ?? new Error("Failed to read file"));
		fr.readAsDataURL(file);
	});
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error("Failed to decode image"));
		img.src = src;
	});
}
