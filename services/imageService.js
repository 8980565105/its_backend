// services/imageService.js
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extract Cloudinary publicId from URL
 */
function extractPublicId(url) {
  if (!url) return null;
  try {
    const parts = url.split("/");
    const publicIdWithExt = parts[parts.length - 1];
    return publicIdWithExt.split(".")[0];
  } catch (err) {
    console.error("⚠️ Failed to extract publicId:", err.message);
    return null;
  }
}

/**
 * Delete a single image from Cloudinary
 */
async function deleteImage(imageUrl) {
  if (!imageUrl) return;

  const publicId = extractPublicId(imageUrl);
  if (!publicId) return;

  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      console.log(`✅ Successfully deleted: ${imageUrl}`);
    } else if (result.result === "not found") {
      console.warn(`⚠️ Image not found on Cloudinary: ${imageUrl}`);
    } else {
      console.error(`❌ Failed to delete: ${imageUrl}`, result);
    }
  } catch (err) {
    console.error(`❌ Error deleting image: ${imageUrl}`, err.message);
  }
}

/**
 * Delete multiple images
 */
async function deleteImages(imageUrls = []) {
  for (const url of imageUrls) {
    await deleteImage(url);
  }
}

module.exports = { deleteImage, deleteImages };
