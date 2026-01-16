import { useState, useEffect, useCallback } from 'react';
import { staticPosts } from '../data/staticPosts';

export interface BlogPost {
  id: string;
  title: string;
  brief: string;
  slug: string;
  coverImage?: {
    url: string;
  };
  publishedAt: string;
  readTimeInMinutes: number;
  author: {
    name: string;
    profilePicture?: string;
  };
  content: {
    html: string;
    markdown: string;
  };
  tags: {
    name: string;
    slug: string;
  }[];
}

// Cache con expiración
let cachedPosts: BlogPost[] = [];
let cachedAt: number = 0;
let fetchPromise: Promise<BlogPost[]> | null = null;

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos (más agresivo)

// API GraphQL de Hashnode
const HASHNODE_API = 'https://gql.hashnode.com/';
const PUBLICATION_HOST = 'de-belingo-con-angel.hashnode.dev';

// Función fallback que usa posts estáticos
const getFallbackPosts = (): BlogPost[] => {
  console.log('Using fallback posts from static data');
  return staticPosts.map(post => ({
    ...post,
    id: `fallback-${post.id}`,
    url: `https://de-belingo-con-angel.hashnode.dev/${post.slug}`
  }));
};

// Método principal usando la técnica exacta de belingo_viewer.html
const fetchFromHashnodeAPI = async (): Promise<BlogPost[]> => {
  try {
    console.log('Fetching from Hashnode GraphQL API (belingo_viewer.html method)...');

    const timestamp = new Date().getTime();

    // Query mejorada con contenido completo del artículo
    const query = `
      query GetUserArticles($host: String!) {
        publication(host: $host) {
          id
          posts(first: 10) {
            edges {
              node {
                id
                title
                brief
                url
                publishedAt
                coverImage {
                  url
                }
                content {
                  html
                  markdown
                }
                readTimeInMinutes
                author {
                  name
                  profilePicture
                }
                tags {
                  name
                  slug
                }
              }
            }
          }
        }
      }
    `;

    // Headers exactamente igual que belingo_viewer.html
    const response = await fetch(`${HASHNODE_API}?nocache=${timestamp}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({
        query: query,
        variables: { 
          host: PUBLICATION_HOST,
          // Este valor no hace nada en la lógica pero cambia el hash de la petición
          _cb: timestamp 
        }
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`Hashnode API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    
    if (!result.data?.publication) {
      throw new Error("Publicación no encontrada.");
    }

    const posts = result.data.publication.posts.edges.map((edge: any) => edge.node);

    if (posts.length === 0) {
      console.warn('No posts found from Hashnode API');
      return [];
    }

    console.log(`Successfully fetched ${posts.length} posts from Hashnode API`);

    // Convertir al formato BlogPost con datos reales
    return posts.map((post: any) => ({
      id: post.id,
      title: post.title,
      brief: post.brief || '',
      slug: post.url ? post.url.split('/').pop() : post.id,
      coverImage: post.coverImage,
      publishedAt: post.publishedAt,
      readTimeInMinutes: post.readTimeInMinutes || 3,
      author: {
        name: post.author?.name || 'De Belingo con Ángel',
        profilePicture: post.author?.profilePicture || 'https://debelingoconangel.web.app/fotos/dbca.jpg'
      },
      content: {
        html: post.content?.html || `<p>${post.brief || ''}</p>`,
        markdown: post.content?.markdown || post.brief || ''
      },
      tags: post.tags || [],
      url: post.url
    }));

  } catch (error) {
    console.error('Error fetching from Hashnode API:', error);
    throw error;
  }
};

// Método alternativo: API REST de Hashnode
const fetchFromHashnodeREST = async (): Promise<BlogPost[]> => {
  try {
    console.log('Trying Hashnode REST API...');
    
    const response = await fetch(`https://hashnode.com/api/contests/contestants`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Hashnode REST API error: ${response.status}`);
    }

    // Esta API puede no devolver posts, pero intentamos
    const data = await response.json();
    console.log('Hashnode REST API response:', data);
    
    return []; // No posts from this endpoint
  } catch (error) {
    console.warn('Hashnode REST API failed:', error);
    return [];
  }
};

// Intentar obtener posts del RSS directamente (sin proxies)
const fetchRSSDirect = async (): Promise<BlogPost[]> => {
  try {
    console.log('Trying direct RSS fetch...');
    
    const timestamp = Date.now();
    const response = await fetch(`https://de-belingo-con-angel.hashnode.dev/rss.xml?_t=${timestamp}&force_refresh=1`, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; DebelingoBlog/1.0; +https://debelingoconangel.web.app)',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      cache: 'no-store',
      mode: 'cors',
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`RSS fetch error: ${response.status}`);
    }

    const xmlText = await response.text();
    
    // Parsear RSS básico
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const items = xmlDoc.querySelectorAll('item');
    const posts: BlogPost[] = [];

    items.forEach((item) => {
      const title = item.querySelector('title')?.textContent;
      const link = item.querySelector('link')?.textContent;
      const description = item.querySelector('description')?.textContent;
      const pubDate = item.querySelector('pubDate')?.textContent;

      if (title && link) {
        posts.push({
          id: link,
          title,
          brief: description?.replace(/<[^>]*>/g, '').substring(0, 200) + '...' || '',
          slug: link.split('/').pop() || '',
          publishedAt: pubDate || new Date().toISOString(),
          readTimeInMinutes: 3,
          author: {
            name: 'De Belingo con Ángel',
            profilePicture: 'https://debelingoconangel.web.app/fotos/dbca.jpg'
          },
          content: {
            html: description || '',
            markdown: ''
          },
          tags: []
        });
      }
    });

    console.log(`Successfully parsed ${posts.length} posts from RSS`);
    return posts;

  } catch (error) {
    console.warn('Direct RSS fetch failed:', error);
    return [];
  }
};

