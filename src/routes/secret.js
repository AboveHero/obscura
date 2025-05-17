const express = require("express");
const router = express.Router();
const { getObject, putObject, deleteObject } = require("../s3/client");
const { v4: uuidv4 } = require("uuid");
const { streamToString } = require("../helper/stream")
const Firewall = require("../middleware/firewall");

const sameorigin = new Firewall();

router.post("/", sameorigin.middleware(), async (req, res) => {
    try {
        const { encryptedObj } = req.body;
        if (!encryptedObj || !encryptedObj.ciphertext || !encryptedObj.salt || !encryptedObj.iv) {
            return res.status(400).json({ error: "No ciphertext provided." });
        }

        const secretId = uuidv4();
        const nowMs = Date.now().toString();

        // Store the secret in S3
        await putObject({
            Key: secretId,
            Body: JSON.stringify(encryptedObj),
            Metadata: {
                "x-creation-timestamp": nowMs,
                "x-ttl-days": "1", // default 1-day
            },
        });

        // Return link
        const link = `${req.protocol}://${req.get("host")}/secret?id=${secretId}`;
        return res.json({ id: secretId, link });
    } catch (err) {
        console.error("Error in POST /api/secret:", err);
        return res.status(500).json({ error: "Unable to store secret." });
    }
});

router.get("/:id/check", sameorigin.middleware(), async (req, res) => {
    const { id } = req.params;
    try {
        await checkObject(id);
        res.json({ exists: true });
    } catch (err) {
        console.error(`Object ${id} not found or error in HEAD:`, err);
        res.status(404).json({ exists: false });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const obj = await getObject(id);
        if (!obj || !obj.Body) {
            return res.status(404).json({ error: "Secret not found or already consumed." });
        }

        const bodyString = await streamToString(obj.Body);

        let encryptedObj;
        try {
            encryptedObj = JSON.parse(bodyString);
        } catch (jsonError) {
            console.error("🚨 JSON Parse Error:", jsonError);
            return res.status(500).json({ error: "Invalid secret format." });
        }
        // Fix creation timestamp formatting
        let creationTimestamp = obj.Metadata?.["x-creation-timestamp"];
        if (creationTimestamp) {
            creationTimestamp = new Date(Number(creationTimestamp)).toLocaleString(); // Convert properly
        }

        // Otherwise, return the encrypted data (manual decryption scenario)
        res.json({
            encryptedObj,
            metadata: { ...obj.Metadata, "x-creation-timestamp": creationTimestamp },
            secretId: id,
        });
    } catch (err) {
        console.error("❌ Error in GET /api/secret:", err);
        res.status(500).json({ error: "Unable to retrieve secret." });
    }
});

router.delete("/:id", sameorigin.middleware(), async (req, res) => {
  try {
      const { id } = req.params;

      // ✅ Header Check: Ensure request is coming from the frontend
      if (req.headers["authorization"] !== "Obscura-Delete") {
          console.warn(`❌ Missing or invalid authorization header from ${clientIp}`);
          return res.status(403).json({ error: "Unauthorized" });
      }

      // 🔥 DELETE the secret after verification
      await deleteObject(id);

      res.status(200).json({ message: "Secret deleted successfully." });
  } catch (err) {
      console.error(`❌ Error deleting secret ${id}:`, err);
      res.status(500).json({ error: "Failed to delete secret." });
  }
});
module.exports = router;
