export const allowedOrigins = [
  'https://debelingoconangel.web.app',
  'https://de-belingo-con-angel.vercel.app',
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
  const origin = req.headers.origin;

  // CORS
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Default safe fallback if origin is not matched but we want to fail safely
    // or we can choose not to set it, blocking the request effectively for browsers.
    // For now, let's default to the production domain to be safe.
    res.setHeader('Access-Control-Allow-Origin', 'https://debelingoconangel.web.app');
  }

  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Firebase-AppCheck, x-debelingo-secret'
  );

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
