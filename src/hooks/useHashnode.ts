import { useState, useEffect, useCallback } from 'react';

export interface BlogPost {
  id: string;
  title: string;
  brief: string;
  slug: string;
  coverImage: {
    url: string;
  };
  publishedAt: string;
  readTimeInMinutes: number;
  author: {
    name: string;
    profilePicture: string;
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

interface HashnodeResponse {
  data: {
    publication: {
      posts: {
        edges: Array<{
          node: BlogPost;
        }>;
      };
      post?: BlogPost;
    };
  };
}

export const useHashnode = (host: string = 'de-belingo-con-angel.hashnode.dev') => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://gql.hashnode.com/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `
              query GetPublicationPosts($host: String!) {
                publication(host: $host) {
                  posts(first: 10) {
                    edges {
                      node {
                        id
                        title
                        brief
                        slug
                        coverImage {
                          url
                        }
                        publishedAt
                        readTimeInMinutes
                        author {
                          name
                          profilePicture
                        }
                        content {
                          html
                          markdown
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
            `,
            variables: {
              host: host,
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Error al cargar los artículos del blog');
        }

        const data: HashnodeResponse = await response.json();
        const postsList = data.data.publication.posts.edges.map(edge => edge.node);
        
        setPosts(postsList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [host]);

  const getPostBySlug = useCallback(async (slug: string): Promise<BlogPost | null> => {
    try {
      const response = await fetch('https://gql.hashnode.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetPost($host: String!, $slug: String!) {
              publication(host: $host) {
                post(slug: $slug) {
                  id
                  title
                  brief
                  slug
                  coverImage {
                    url
                  }
                  publishedAt
                  readTimeInMinutes
                  author {
                    name
                    profilePicture
                  }
                  content {
                    html
                    markdown
                  }
                  tags {
                    name
                    slug
                  }
                }
              }
            }
          `,
          variables: {
            host: host,
            slug,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Error al cargar el artículo');
      }

      const data: HashnodeResponse = await response.json();
      return data.data.publication.post || null;
    } catch (err) {
      console.error('Error fetching post:', err);
      return null;
    }
  }, [host]);

  return { posts, loading, error, getPostBySlug };
};