import admin from 'firebase-admin';

/**
 * Server-side Rate Limiting using Firebase Realtime Database
 * @param {string} key - The rate limit key (e.g., 'aemet', 'angel-ia')
 * @param {number} limit - Max requests allowed
 * @param {number} windowMs - Time window in milliseconds
 */
export async function checkRateLimit(key, limit, windowMs) {
    const db = admin.database();
    const ref = db.ref(`rateLimits/${key}`);
    const now = Date.now();

    // Create a timeout promise to prevent hanging
    const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
            console.warn(`⏳ Rate limit check for ${key} timed out. Failing open.`);
            resolve({ allowed: true, timeout: true });
        }, 2000);
    });

    try {
        const checkPromise = (async () => {
            const result = await ref.transaction((currentData) => {
                if (!currentData || now > currentData.resetTime) {
                    return { count: 1, resetTime: now + windowMs };
                }
                if (currentData.count >= limit) {
                    return; // Abort
                }
                return { ...currentData, count: currentData.count + 1 };
            });

            if (!result.committed) {
                return { allowed: false, error: 'Has alcanzado el límite de peticiones. Inténtalo de nuevo más tarde.' };
            }
            return { allowed: true };
        })();

        // Race between the actual check and the 2s timeout
        return await Promise.race([checkPromise, timeoutPromise]);
    } catch (error) {
        console.error(`🔴 Rate limit error for ${key}:`, error.message);
        return { allowed: true };
    }
}
