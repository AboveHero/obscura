const crypto = require("crypto");

// PBKDF2 Key Derivation (Server-Side)
async function deriveKey(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 32, "sha256", (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}

// AES-GCM Encryption (Server-Side)
async function decryptData({ salt, iv, ciphertext }, password) {
    try {
      const saltBuf = Buffer.from(salt, "base64");
      const ivBuf = Buffer.from(iv, "base64");
      const ctBuf = Buffer.from(ciphertext, "base64");
  
      // Derive AES-GCM key
      const key = await deriveKey(password, saltBuf);
  
      // Extract final 16 bytes as auth tag
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, ivBuf);
      decipher.setAuthTag(ctBuf.slice(-16));
      const encryptedData = ctBuf.slice(0, -16);
  
      let decrypted = decipher.update(encryptedData);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString("utf-8");
    } catch (err) {
      console.error("❌ Server-side decryption failed:", err);
      throw new Error("Invalid decryption key.");
    }
  }

  module.exports = {
    decryptData,
  };