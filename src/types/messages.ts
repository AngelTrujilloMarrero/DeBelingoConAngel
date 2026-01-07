export interface Message {
  id: string;
  text: string;
  timestamp: number;
  author: string;
  replyTo?: string;      // ID del mensaje principal si es una respuesta
  repliesCount?: number;  // Número de respuestas
  depth?: number;        // Profundidad del hilo (0 = mensaje principal)
}

export interface MessageWithReplies {
  id: string;
  text: string;
  timestamp: number;
  author: string;
  replyTo?: string;
  depth?: number;
  replies?: MessageWithReplies[];  // Respuestas anidadas
}