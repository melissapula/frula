/**
 * Browser-side Cloudinary unsigned upload.
 *
 * Requires an unsigned upload preset to be configured in your Cloudinary
 * account: Settings → Upload → "Add upload preset" → Signing mode: Unsigned.
 * Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET in `.env`.
 */

interface CloudinaryUploadResult {
    secure_url: string
    public_id: string
    width: number
    height: number
    format: string
    bytes: number
}

export interface UploadedPhoto {
    url: string
    publicId: string
    width: number
    height: number
}

export function useCloudinaryUpload() {
    const config = useRuntimeConfig()
    const cloudName = config.public.cloudinaryCloudName as string | undefined
    const uploadPreset = config.public.cloudinaryUploadPreset as string | undefined

    const isConfigured = !!(cloudName && uploadPreset)

    async function uploadFile(
        file: File,
        onProgress?: (pct: number) => void,
    ): Promise<UploadedPhoto> {
        if (!cloudName || !uploadPreset) {
            throw new Error(
                'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET in your .env.',
            )
        }

        // Use XHR rather than fetch so we can report progress to the UI
        return new Promise<UploadedPhoto>((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`)

            xhr.upload.addEventListener('progress', (e) => {
                if (onProgress && e.lengthComputable) {
                    onProgress(Math.round((e.loaded / e.total) * 100))
                }
            })

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const result: CloudinaryUploadResult = JSON.parse(xhr.responseText)

                        // Validate the response is actually from Cloudinary
                        if (
                            !result.secure_url?.startsWith('https://res.cloudinary.com/') ||
                            !result.format ||
                            !['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'gif'].includes(
                                result.format.toLowerCase(),
                            )
                        ) {
                            reject(new Error('Invalid upload response'))
                            return
                        }

                        // Reject files over 25 MB (belt + suspenders for client-side limit)
                        if (result.bytes > 25 * 1024 * 1024) {
                            reject(new Error('File too large (max 25 MB)'))
                            return
                        }

                        resolve({
                            url: result.secure_url,
                            publicId: result.public_id,
                            width: result.width,
                            height: result.height,
                        })
                    } catch (e) {
                        reject(new Error('Could not parse Cloudinary response'))
                    }
                } else {
                    let msg = 'Upload failed'
                    try {
                        const err = JSON.parse(xhr.responseText)
                        msg = err?.error?.message || msg
                    } catch {
                        // ignore
                    }
                    reject(new Error(msg))
                }
            })

            xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
            xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

            const fd = new FormData()
            fd.append('file', file)
            fd.append('upload_preset', uploadPreset)
            fd.append('folder', 'frula/listings')
            xhr.send(fd)
        })
    }

    return { uploadFile, isConfigured }
}
