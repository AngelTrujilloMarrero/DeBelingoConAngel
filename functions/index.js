const functions = require('firebase-functions');
const express = require('express');
const crypto = require('crypto');
const fetch = require('node-fetch');
const xml2js = require('xml2js');
const admin = require('firebase-admin');
const FormData = require('form-data');

admin.initializeApp();

const app = express();
app.use(express.json({ limit: '10mb' }));

let postsCache = [];

// ========================================================================
// 🔐 SECURE IMAGE UPLOAD ENDPOINTS
// ========================================================================

/**
 * Upload image to ImgBB
 * POST /api/upload/imgbb
 * Body: { image: base64string }
 */
app.post('/api/upload/imgbb', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const IMGBB_API_KEY = functions.config().imgbb?.apikey;

    if (!IMGBB_API_KEY) {
      console.error('ImgBB API key not configured');
      return res.status(500).json({ error: 'ImgBB service not configured' });
    }

    const formData = new FormData();
    formData.append('image', image);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      res.json({
        success: true,
        url: result.data.url,
        data: result.data
      });
    } else {
      throw new Error(result.error?.message || 'Upload failed');
    }
  } catch (error) {
    console.error('ImgBB upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload to ImgBB'
    });
  }
});

/**
 * Upload image to Imgur
 * POST /api/upload/imgur
 * Body: { image: base64string or File }
 */
app.post('/api/upload/imgur', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const IMGUR_CLIENT_IDS = functions.config().imgur?.clientids;

    if (!IMGUR_CLIENT_IDS) {
      console.error('Imgur client IDs not configured');
      return res.status(500).json({ error: 'Imgur service not configured' });
    }

    const clientIds = IMGUR_CLIENT_IDS.split(',').map(id => id.trim());

    let lastError = null;

    // Try multiple client IDs
    for (let i = 0; i < clientIds.length; i++) {
      const clientId = clientIds[i];

      try {
        const formData = new FormData();
        formData.append('image', image);
        formData.append('type', 'base64');

        const response = await fetch('https://api.imgur.com/3/image', {
          method: 'POST',
          headers: {
            'Authorization': `Client-ID ${clientId}`
          },
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          return res.json({
            success: true,
            url: result.data.link,
            data: result.data
          });
        } else if (response.status === 429) {
          // Rate limited, try next client ID
          console.log(`Client ID ${i + 1} rate limited, trying next...`);
          continue;
        } else {
          lastError = new Error(`Upload failed with status ${response.status}`);
        }
      } catch (error) {
        console.error(`Client ID ${i + 1} failed:`, error);
        lastError = error;
      }
    }

    throw lastError || new Error('All Imgur client IDs failed');
  } catch (error) {
    console.error('Imgur upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload to Imgur'
    });
  }
});

// ========================================================================
// 📝 BLOG/RSS ENDPOINTS (EXISTING)
// ========================================================================

