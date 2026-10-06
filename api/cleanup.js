import { getDb } from './_firebase.js';

export default async function handler(req, res) {
    const results = {};
    const db = getDb();

    try {
        // 1. Cleanup Deletions (Old deletions > 40 days)
        const deletionsRef = db.ref('eventDeletions');
        const deletionsSnap = await deletionsRef.once('value');
        const deletionsData = deletionsSnap.val() || {};
        const fortyDaysAgo = new Date();
        fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);
        const delKeys = Object.entries(deletionsData)
            .filter(([_, v]) => v.deletedAt && new Date(v.deletedAt) < fortyDaysAgo)
            .map(([k]) => k);
        if (delKeys.length > 0) {
            const up = {}; delKeys.forEach(k => up[k] = null);
            await deletionsRef.update(up);
        }
        results.deletions = delKeys.length;

        // 2. Cleanup Messages (> 60 days)
        const msgRef = db.ref('guestbook/messages');
        const msgSnap = await msgRef.once('value');
        const sixtyDaysAgo = Date.now() - (60 * 24 * 60 * 60 * 1000);
        const msgKeys = Object.entries(msgSnap.val() || {}).filter(([_, v]) => v.timestamp && v.timestamp < sixtyDaysAgo).map(([k]) => k);
        if (msgKeys.length > 0) {
            const up = {}; msgKeys.forEach(k => up[k] = null);
            await msgRef.update(up);
        }
        results.messages = msgKeys.length;

        // 3. Cleanup Trashed Events (Expired)
        const trashedRef = db.ref('trashedEvents');
        const trashedSnap = await trashedRef.once('value');
        const now = new Date();
        const trashKeys = Object.entries(trashedSnap.val() || {}).filter(([_, v]) => v.expiresAt && new Date(v.expiresAt) < now).map(([k]) => k);
        if (trashKeys.length > 0) {
            const up = {}; trashKeys.forEach(k => up[k] = null);
            await trashedRef.update(up);
        }
        results.trashed = trashKeys.length;

        // 4. Cleanup Rate Limits (Delete expired rate limits to save database space)
        const rateLimitsRef = db.ref('rateLimits');
        const rateLimitsSnap = await rateLimitsRef.once('value');
        const rateLimitsData = rateLimitsSnap.val() || {};
        const expiredRateLimitKeys = Object.entries(rateLimitsData)
            .filter(([_, v]) => v.resetTime && Date.now() > v.resetTime)
            .map(([k]) => k);
        if (expiredRateLimitKeys.length > 0) {
            const up = {}; expiredRateLimitKeys.forEach(k => up[k] = null);
            await rateLimitsRef.update(up);
        }
        results.rateLimits = expiredRateLimitKeys.length;

        // 5. Cleanup Download Records (Monthly rollup)
        const downloadsRef = db.ref('downloads/records');
        const downloadsSnap = await downloadsRef.once('value');
        const downloadsData = downloadsSnap.val() || {};
        
        const countsByMonth = {};
        const recordsToDelete = [];
        
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        
        Object.entries(downloadsData).forEach(([key, val]) => {
            const timestamp = val.timestamp;
            if (timestamp && timestamp < startOfCurrentMonth) {
                const date = new Date(timestamp);
                const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                countsByMonth[yearMonth] = (countsByMonth[yearMonth] || 0) + 1;
                recordsToDelete.push(key);
            }
        });
        
        if (recordsToDelete.length > 0) {
            // Update monthly counts in database (merge/add to existing just in case)
            for (const [yearMonth, count] of Object.entries(countsByMonth)) {
                const monthlyRef = db.ref(`downloads/monthly/${yearMonth}`);
                const currentMonthlySnap = await monthlyRef.once('value');
                const currentMonthlyVal = currentMonthlySnap.val() || 0;
                await monthlyRef.set(currentMonthlyVal + count);
            }
            
            // Delete only the processed records
            const updates = {};
            recordsToDelete.forEach(key => {
                updates[key] = null;
            });
            await downloadsRef.update(updates);
            
            results.downloads = {
                aggregated: countsByMonth,
                clearedCount: recordsToDelete.length
            };
        } else {
            results.downloads = {
                clearedCount: 0
            };
        }

        return res.status(200).json({ success: true, results });
    } catch (error) {
        console.error('[Cleanup Combined Error]:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}
