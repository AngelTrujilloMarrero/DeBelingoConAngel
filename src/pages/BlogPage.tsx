import { Link } from 'react-router-dom';
import { useRSS } from '../hooks/useRSS';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, User, ArrowRight, BookOpen, RefreshCw } from 'lucide-react';

const BlogPage = () => {
  const { posts, loading, error, refreshPosts, isUsingFallback } = useRSS();

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
            <a 
              href="https://de-belingo-con-angel.hashnode.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-2xl md:text-3xl font-bold text-white hover:text-blue-400 transition-colors"
              title="Ir al blog para redactar artículos"
            >
              Blog
            </a>
            <button
              onClick={refreshPosts}
              disabled={loading}
              className="ml-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
              title="Refrescar noticias"
            >
              <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-sm text-white/80 max-w-2xl mx-auto">
            Noticias y artículos de opinión sobre las verbenas y la cultura de Tenerife
          </p>
        </div>
      </div>



      {/* Content */}
      <div className="p-4 md:p-8">
        {posts.length === 0 && !loading ? (
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
                {/* Content - Centrado sin imagen lateral */}
                <div className="p-6 md:p-8 text-center">
                  {/* Title */}
                  <Link
                    to={`/blog/${post.slug}`}
                    className="block group-hover:text-blue-400 transition-colors mb-4"
                  >
                    <h2 className="text-xl md:text-2xl font-bold text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </h2>
                  </Link>

                  {/* Brief */}
                  <p className="text-white/80 mb-6 line-clamp-3 text-justify">
                    {post.brief}
                  </p>

                  {/* Meta Information */}
                  <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-white/60 mb-6">
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
                  {(post.tags || []).length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      {(post.tags || []).map((tag) => (
                        <span
                          key={tag.slug}
                          className="inline-block px-3 py-1 bg-blue-500/30 text-blue-300 text-xs font-medium rounded-full"
                        >
                          {tag.name}
                        </span>
                      ))}
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
              </article>
            ))}
          </div>
        )}

        {/* Suscripción al newsletter */}
        <div className="mx-4 md:mx-8 mt-8 mb-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">
              📧 Suscríbete a nuestro Newsletter
            </h3>
            <p className="text-white/70 text-sm mb-4">
              Recibe las últimas noticias de De Belingo con Ángel directamente en tu correo
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
              id="newsletter-email"
            />
            <button
              onClick={() => {
                const email = (document.getElementById('newsletter-email') as HTMLInputElement)?.value;
                if (email && email.includes('@')) {
                  window.open(`https://de-belingo-con-angel.hashnode.dev/newsletter?email=${encodeURIComponent(email)}`, '_blank');
                } else {
                  alert('Por favor, introduce un correo electrónico válido');
                }
              }}
              className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
            >
              Suscribirse
            </button>
          </div>
          
          <p className="text-center text-white/60 text-xs mt-3">
            No spam. Solo noticias importantes sobre nuestras verbenas y eventos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;