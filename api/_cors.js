export const allowedOrigins = [
  'https://debelingoconangel.web.app',
  'https://de-belingo-con-angel.vercel.app',
  'https://admindebelingo.web.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173'
];

/**
 * Applies standard security headers and CORS policy to the response.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {boolean} - Returns true if the request was an OPTIONS preflight (and handled), false otherwise.
 */
export function applySecurityHeaders(req, res) {
  // CORS Directo
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-app-internal-key, Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle Preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  // Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Handle Preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}
