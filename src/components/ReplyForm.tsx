import React, { useState } from 'react';
import { Send, X, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { ImageInfo } from '@/types/messages';

interface ReplyFormProps {
  messageId: string;
  messageAuthor: string;
  onSubmit: (messageId: string, text: string, imageUrl?: string, imageInfo?: ImageInfo) => Promise<void>;
  onCancel: () => void;
}

const ReplyForm: React.FC<ReplyFormProps> = ({ messageId, messageAuthor, onSubmit, onCancel }) => {
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: '' });
  const [userCaptcha, setUserCaptcha] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);

  React.useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10);
    const n2 = Math.floor(Math.random() * 5) + 1;
    setCaptcha({ num1: n1, num2: n2, answer: (n1 + n2).toString() });
    setUserCaptcha('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyText.trim() || sending) return;

    if (userCaptcha !== captcha.answer) {
      setStatus({ type: 'error', message: 'Captcha incorrecto' });
      generateCaptcha();
      return;
    }

    setSending(true);
    setStatus({ type: null, message: '' });

    try {
      await onSubmit(messageId, replyText.trim(), imageUrl || undefined, imageInfo || undefined);
      setReplyText('');
      setUserCaptcha('');
      setImageUrl('');
      setImageInfo(null);
      setShowImageUpload(false);
      generateCaptcha();
      setStatus({ type: 'success', message: '¡Respuesta enviada!' });

      setTimeout(() => {
        onCancel(); // Cerrar el formulario después de enviar
      }, 1500);

    } catch (error) {
      console.error('Error:', error);
      setStatus({ type: 'error', message: 'Error al enviar respuesta' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="ml-4 md:ml-8 mt-3 p-4 bg-gray-800/50 rounded-lg border-l-4 border-blue-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <MessageSquare className="w-4 h-4 text-blue-400" />
          <span>Respondiendo a {messageAuthor}</span>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Textarea */}
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Escribe tu respuesta..."
          className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          maxLength={150}
          disabled={sending}
        />

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{replyText.length}/150 caracteres</span>
          <button
            type="button"
            onClick={() => setShowImageUpload(!showImageUpload)}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
            disabled={sending}
          >
            <ImageIcon className="w-4 h-4" />
            {imageUrl ? 'Imagen añadida' : 'Añadir imagen'}
          </button>
        </div>

        {/* Image Upload */}
        {showImageUpload && (
          <div className="mt-3">
            <ImageUpload
              onImageUploaded={(url, info) => {
                setImageUrl(url);
                setImageInfo(info);
              }}
              disabled={sending}
              className="mb-3"
            />
          </div>
        )}

        {/* Captcha */}
        <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
          <div className="flex items-center gap-2 text-white">
            <span className="font-mono">{captcha.num1} + {captcha.num2} =</span>
            <input
              type="text"
              value={userCaptcha}
              onChange={(e) => setUserCaptcha(e.target.value)}
              placeholder="?"
              className="w-12 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={sending}
            />
          </div>
        </div>

        {/* Estado */}
        {status.message && (
          <div className={`text-sm p-2 rounded ${status.type === 'success' ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
            {status.message}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={sending || !replyText.trim() || !userCaptcha}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Enviando...' : 'Responder'}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={sending}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReplyForm;