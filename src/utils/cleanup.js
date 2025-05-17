require("dotenv").config();
const { listObjects, deleteObject, checkObject } = require("../s3/client");
const { S3_BUCKET } = process.env;

const CLEANUP_INTERVAL = process.env.CLEANUP_INTERVAL || 15; // Default 15 minutes

async function cleanupExpiredSecrets() {
    try {
        console.log("🧹 Running cleanup for expired secrets...");

        const now = Date.now();
        console.log(`🕒 Current time: ${new Date(now).toISOString()}`);
        const objects = await listObjects(); // This returns an array of { Key, ... }
        console.log(`🔍 Found ${objects.length} objects.`);

        if (!objects.length) {
            console.log("✅ No expired secrets found.");
            return;
        }

        let deletedCount = 0;
        for (const item of objects) {
            const key = item.Key;

            // We must HEAD each object to get Metadata (including expiration)
            try {
                console.log(`🔍 Checking object: ${key}`);
                const headRes = await checkObject(key); // calls HeadObjectCommand
                const meta = headRes.Metadata || {};

                const creationTimestamp = meta["x-creation-timestamp"]
                    ? parseInt(meta["x-creation-timestamp"], 10)
                    : null;

                const ttlDays = meta["x-ttl-days"] ? parseInt(meta["x-ttl-days"], 10) : null;

                // Calculate expiration time (creation time + TTL)
                const expirationTimestamp =
                    creationTimestamp && ttlDays ? creationTimestamp + ttlDays * 24 * 60 * 60 * 1000 : null;

                // If expirationTimestamp is reached or passed, delete
                if (expirationTimestamp && now >= expirationTimestamp) {
                    console.log(`🗑️ Deleting expired secret: ${key}`);
                    await deleteObject(key);
                    deletedCount++;
                }
            } catch (headErr) {
                // If HEAD fails, maybe it's already deleted
                console.error(`HEAD failed for object ${key}`, headErr);
            }
        }

        console.log(`✅ Cleanup completed. Deleted ${deletedCount} expired secrets.`);
    } catch (err) {
        console.error("❌ Cleanup failed:", err);
    }
}

// Start cleanup on interval
function startCleanupScheduler() {
    console.log(`⏳ Cleanup scheduler running every ${CLEANUP_INTERVAL} minutes.`);
    setInterval(cleanupExpiredSecrets, CLEANUP_INTERVAL * 60 * 1000);
}

module.exports = { startCleanupScheduler };
