const { ensureBucketExists } = require("./src/s3/client");
const { startCleanupScheduler } = require("./src/utils/cleanup");

(async () => {
    try {
        console.log("🔧 Ensuring S3 bucket exists...");
        await ensureBucketExists();

        require("./src/server"); // starts the Express server
        startCleanupScheduler();
    } catch (err) {
        console.error("❌ Startup failed:", err);
        process.exit(1);
    }
})();