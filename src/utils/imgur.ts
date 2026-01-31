import { ImageInfo } from '../types/messages';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

// Intentar usar Imgur primero, con fallback a almacenamiento local temporal
const IMGUR_CLIENT_IDS = import.meta.env.VITE_IMGUR_CLIENT_IDS
  ? import.meta.env.VITE_IMGUR_CLIENT_IDS.split(',').map(id => id.trim())
  : [];

// API Key de ImgBB: https://api.imgbb.com/
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

// Validar que las variables de entorno estén configuradas
if (!import.meta.env.VITE_IMGUR_CLIENT_IDS && !import.meta.env.VITE_IMGBB_API_KEY) {
  console.error('⚠️ ADVERTENCIA: No se han configurado las variables de entorno para servicios de imágenes.');
  console.error('Por favor configura VITE_IMGUR_CLIENT_IDS o VITE_IMGBB_API_KEY en tu archivo .env');
  console.error('Ver VERCEL_SETUP.md para más información.');
}

// Almacenamiento local temporal para cuando Imgur falle
let localImageStorage = new Map<string, { url: string; timestamp: number }>();

export interface ImgurUploadResponse {
  data: {
    id: string;
    title?: string;
    description?: string;
    datetime: number;
    type: string;
    animated: boolean;
    width: number;
    height: number;
    size: number;
    views: number;
    bandwidth: number;
    vote?: string;
    favorite: boolean;
    nsfw: boolean;
    section?: string;
    account_url?: string;
    account_id?: number;
    is_ad?: boolean;
    in_most_viral?: boolean;
    has_sound?: boolean;
    tags: any[];
    ad_type: number;
    ad_url: string;
    edited: '0' | '1';
    in_gallery: boolean;
    deletehash?: string;
    name: string;
    link: string;
  };
  success: boolean;
  status: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class ImgurError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ImgurError';
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
    throw new ImgurError('Solo se permiten archivos JPG y PNG');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ImgurError('El archivo no puede superar los 5MB');
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

    // Try multiple Client IDs and methods for upload
    let response: ImgurUploadResponse;
    let lastError: any = null;

    const clientIds = IMGUR_CLIENT_IDS;

    for (let i = 0; i < clientIds.length; i++) {
      const clientId = clientIds[i];
      console.log(`Trying Client ID ${i + 1}/${clientIds.length}`);

      try {
        // Method 1: Try with direct file upload
        try {
          const formData = new FormData();
          formData.append('image', file);

          const fetchResponse = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
              'Authorization': `Client-ID ${clientId}`,
              'Accept': 'application/json'
            },
            body: formData
          });

          if (fetchResponse.ok) {
            response = await fetchResponse.json();
            console.log('Success with Client ID:', clientId);
            break;
          } else {
            const errorText = await fetchResponse.text();
            let errorMessage = 'Upload failed';

            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.data?.error || errorMessage;
              console.error('Imgur API Error:', errorData);

              // If rate limited, try next Client ID
              if (fetchResponse.status === 429) {
                console.log('Rate limited, trying next Client ID...');
                continue;
              }
            } catch {
              errorMessage = `Upload failed with status ${fetchResponse.status}`;
            }

            lastError = new ImgurError(errorMessage, fetchResponse.status);

            // Try base64 method with same client ID
            try {
              console.log('Trying base64 method with Client ID:', clientId);
              const base64 = await readFileAsBase64(file);
              const formData64 = new FormData();
              formData64.append('image', base64);
              formData64.append('type', 'base64');

              const base64Response = await fetch('https://api.imgur.com/3/image', {
                method: 'POST',
                headers: {
                  'Authorization': `Client-ID ${clientId}`,
                  'Accept': 'application/json'
                },
                body: formData64
              });

              if (base64Response.ok) {
                response = await base64Response.json();
                console.log('Success with base64, Client ID:', clientId);
                lastError = null;
                break;
              } else if (base64Response.status === 429) {
                console.log('Base64 method also rate limited, continuing...');
                continue;
              }
            } catch (base64Error) {
              console.error('Base64 method failed:', base64Error);
            }
          }
        } catch (fetchError) {
          console.error(`Client ID ${clientId} failed:`, fetchError);
          lastError = fetchError;
        }
      } catch (error) {
        console.error(`Client ID ${clientId} failed:`, error);
        lastError = error;
      }
    }

    if (lastError && response === undefined) {
      console.log('Imgur falló, intentando fallback con ImgBB...');
      try {
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
        console.error('Error en fallback ImgBB:', imgbbError);
        throw new ImgurError('No se pudo subir la imagen (Imgur e ImgBB fallaron).');
      }
    }

    if (onProgress) {
      onProgress({
        loaded: file.size,
        total: file.size,
        percentage: 100
      });
    }

    if (!response.success) {
      throw new ImgurError('Upload failed');
    }

    // Check for NSFW content
    if (response.data.nsfw) {
      throw new ImgurError('El contenido de la imagen no es apropiado para este sitio');
    }

    const imageInfo: ImageInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      width: response.data.width,
      height: response.data.height
    };

    return {
      url: response.data.link,
      info: imageInfo
    };

  } catch (error) {
    if (error instanceof ImgurError) {
      throw error;
    }
    throw new ImgurError('Error desconocido al subir la imagen');
  }
}

export async function uploadToImgBB(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  if (result.success) {
    return result.data.url;
  } else {
    throw new Error(result.error?.message || 'Fallo al subir a ImgBB');
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