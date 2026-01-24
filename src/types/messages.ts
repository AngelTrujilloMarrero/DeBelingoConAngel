export interface ImageInfo {
  url: string;
  name: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
}

export interface Message {
  id: string;
  text: string;
  timestamp: number;
  author: string;
  replyTo?: string;      // ID del mensaje principal si es una respuesta
  repliesCount?: number;  // Número de respuestas
  depth?: number;        // Profundidad del hilo (0 = mensaje principal)
  imageUrl?: string;     // URL de la imagen subida a Imgur
  imageInfo?: ImageInfo; // Metadatos de la imagen
}

export interface MessageWithReplies {
  id: string;
  text: string;
  timestamp: number;
  author: string;
  replyTo?: string;
  depth?: number;
  replies?: MessageWithReplies[];  // Respuestas anidadas
  imageUrl?: string;     // URL de la imagen subida a Imgur
  imageInfo?: ImageInfo; // Metadatos de la imagen
}