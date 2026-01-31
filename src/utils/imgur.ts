/**
 * Image Upload Utilities
 * 
 * SECURE VERSION: Uses Vercel serverless functions to protect API keys
 * The actual API keys are stored in Vercel environment variables
 * and never exposed to the client.
 */

export {
  uploadToImgur,
  uploadToImgBB,
  uploadImage,
  validateImageUrl,
  ImageUploadError,
  type UploadProgress
} from './secureImageUpload';

// Re-export types for backwards compatibility
export type { ImageInfo } from '../types/messages';

// Legacy exports (deprecated, but kept for compatibility)
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

/**
 * @deprecated Use ImageUploadError from secureImageUpload instead
 */
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