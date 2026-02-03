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

    try {
        const result = await ref.transaction((currentData) => {
            if (!currentData || now > currentData.resetTime) {
                // Initial or window expired
                return {
                    count: 1,
                    resetTime: now + windowMs
                };
            }

            if (currentData.count >= limit) {
                // Limit exceeded
                return; // Abort transaction
            }

            // Increment count
            return {
                ...currentData,
                count: currentData.count + 1
            };
        });

        if (!result.committed) {
            return { allowed: false, error: 'Rate limit exceeded. Please try again later.' };
        }

        return { allowed: true, data: result.snapshot.val() };
    } catch (error) {
        console.error(`Rate limit error for ${key}:`, error);
        // Fail open to avoid blocking users if DB is down, but log error
        return { allowed: true };
    }
}
