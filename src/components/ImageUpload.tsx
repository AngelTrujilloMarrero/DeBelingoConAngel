import React, { useState, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { cn } from '@/lib/utils';
import { uploadToImgur, UploadProgress, ImgurError } from '@/utils/imgur';
import { ImageInfo } from '@/types/messages';

interface ImageUploadProps {
  onImageUploaded: (url: string, info: ImageInfo) => void;
  className?: string;
  disabled?: boolean;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
}

interface UploadedPreview {
  url: string;
  info: ImageInfo;
  preview: string;
}

export function ImageUpload({
  onImageUploaded,
  className,
  disabled = false,
  maxSize = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg']
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<UploadedPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return 'Solo se permiten archivos JPG y PNG';
    }
    if (file.size > maxSize) {
      return `El archivo no puede superar los ${Math.round(maxSize / 1024 / 1024)}MB`;
    }
    return null;
  }, [acceptedTypes]);

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview({
      url: '',
      info: {
        name: file.name,
        size: file.size,
        type: file.type
      },
      preview: previewUrl
    });

    try {
      const result = await uploadToImgur(file, (progress) => {
        setUploadProgress(progress);
      });

      // Clean up preview blob
      if (preview) {
        URL.revokeObjectURL(preview.preview);
      }

      setPreview({
        url: result.url,
        info: result.info,
        preview: result.url
      });

      onImageUploaded(result.url, result.info);
    } catch (err) {
      if (err instanceof ImgurError) {
        setError(err.message);

        // Special handling for local storage fallback
        if (err.message.includes('local temporary storage')) {
          setError('✅ Imagen guardada localmente (temporal). Cuando Imgur esté disponible, se subirán automáticamente.');
        }
      } else {
        setError('Error al subir la imagen');
      }

      if (preview) {
        URL.revokeObjectURL(preview.preview);
        setPreview(null);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [validateFile, maxSize, onImageUploaded, preview]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      handleFile(imageFile);
    }
  }, [disabled, isUploading, handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFile]);

  const handleRemoveImage = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview.preview);
      setPreview(null);
    }
    onImageUploaded('', {} as ImageInfo);
  }, [preview, onImageUploaded]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (preview?.url) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="relative group">
          <img
            src={preview.preview}
            alt="Preview"
            className="max-w-full h-auto rounded-lg border border-zinc-200 dark:border-zinc-700"
            style={{ maxHeight: '200px' }}
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemoveImage}
            disabled={disabled}
          >
            ✕
          </Button>
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {preview.info.name} • {formatFileSize(preview.info.size)}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-zinc-300 dark:border-zinc-700',
          (disabled || isUploading) && 'opacity-50 pointer-events-none',
          'hover:border-zinc-400 dark:hover:border-zinc-600'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          disabled={disabled || isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="space-y-2">
          <div className="text-2xl">📷</div>
          <div className="text-sm font-medium">
            {isUploading ? 'Subiendo imagen...' : 'Arrastra una imagen aquí o haz clic para seleccionar'}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            JPG, PNG • Máx {Math.round(maxSize / 1024 / 1024)}MB
          </div>
        </div>
      </div>

      {isUploading && uploadProgress && (
        <div className="space-y-2">
          <Progress value={uploadProgress.percentage} className="w-full" />
          <div className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            {formatFileSize(uploadProgress.loaded)} / {formatFileSize(uploadProgress.total)}
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}