const express = require('express');
const fetch = require('node-fetch');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());

const PORT = 3001;
const CACHE_FILE = path.join(__dirname, '../posts-cache.json');
const HASHNODE_HOST = 'de-belingo-con-angel.hashnode.dev';

let postsCache = [];

// Cargar caché al iniciar
async function loadCache() {
  try {
    const data = await fs.readFile(CACHE_FILE, 'utf8');
    postsCache = JSON.parse(data);
    console.log(`Loaded ${postsCache.length} posts from cache`);
  } catch (error) {
    console.log('No cache file found, starting empty');
    postsCache = [];
  }
}

// Guardar caché
async function saveCache() {
  try {
    await fs.writeFile(CACHE_FILE, JSON.stringify(postsCache, null, 2));
  } catch (error) {
    console.error('Error saving cache:', error);
  }
}

// Validar webhook de Hashnode
function validateHashnodeWebhook(req, secret) {
  const signature = req.headers['x-hashnode-signature'];
  if (!signature) return false;
  
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(req.body)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Endpoint del webhook
app.post('/webhook/hashnode', (req, res) => {
  const WEBHOOK_SECRET = process.env.HASHNODE_SECRET || 'test-secret';
  
  if (!validateHashnodeWebhook(req, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { event, data } = req.body;
  console.log(`Received webhook: ${event}`, { data: data?.post?.title });
  
  if (event === 'post.created' || event === 'post.updated') {
    const post = data.post;
    const existingIndex = postsCache.findIndex(p => p.id === post.id);
    
    if (existingIndex >= 0) {
      postsCache[existingIndex] = post;
      console.log(`Updated post: ${post.title}`);
    } else {
      postsCache.push(post);
      console.log(`Added new post: ${post.title}`);
    }
    
    saveCache();
  } else if (event === 'post.deleted') {
    const postId = data.post.id;
    postsCache = postsCache.filter(p => p.id !== postId);
    console.log(`Deleted post: ${data.post.title}`);
    saveCache();
  }

  res.status(200).json({ 
    success: true, 
    postsCount: postsCache.length,
    lastUpdated: new Date().toISOString()
  });
});

// Endpoint para obtener posts
app.get('/posts', (req, res) => {
  res.json({
    posts: postsCache.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)),
    total: postsCache.length,
    lastUpdated: new Date().toISOString()
  });
});

// Sync endpoint manual desde Hashnode API
app.post('/sync-posts', async (req, res) => {
  try {
    console.log('Fetching posts from Hashnode API...');
    
    const response = await fetch('https://gql.hashnode.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query {
            publication(host: "${HASHNODE_HOST}") {
              posts(first: 100) {
                edges {
                  node {
                    id
                    title
                    brief
                    slug
                    publishedAt
                    url
                    coverImage {
                      url
                    }
                    content {
                      markdown
                    }
                    author {
                      name
                      profilePicture
                    }
                  }
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          }
        `
      })
    });
    
    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    
    const posts = result.data.publication.posts.edges.map(edge => edge.node);
    const pageInfo = result.data.publication.posts.pageInfo;
    
    postsCache = posts;
    await saveCache();
    
    console.log(`Synced ${posts.length} posts from Hashnode`);
    console.log(`Has next page: ${pageInfo.hasNextPage}`);
    
    res.json({ 
      success: true, 
      postsCount: posts.length,
      hasNextPage: pageInfo.hasNextPage,
      posts: posts.map(p => ({ id: p.id, title: p.title, publishedAt: p.publishedAt }))
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stats endpoint
app.get('/stats', (req, res) => {
  const stats = {
    totalPosts: postsCache.length,
    lastSync: new Date().toISOString(),
    recentPosts: postsCache.slice(0, 5).map(p => ({ 
      id: p.id, 
      title: p.title, 
      publishedAt: p.publishedAt 
    }))
  };
  res.json(stats);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    postsCount: postsCache.length 
  });
});

// Iniciar servidor
loadCache().then(() => {
  app.listen(PORT, () => {
    console.log(`RSS Proxy server running on http://localhost:${PORT}`);
    console.log('Endpoints:');
    console.log('  POST /webhook/hashnode - Webhook receiver');
    console.log('  GET  /posts - Get all posts');
    console.log('  POST /sync-posts - Manual sync');
    console.log('  GET  /stats - Statistics');
    console.log('  GET  /health - Health check');
  });
}).catch(error => {
  console.error('Failed to start server:', error);
});