import { Link } from 'react-router-dom';
import { useHashnode } from '../hooks/useHashnode';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, User, ArrowRight, BookOpen } from 'lucide-react';

const BlogPage = () => {
  const { posts, loading, error } = useHashnode();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white/70">Cargando artículos del blog...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-white/70">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white min-h-screen">
      {/* Header simple sin imagen de fondo */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <BookOpen className="w-6 h-6 text-white mr-2" />
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Blog
            </h1>
          </div>
          <p className="text-sm text-white/80 max-w-2xl mx-auto">
            Noticias y artículos de opinión sobre las verbenas y la cultura de Tenerife
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-8">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-white/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              No hay artículos disponibles
            </h2>
            <p className="text-white/70">
              Pronto habrá nuevo contenido en el blog. ¡Vuelve a visitarnos!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 backdrop-blur-sm rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden group"
              >
                <div className="md:flex">
                  {/* Image */}
                  {post.coverImage?.url && (
                    <div className="md:w-1/3">
                      <div className="h-48 md:h-full">
                        <img
                          src={post.coverImage.url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="md:w-2/3 p-6 md:p-8">
                    {/* Title */}
                    <Link
                      to={`/blog/${post.slug}`}
                      className="block group-hover:text-blue-400 transition-colors"
                    >
                      <h2 className="text-xl md:text-2xl font-bold text-white mb-3 line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {post.title}
                      </h2>
                    </Link>

                    {/* Brief */}
                    <p className="text-white/80 mb-4 line-clamp-3">
                      {post.brief}
                    </p>

                    {/* Meta Information */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 mb-4">
                      {/* Author */}
                      <div className="flex items-center">
                        {post.author.profilePicture && (
                          <img
                            src={post.author.profilePicture}
                            alt={post.author.name}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                        )}
                        <User className="w-4 h-4 mr-1" />
                        <span>{post.author.name}</span>
                      </div>

                      {/* Date */}
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>
                          {format(new Date(post.publishedAt), 'd MMM yyyy', { locale: es })}
                        </span>
                      </div>

                      {/* Read Time */}
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{post.readTimeInMinutes} min</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.slug}
                            className="inline-block px-2 py-1 bg-blue-500/30 text-blue-300 text-xs font-medium rounded"
                          >
                            {tag.name}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="inline-block px-2 py-1 bg-white/20 text-white/60 text-xs font-medium rounded">
                            +{post.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Read More Link */}
                    <Link
                      to={`/blog/${post.slug}`}
                      className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Leer artículo completo
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;