const fetchBlogPosts = async (): Promise<BlogPost[]> => {
  const now = Date.now();
  
  // Usar caché si está disponible y no ha expirado
  if (cachedPosts.length > 0 && (now - cachedAt) < CACHE_DURATION) {
    return cachedPosts;
  }
  
  // Si hay una petición en curso, usar esa
  if (fetchPromise) {
    return fetchPromise;
  }
  
  fetchPromise = new Promise<BlogPost[]>(async (resolve) => {
    let posts: BlogPost[] = [];
    let lastError: Error | null = null;
    
    // Método 1: API GraphQL de Hashnode
    try {
      posts = await fetchFromHashnodeAPI();
      if (posts.length > 0) {
        console.log('Success with Hashnode GraphQL API');
        cachedPosts = posts;
        cachedAt = now;
        resolve(posts);
        return;
      }
    } catch (error) {
      lastError = error as Error;
      console.warn('Hashnode GraphQL API failed:', error);
    }
    
    // Método 2: RSS directo
    try {
      posts = await fetchRSSDirect();
      if (posts.length > 0) {
        console.log('Success with direct RSS');
        cachedPosts = posts;
        cachedAt = now;
        resolve(posts);
        return;
      }
    } catch (error) {
      lastError = error as Error;
      console.warn('Direct RSS failed:', error);
    }
    
    // Método 3: API REST (backup)
    try {
      posts = await fetchFromHashnodeREST();
      if (posts.length > 0) {
        console.log('Success with Hashnode REST API');
        cachedPosts = posts;
        cachedAt = now;
        resolve(posts);
        return;
      }
    } catch (error) {
      lastError = error as Error;
      console.warn('Hashnode REST API failed:', error);
    }
    
    // Si todo falla, usar fallback
    console.warn('All methods failed, using fallback posts');
    const fallbackPosts = getFallbackPosts();
    cachedPosts = fallbackPosts;
    cachedAt = now;
    resolve(fallbackPosts);
  });
  
  return fetchPromise;
};

export const useRSS = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  const refreshPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Limpieza agresiva de caché como en belingo_viewer.html
      cachedPosts = [];
      cachedAt = 0;
      fetchPromise = null;
      
      // Forzar limpieza de caches del navegador
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        } catch (e) {
          console.warn('Could not clear caches:', e);
        }
      }
      
      // Forzar recarga completa sin caché
      const data = await fetchBlogPosts();
      setPosts(data);
      
      // Detectar si estamos usando fallback
      const usingFallback = data.length > 0 && data[0].id.startsWith('fallback-');
      setIsUsingFallback(usingFallback);
      
      if (usingFallback) {
        setError('No se pudieron cargar los posts del blog. Mostrando contenido de ejemplo.');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar el blog';
      setError(errorMessage);
      const fallbackPosts = getFallbackPosts();
      setPosts(fallbackPosts);
      setIsUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const loadPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchBlogPosts();
        
        if (mounted) {
          setPosts(data);
          
          // Detectar si estamos usando fallback
          const usingFallback = data.length > 0 && data[0].id.startsWith('fallback-');
          setIsUsingFallback(usingFallback);
          
          if (usingFallback) {
            setError('No se pudieron cargar los posts del blog. Mostrando contenido de ejemplo.');
          }
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Error al cargar el blog';
          setError(errorMessage);
          const fallbackPosts = getFallbackPosts();
          setPosts(fallbackPosts);
          setIsUsingFallback(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    loadPosts();
    
    return () => { mounted = false; };
  }, []);

  const getPostBySlug = useCallback(async (slug: string): Promise<BlogPost | null> => {
    try {
      let currentPosts = cachedPosts;
      if (currentPosts.length === 0) {
        currentPosts = await fetchBlogPosts();
      }
      
      return currentPosts.find(post => post.slug === slug) || null;
    } catch (err) {
      console.error('Error getting post by slug:', err);
      return null;
    }
  }, []);

  return { 
    posts, 
    loading, 
    error, 
    getPostBySlug, 
    refreshPosts,
    isUsingFallback
  };
};