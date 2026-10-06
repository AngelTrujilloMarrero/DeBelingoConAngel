import { runTransaction, ref, db } from './firebase';

/**
 * Checks a local rate limit using localStorage.
 * @param key Local storage key for tracking.
 * @param limit Max number of requests.
 * @param windowMs Time window in milliseconds.
 * @returns boolean True if request is allowed, false otherwise.
 */
export const checkLocalRateLimit = (key: string, limit: number, windowMs: number): boolean => {
    try {
        const now = Date.now();
        const stored = localStorage.getItem(key);
        let timestamps: number[] = stored ? JSON.parse(stored) : [];

        // Remove timestamps outside the window
        timestamps = timestamps.filter(ts => now - ts < windowMs);

        if (timestamps.length >= limit) {
            return false;
        }

        timestamps.push(now);
        localStorage.setItem(key, JSON.stringify(timestamps));
        return true;
    } catch (e) {
        console.error("Error in local rate limit check:", e);
        return true; // Allow on error to avoid blocking users
    }
};

/**
 * Checks a global rate limit using Firebase Realtime Database.
 * @param dbPath Path in Firebase RD to store usage.
 * @param limit Max number of requests global.
 * @param windowMs Time window in milliseconds.
 * @returns Promise<boolean> True if request is allowed, false otherwise.
 */
export const checkGlobalRateLimit = async (dbPath: string, limit: number, windowMs: number): Promise<boolean> => {
    try {
        const usageRef = ref(db, dbPath);
        const result = await runTransaction(usageRef, (currentData) => {
            const now = Date.now();

            let timestamps: number[] = [];
            if (currentData) {
                if (Array.isArray(currentData)) {
                    timestamps = currentData;
                } else if (typeof currentData === 'object') {
                    timestamps = Object.values(currentData).filter((v): v is number => typeof v === 'number');
                }
            }

            // Remove timestamps outside the window
            timestamps = timestamps.filter(ts => typeof ts === 'number' && now - ts < windowMs);

            if (timestamps.length >= limit) {
                // Return undefined to abort transaction without saving anything
                return undefined;
            }

            timestamps.push(now);
            return timestamps;
        });

        return result.committed;
    } catch (e) {
        console.error("Error in global rate limit check:", e);
        return true; // Allow on error to avoid blocking users
    }
};