// Validar webhook de Hashnode
function validateHashnodeWebhook(req, secret) {
  const signature = req.headers['x-hashnode-signature'];
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(req.body)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Endpoint del webhook
app.post('/api/webhook/hashnode', (req, res) => {
  const WEBHOOK_SECRET = functions.config().hashnode?.secret;

  if (WEBHOOK_SECRET && !validateHashnodeWebhook(req, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { event, data } = req.body;

  if (event === 'post.created' || event === 'post.updated') {
    const existingIndex = postsCache.findIndex(p => p.id === data.post.id);

    if (existingIndex >= 0) {
      postsCache[existingIndex] = data.post;
    } else {
      postsCache.push(data.post);
    }

    console.log(`Post ${event}: ${data.post.title}`);
  } else if (event === 'post.deleted') {
    postsCache = postsCache.filter(p => p.id !== data.post.id);
    console.log(`Post deleted: ${data.post.title}`);
  }

  res.status(200).json({ success: true, postsCount: postsCache.length });
});

// Endpoint para obtener posts
app.get('/api/posts', (req, res) => {
  res.json({
    posts: postsCache.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)),
    total: postsCache.length
  });
});

// Proxy RSS endpoint
app.get('/api/rss-proxy', async (req, res) => {
  try {
    const response = await fetch('https://de-belingo-con-angel.hashnode.dev/rss.xml', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS-Proxy/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });

    if (!response.ok) {
      throw new Error(`RSS proxy error: ${response.status}`);
    }

    const xmlText = await response.text();
    res.set('Content-Type', 'application/rss+xml');
    res.send(xmlText);
  } catch (error) {
    console.error('RSS proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// RSS parsed to JSON endpoint
app.get('/api/posts-from-rss', async (req, res) => {
  try {
    const response = await fetch('https://de-belingo-con-angel.hashnode.dev/rss.xml', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS-Proxy/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });

    if (!response.ok) {
      throw new Error(`RSS fetch error: ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xmlText);

    const items = result.rss?.channel?.[0]?.item || [];
    const posts = items.map(item => ({
      id: item.link?.[0] || '',
      title: item.title?.[0] || '',
      brief: item.description?.[0]?.replace(/<[^>]*>/g, '').substring(0, 200) + '...' || '',
      slug: item.link?.[0]?.split('/')?.pop() || '',
      publishedAt: item.pubDate?.[0] || new Date().toISOString(),
      readTimeInMinutes: 3,
      author: {
        name: 'De Belingo con Ángel',
        profilePicture: 'https://debelingoconangel.web.app/fotos/dbca.jpg'
      },
      content: {
        html: item.description?.[0] || '',
        markdown: ''
      },
      tags: []
    }));

    res.json({ posts });
  } catch (error) {
    console.error('RSS parsing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GraphQL proxy endpoint
app.post('/api/graphql-proxy', async (req, res) => {
  try {
    const response = await fetch('https://gql.hashnode.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; GraphQL-Proxy/1.0)'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      throw new Error(`GraphQL proxy error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('GraphQL proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync endpoint manual
app.post('/api/sync-posts', async (req, res) => {
  try {
    // Try GraphQL proxy first
    const graphqlResponse = await fetch('https://gql.hashnode.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query getPublicationPosts {
            publication(host: "de-belingo-con-angel.hashnode.dev") {
              posts(first: 100) {
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
        `
      })
    });

    const result = await graphqlResponse.json();

    if (result.data?.publication?.posts?.edges) {
      const posts = result.data.publication.posts.edges.map(edge => edge.node);
      postsCache = posts;
      res.json({ success: true, postsCount: posts.length, source: 'graphql' });
      return;
    }

    // Fallback to RSS parsing
    const rssResponse = await fetch('https://de-belingo-con-angel.hashnode.dev/rss.xml');
    const xmlText = await rssResponse.text();
    const parser = new xml2js.Parser();
    const rssResult = await parser.parseStringPromise(xmlText);

    const items = rssResult.rss?.channel?.[0]?.item || [];
    const rssPosts = items.map(item => ({
      id: item.link?.[0] || '',
      title: item.title?.[0] || '',
      brief: item.description?.[0]?.replace(/<[^>]*>/g, '').substring(0, 200) + '...' || '',
      slug: item.link?.[0]?.split('/')?.pop() || '',
      publishedAt: item.pubDate?.[0] || new Date().toISOString(),
      readTimeInMinutes: 3,
      author: {
        name: 'De Belingo con Ángel',
        profilePicture: 'https://debelingoconangel.web.app/fotos/dbca.jpg'
      },
      content: {
        html: item.description?.[0] || '',
        markdown: ''
      },
      tags: []
    }));

    postsCache = rssPosts;
    res.json({ success: true, postsCount: rssPosts.length, source: 'rss' });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

exports.api = functions.https.onRequest(app);

// ========================================================================
// 🧹 CLEANUP FUNCTIONS (EXISTING)
// ========================================================================

// Función para limpiar registros de auditoría antiguos (más de 400 días)
exports.cleanupOldDeletions = functions.pubsub
  .schedule('0 2 * * *') // Todos los días a las 2 AM
  .timeZone('Europe/Madrid')
  .onRun(async (context) => {
    try {
      const db = admin.database();
      const deletionsRef = db.ref('eventDeletions');
      const snapshot = await deletionsRef.once('value');

      const fourHundredDaysAgo = new Date();
      fourHundredDaysAgo.setDate(fourHundredDaysAgo.getDate() - 400);

      const deletions = snapshot.val() || {};
      const keysToDelete = [];

      Object.entries(deletions).forEach(([key, deletion]) => {
        const deletionDate = new Date(deletion.deletedAt);
        if (deletionDate < fourHundredDaysAgo) {
          keysToDelete.push(key);
        }
      });

      if (keysToDelete.length > 0) {
        const deletePromises = keysToDelete.map(key =>
          deletionsRef.child(key).remove()
        );

        await Promise.all(deletePromises);
        console.log(`Eliminados ${keysToDelete.length} registros de auditoría antiguos`);

        // Log de actividad de limpieza
        const cleanupLogRef = db.ref('cleanupLogs').push();
        await cleanupLogRef.set({
          type: 'eventDeletionsCleanup',
          deletedCount: keysToDelete.length,
          deletedAt: new Date().toISOString(),
          cutoffDate: fourHundredDaysAgo.toISOString()
        });
      }

      return null;
    } catch (error) {
      console.error('Error en limpieza de auditoría:', error);
      return null;
    }
  });

// Función HTTP manual para limpiar registros (para testing)
exports.manualCleanupDeletions = functions.https.onRequest(async (req, res) => {
  try {
    const db = admin.database();
    const deletionsRef = db.ref('eventDeletions');
    const snapshot = await deletionsRef.once('value');

    const fourHundredDaysAgo = new Date();
    fourHundredDaysAgo.setDate(fourHundredDaysAgo.getDate() - 400);

    const deletions = snapshot.val() || {};
    const keysToDelete = [];

    Object.entries(deletions).forEach(([key, deletion]) => {
      const deletionDate = new Date(deletion.deletedAt);
      if (deletionDate < fourHundredDaysAgo) {
        keysToDelete.push(key);
      }
    });

    if (keysToDelete.length > 0) {
      const deletePromises = keysToDelete.map(key =>
        deletionsRef.child(key).remove()
      );

      await Promise.all(deletePromises);
    }

    res.json({
      success: true,
      deletedCount: keysToDelete.length,
      cutoffDate: fourHundredDaysAgo.toISOString()
    });
  } catch (error) {
    console.error('Error en limpieza manual:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});