const cloudinary = require("cloudinary").v2;

let configured = false;

// File type validation
const TASK_IMAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TASK_MIMETYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const ALLOWED_FILE_MIMETYPES = [
  // Images
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Videos
  'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm',
  // Documents
  'application/pdf',
  'application/zip', 'application/x-zip-compressed',
  'application/x-rar-compressed', 'application/vnd.rar',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

function initCloudinary() {
  if (configured) return cloudinary;
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud_name || !api_key || !api_secret) {
    return null;
  }

  try {
    cloudinary.config({ cloud_name, api_key, api_secret });
    configured = true;
    return cloudinary;
  } catch (err) {
    const e = new Error(
      `Cloudinary initialization failed: ${err.message}. Verify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET and restart the server.`
    );
    e.cause = err;
    throw e;
  }
}

function ensureConfigured() {
  const cld = initCloudinary();
  if (!cld)
    throw new Error(
      "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in the server .env and restart the server"
    );
  return cld;
}

module.exports = {
  validateTaskImage: (file) => {
    if (!file) return { valid: false, error: 'No file provided' };
    if (file.size > TASK_IMAGE_MAX_SIZE) {
      return { valid: false, error: 'Image must be less than 10MB' };
    }
    if (!ALLOWED_TASK_MIMETYPES.includes(file.mimetype)) {
      return { valid: false, error: 'Only image files (JPEG, PNG, GIF, WEBP) are allowed for tasks' };
    }
    return { valid: true };
  },

  validateFileAttachment: (file) => {
    if (!file) return { valid: false, error: 'No file provided' };
    if (!ALLOWED_FILE_MIMETYPES.includes(file.mimetype)) {
      return { valid: false, error: 'File type not supported. Allowed: images, videos, PDF, ZIP, RAR, Word, Excel, TXT' };
    }
    return { valid: true };
  },

  uploadBuffer: async (buffer, fileName, mimeType, folder = "daylytics") => {
    const cld = ensureConfigured();

    // Convert to data URL
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Use resource_type: 'auto' so Cloudinary accepts non-image files
    const opts = { folder, resource_type: "auto" };

    try {
      const result = await cld.uploader.upload(dataUrl, opts);
      return {
        fileId: result.public_id,
        url: result.secure_url,
        resourceType: result.resource_type || "raw",
        raw: result,
      };
    } catch (err) {
      throw err;
    }
  },

  deleteFile: async (fileId, resourceType = null) => {
    const cld = ensureConfigured();

    // If resourceType supplied, use it directly
    if (resourceType) {
      return await cld.uploader.destroy(fileId, {
        resource_type: resourceType,
      });
    }

    // Otherwise, try common resource types until one succeeds
    const types = ["image", "video", "raw"];
    let lastErr = null;
    for (const t of types) {
      try {
        const res = await cld.uploader.destroy(fileId, { resource_type: t });
        // Normalize result to make checks predictable (e.g., 'not found' -> 'not_found')
        const raw = String(res?.result || "").toLowerCase();
        const normalized = raw
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");
        return { ...res, result: normalized };
      } catch (err) {
        lastErr = err;
        // If invalid resource type error from Cloudinary, try next
        if (
          err?.message &&
          err.message.toLowerCase().includes("invalid resource type")
        )
          continue;
        // For other errors, continue trying other types as well
        continue;
      }
    }

    // If none succeeded, throw the last error for visibility
    throw lastErr || new Error("Unable to delete file from Cloudinary");
  },

  generateDownloadUrl: (filePathOrUrl) => {
    // Ensure Cloudinary is configured before generating URLs
    const cld = initCloudinary();
    if (!cld) {
      throw new Error(
        "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in environment variables"
      );
    }
    // Cloudinary already returns secure_url in the stored URL
    return filePathOrUrl;
  },
};
