/**
 * Secure Image Upload Service
 * Uses Vercel serverless functions to protect API keys
 */

import { ImageInfo } from '../types/messages';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

// Determinar la URL base de la API según el entorno
// En producción, usar la URL de Vercel (backend separado)
// En desarrollo, usar rutas relativas (Vercel dev)
const API_BASE_URL = import.meta.env.VITE_VERCEL_API_URL ||
    (import.meta.env.PROD
        ? 'https://de-belingo-con-angel.vercel.app'
        : '');

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export class ImageUploadError extends Error {
    constructor(
        message: string,
        public status?: number,
        public response?: any
    ) {
        super(message);
        this.name = 'ImageUploadError';
    }
}

function validateFile(file: File): void {
    console.log('Validating file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        sizeMB: (file.size / 1024 / 1024).toFixed(2)
    });

    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new ImageUploadError('Solo se permiten archivos JPG y PNG');
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new ImageUploadError('El archivo no puede superar los 5MB');
    }

    console.log('File validation passed');
}

function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data:image/...;base64, prefix
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Helper function to get image dimensions
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
            URL.revokeObjectURL(img.src);
        };
        img.onerror = () => {
            resolve({ width: 0, height: 0 });
        };
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Upload image to ImgBB via Vercel serverless function
 */
export async function uploadToImgBB(file: File): Promise<string> {
    try {
        validateFile(file);
        const base64 = await readFileAsBase64(file);

        const response = await fetch(`${API_BASE_URL}/api/upload-imgbb`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: base64 })
        });

        const result = await response.json();

        if (result.success) {
            return result.url;
        } else {
            throw new ImageUploadError(result.error || 'Upload failed');
        }
    } catch (error) {
        if (error instanceof ImageUploadError) {
            throw error;
        }
        throw new ImageUploadError('Error al subir imagen a ImgBB');
    }
}

/**
 * Upload image to Imgur via Vercel serverless function
 */
export async function uploadToImgur(
    file: File,
    onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string; info: ImageInfo }> {
    try {
        validateFile(file);

        // Simulate progress for better UX
        if (onProgress) {
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 20;
                if (progress > 90) progress = 90;
                onProgress({
                    loaded: Math.floor((progress / 100) * file.size),
                    total: file.size,
                    percentage: progress
                });
            }, 200);

            setTimeout(() => clearInterval(progressInterval), 5000);
        }

        const base64 = await readFileAsBase64(file);

        // Call Vercel serverless function
        const response = await fetch(`${API_BASE_URL}/api/upload-imgur`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: base64 })
        });

        const result = await response.json();

        if (onProgress) {
            onProgress({
                loaded: file.size,
                total: file.size,
                percentage: 100
            });
        }

        if (result.success) {
            const dimensions = result.data || await getImageDimensions(file);

            const imageInfo: ImageInfo = {
                name: file.name,
                size: file.size,
                type: file.type,
                width: dimensions.width,
                height: dimensions.height
            };

            return {
                url: result.url,
                info: imageInfo
            };
        } else {
            throw new ImageUploadError(result.error || 'Upload failed');
        }
    } catch (error) {
        if (error instanceof ImageUploadError) {
            throw error;
        }
        throw new ImageUploadError('Error al subir imagen a Imgur');
    }
}

/**
 * Upload with automatic fallback
 * Tries Imgur first, falls back to ImgBB if needed
 */
export async function uploadImage(
    file: File,
    onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string; info: ImageInfo }> {
    try {
        // Try Imgur first
        return await uploadToImgur(file, onProgress);
    } catch (imgurError) {
        console.warn('Imgur upload failed, trying ImgBB fallback...', imgurError);

        try {
            // Fallback to ImgBB
            const imgbbUrl = await uploadToImgBB(file);
            const dimensions = await getImageDimensions(file);

            const imageInfo: ImageInfo = {
                name: file.name,
                size: file.size,
                type: file.type,
                width: dimensions.width,
                height: dimensions.height
            };

            return {
                url: imgbbUrl,
                info: imageInfo
            };
        } catch (imgbbError) {
            console.error('ImgBB fallback also failed:', imgbbError);
            throw new ImageUploadError('No se pudo subir la imagen. Intenta de nuevo.');
        }
    }
}

export function validateImageUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.includes('imgur.com') || urlObj.hostname.includes('ibb.co');
    } catch {
        return false;
    }
}
