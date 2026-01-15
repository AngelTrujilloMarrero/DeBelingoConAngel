import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useHashnode, BlogPost } from '../hooks/useHashnode';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Calendar, Clock, User, Tag } from 'lucide-react';

const BlogPostComponent = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getPostBySlug } = useHashnode();

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        const postData = await getPostBySlug(slug);
        if (postData) {
          setPost(postData);
        } else {
          setError('Artículo no encontrado');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el artículo');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug, getPostBySlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-white/70 mb-6">{error || 'Artículo no encontrado'}</p>
          <Link
            to="/blog"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white min-h-screen">
      <div className="p-4 md:p-8">
        {/* Back button */}
        <Link
          to="/blog"
          className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Blog
        </Link>

        {/* Article Header */}
        <article className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          {/* Cover Image */}
          {post.coverImage?.url && (
            <div className="w-full h-64 md:h-96">
              <img
                src={post.coverImage.url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="p-8">
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {post.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 mb-8 pb-6 border-b border-white/20">
              {/* Author */}
              <div className="flex items-center">
                {post.author.profilePicture && (
                  <img
                    src={post.author.profilePicture}
                    alt={post.author.name}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                )}
                <User className="w-4 h-4 mr-1" />
                <span>{post.author.name}</span>
              </div>

              {/* Date */}
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>
                  {format(new Date(post.publishedAt), 'd MMMM yyyy', { locale: es })}
                </span>
              </div>

              {/* Read Time */}
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>{post.readTimeInMinutes} min de lectura</span>
              </div>
            </div>

            {/* Tags */}
            {(post.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {(post.tags || []).map((tag) => (
                  <span
                    key={tag.slug}
                    className="inline-flex items-center px-3 py-1 bg-blue-500/30 text-blue-300 text-xs font-medium rounded-full"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Article Body */}
            <div
              className="prose prose-lg prose-invert max-w-none prose-headings:text-white prose-p:text-white/90 prose-strong:text-white prose-li:text-white/90 prose-blockquote:text-white/70 prose-code:text-white prose-blockquote:border-l-blue-500/50"
              dangerouslySetInnerHTML={{ __html: post.content.html }}
            />

            {/* Brief */}
            {post.brief && (
              <div className="mt-8 pt-6 border-t border-white/20">
                <h3 className="text-lg font-semibold text-white mb-2">Resumen</h3>
                <p className="text-white/70 italic">{post.brief}</p>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
};

export default BlogPostComponent;