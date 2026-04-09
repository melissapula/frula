/**
 * Browser-side image compression for listing photos.
 *
 * Runs every uploaded photo through a canvas pipeline that:
 *  1. Resizes to a max edge length (default 2400px) preserving aspect ratio
 *  2. Re-encodes as JPEG at the target quality
 *  3. Returns the original File untouched if it's already small/efficient
 *
 * This solves three real problems:
 *  - Cloudinary's free plan caps uploads at 10 MB. Modern iPhone JPEGs can
 *    easily exceed that, leaving sellers with broken-looking upload errors.
 *  - Even smaller files (4-6 MB) burn the seller's data budget and slow
 *    down the upload progress bar dramatically.
 *  - Listing pages load faster for buyers because the source image is
 *    closer to the display size.
 *
 * Notes:
 *  - HEIC isn't natively decodable by canvas in most browsers. iOS Safari
 *    will usually serve up a JPEG when the file picker reads a Photos-app
 *    HEIC, but if a true .heic somehow lands here we pass it through and
 *    let Cloudinary handle the conversion (Cloudinary supports HEIC).
 *  - We never upscale. If a user uploads a 600px image we leave it alone.
 */

export interface CompressOptions {
    /** Longest-edge in pixels. Anything over is scaled down. */
    maxEdge?: number
    /** JPEG quality 0–1. */
    quality?: number
    /** Skip compression entirely if the file is already smaller than this. */
    skipBelowBytes?: number
}

const DEFAULTS: Required<CompressOptions> = {
    maxEdge: 2400,
    quality: 0.85,
    // 800 KB — small enough that re-encoding wouldn't meaningfully save space
    skipBelowBytes: 800 * 1024,
}

export function useImageCompression() {
    async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
        const { maxEdge, quality, skipBelowBytes } = { ...DEFAULTS, ...opts }

        // Bail out for non-images, tiny files, and HEIC (let Cloudinary handle)
        if (!file.type.startsWith('image/')) return file
        if (file.size <= skipBelowBytes) return file
        if (file.type === 'image/heic' || file.type === 'image/heif') return file

        let bitmap: ImageBitmap | null = null
        try {
            // createImageBitmap is faster + handles EXIF orientation correctly
            bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
        } catch {
            // Some browsers (older Safari) don't support imageOrientation option.
            // Fall back to createImageBitmap without options, then to <img>.
            try {
                bitmap = await createImageBitmap(file)
            } catch {
                return file // give up — return original
            }
        }

        const { width: srcW, height: srcH } = bitmap
        const longest = Math.max(srcW, srcH)
        const scale = longest > maxEdge ? maxEdge / longest : 1
        const dstW = Math.round(srcW * scale)
        const dstH = Math.round(srcH * scale)

        // OffscreenCanvas where supported (faster, works in workers); fall
        // back to a regular canvas in older browsers.
        const canvas: HTMLCanvasElement | OffscreenCanvas =
            typeof OffscreenCanvas !== 'undefined'
                ? new OffscreenCanvas(dstW, dstH)
                : Object.assign(document.createElement('canvas'), { width: dstW, height: dstH })

        const ctx = canvas.getContext('2d') as
            | CanvasRenderingContext2D
            | OffscreenCanvasRenderingContext2D
            | null
        if (!ctx) {
            bitmap.close?.()
            return file
        }

        ctx.drawImage(bitmap, 0, 0, dstW, dstH)
        bitmap.close?.()

        // Encode as JPEG (universal, smallest for photos)
        let blob: Blob | null
        if (canvas instanceof OffscreenCanvas) {
            blob = await canvas.convertToBlob({ type: 'image/jpeg', quality })
        } else {
            blob = await new Promise<Blob | null>((resolve) =>
                (canvas as HTMLCanvasElement).toBlob(resolve, 'image/jpeg', quality),
            )
        }

        if (!blob) return file

        // If compression somehow grew the file (rare for photos, possible
        // for already-optimized JPEGs), keep the original.
        if (blob.size >= file.size) return file

        const newName = file.name.replace(/\.(heic|heif|png|webp|gif)$/i, '.jpg')
        return new File([blob], newName.endsWith('.jpg') ? newName : `${newName}.jpg`, {
            type: 'image/jpeg',
            lastModified: file.lastModified,
        })
    }

    return { compressImage }
}
