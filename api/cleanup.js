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

        // 2. Cleanup Analytics (solo el día 1 de cada mes)
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const isFirstOfMonth = today.getDate() === 1;

        if (!isFirstOfMonth) {
            results.analytics = 'skipped (not 1st of month)';
        } else {
            const analyticsRef = db.ref('analytics/visits');
            const statsRef = db.ref('Estadisticas');
            const anaSnap = await analyticsRef.once('value');
            const anaData = anaSnap.val() || {};

            // Guardar las visitas del mes anterior en Estadisticas
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthName = `${String(lastMonth.getMonth() + 1).padStart(2, '0')}-${lastMonth.getFullYear()}`;
            const startLast = lastMonth.getTime();
            const endLast = today.getTime(); // = inicio del mes actual
            const lastMonthVisits = Object.values(anaData).filter(v => v.timestamp >= startLast && v.timestamp < endLast).length;
            if (lastMonthVisits > 0) {
                await statsRef.child(lastMonthName).set({ visitas: lastMonthVisits, mes: lastMonthName, guardadoEl: new Date().toISOString() });
            }

            // Borrar todas las visitas anteriores a hoy (ayer y antes)
            const anaKeys = Object.entries(anaData)
                .filter(([_, v]) => !v.timestamp || v.timestamp < today.getTime())
                .map(([k]) => k);
            if (anaKeys.length > 0) {
                const up = {}; anaKeys.forEach(k => up[k] = null);
                await analyticsRef.update(up);
            }
            results.analytics = anaKeys.length;
        }

        // 3. Cleanup Messages (> 60 days)
        const msgRef = db.ref('guestbook/messages');
        const msgSnap = await msgRef.once('value');
        const sixtyDaysAgo = Date.now() - (60 * 24 * 60 * 60 * 1000);
        const msgKeys = Object.entries(msgSnap.val() || {}).filter(([_, v]) => v.timestamp && v.timestamp < sixtyDaysAgo).map(([k]) => k);
        if (msgKeys.length > 0) {
            const up = {}; msgKeys.forEach(k => up[k] = null);
            await msgRef.update(up);
        }
        results.messages = msgKeys.length;

        // 4. Cleanup Trashed Events (Expired)
        const trashedRef = db.ref('trashedEvents');
        const trashedSnap = await trashedRef.once('value');
        const now = new Date();
        const trashKeys = Object.entries(trashedSnap.val() || {}).filter(([_, v]) => v.expiresAt && new Date(v.expiresAt) < now).map(([k]) => k);
        if (trashKeys.length > 0) {
            const up = {}; trashKeys.forEach(k => up[k] = null);
            await trashedRef.update(up);
        }
        results.trashed = trashKeys.length;

        return res.status(200).json({ success: true, results });
    } catch (error) {
        console.error('[Cleanup Combined Error]:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}
