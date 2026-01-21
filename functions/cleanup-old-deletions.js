const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

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