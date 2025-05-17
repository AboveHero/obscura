# **Obscura - Secure Self-Destructing Notes**

## **📌 What is Obscura?**
Obscura is a **secure, zero-knowledge, self-destructing notes application** that allows users to create encrypted notes that automatically delete themselves after being read. This ensures privacy and security, preventing unauthorized access to sensitive information.

## **🔐 How It Works**
1. **User writes a secret note** in the web app.
2. **Note is encrypted in the browser** using the Web Crypto API.
3. **The encrypted data is sent to an S3-compatible object storage** along with metadata.
4. **A unique link is generated** for accessing the note.
5. **When the recipient opens the link**:
   - The encrypted data is retrieved from storage.
   - The frontend **decrypts the note in the browser** (the password is never sent to the server).
   - The frontend **tells the server to delete the note** after successful decryption.
6. **If a user accesses the link after decryption, it will no longer exist.**

## **🖥️ System Requirements**
### **For Running the Server**
- **Operating System:** Linux (Ubuntu 20.04+ recommended) or macOS
- **Node.js:** v18+ (Ensure compatibility with Web Crypto API and ES modules)
- **npm:** v8+ (Package management)
- **Storage:** Any S3-compatible object storage (AWS S3, MinIO, Wasabi, etc.)
- **RAM:** Minimum **512MB** (Recommended: **1GB+** for better performance)
- **CPU:** Minimum **1vCPU** (Recommended: **2vCPU** for handling requests smoothly)
- **Firewall:** Ensure necessary ports are open (default **3000** for the web app)

### **For Clients Accessing the App**
- **Modern Web Browser** (Chrome, Firefox, Edge, Safari) with Web Crypto API support
- **JavaScript Enabled** (Required for encryption and decryption to function properly)

## **⚙️ Dependencies**
Obscura is built using the following technologies:
- **Node.js** (Backend API & Server)
- **Express.js** (Routing and API handling)
- **AWS S3 / Compatible Object Storage** (Encrypted data storage)
- **pm2** (Process manager for production deployment)
- **nodemon** (Development auto-restart)
- **dotenv** (Environment variable management)
- **crypto** (Encryption & decryption functions)
- **ip-range-check** (CIDR-based firewall protection)

## **📦 Installation**
### **1️⃣ Install Node.js & npm**
Make sure you have **Node.js (v18 or newer)** and **npm** installed:
```sh
node -v  # Should output Node.js version
npm -v   # Should output npm version
```

### **2️⃣ Clone the Repository**
```sh
git clone https://github.com/yourusername/obscura.git
cd obscura
```

### **3️⃣ Install Dependencies**
```sh
npm install
```

## **⚙️ Environment Variables (`.env`)**
Create a **.env** file in the root directory and configure the following variables:
```ini
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
S3_BUCKET=your-s3-bucket
S3_ENDPOINT=your-s3-endpoint
CLEANUP_INTERVAL=15 # Time in minutes for cleanup script
```

## **🚀 Running the App**
### **For Development (Auto-restarts with `nodemon`)**
```sh
npm run dev
```
This will watch for changes and restart the server automatically.

### **For Production (Using `pm2`)**
```sh
npm run app
```
This will start the app in the background using **pm2**.

## **🔄 Auto-Restart on Server Boot (pm2 Startup Script)**
To make **pm2 restart automatically on boot**, run:
```sh
npm install -g pm2
npm run app  # Start the app
pm2 save    # Save the current pm2 process list
pm2 startup # Generate system startup script
```
This will ensure the app starts automatically when the server reboots.

## **🧹 Automatic Secret Cleanup**
Obscura includes a **scheduled cleanup task** that runs every `CLEANUP_INTERVAL` minutes to delete expired notes. This is handled using **S3 metadata timestamps**.

## **📜 License**
Obscura is open-source software, licensed under the **MIT License**.

## **❤️ Built with Love**
This project was built with security and privacy in mind. Enjoy using Obscura for your secure communications! 🔥