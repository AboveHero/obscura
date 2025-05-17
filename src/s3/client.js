require("dotenv").config();
const {
    S3Client,
    PutObjectCommand,
    HeadObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
  } = require("@aws-sdk/client-s3");

// const { getSignedUrl } = require('@aws-sdk/s3-request-presigner'); // optional if you need presigned links

// Load environment variables or hardcode them (not recommended in production)
const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "YOUR_KEY_ID";
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "YOUR_SECRET_KEY";
const S3_BUCKET = process.env.S3_BUCKET || "your-bucket";

// Create an S3 client
const s3 = new S3Client({
    region: AWS_REGION,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true
});

// Apparently you can't set default bucket name in the client constructor
// So we have to do this stupid workaround
// Custom put
async function putObject(params) {
    const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        ...params,
    });
    return s3.send(command);
}

// Custom check
async function checkObject(id) {
    const command = new HeadObjectCommand({
        Bucket: S3_BUCKET,
        Key: id,
    });
    return s3.send(command);
}

// Custom get
async function getObject(id) {
    const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: id,
    });
    return s3.send(command);
}

// Custom delete
async function deleteObject(id) {
    const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: id,
    });
    return s3.send(command);
}

// Custom list
async function listObjects() {
    const command = new ListObjectsV2Command({
        Bucket: S3_BUCKET
    });
    const data = await s3.send(command);
    // data.Contents is an array of objects { Key, LastModified, ... }
    return data.Contents || [];
}

module.exports = { s3, putObject, checkObject, getObject, deleteObject, listObjects };
