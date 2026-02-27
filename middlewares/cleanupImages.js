// middlewares/cleanupImages.js
const { deleteImage } = require("../services/imageService");
const imageConfig = require("../config/imageConfig");

/**
 * Delete images based on configured paths for a model
 */
async function deleteImagesByConfig(record, modelName) {
  if (!record) return;

  const paths = imageConfig[modelName] || [];
  console.log(`🧹 Starting image cleanup for ${modelName} with paths:`, paths);

  for (const path of paths) {
    await deleteImagesByPath(record, path);
  }
}

/**
 * Delete images from a specific path
 */
async function deleteImagesByPath(obj, path) {
  if (!obj || !path) return;

  // Handle array notation like "heroSection.points[].image"
  if (path.includes('[]')) {
    await handleArrayPath(obj, path);
  } else {
    // Simple path like "image"
    await handleSimplePath(obj, path);
  }
}

/**
 * Handle paths with arrays like "heroSection.points[].image"
 */
async function handleArrayPath(obj, path) {
  const parts = path.split('[]');
  const arrayPath = parts[0].endsWith('.') ? parts[0].slice(0, -1) : parts[0];
  const remainingPath = parts[1] ? parts[1].slice(1) : ''; // Remove the leading dot

  // Get the array object
  const arrayObj = getNestedValue(obj, arrayPath);

  if (Array.isArray(arrayObj)) {
    for (const item of arrayObj) {
      if (remainingPath) {
        // There's more path after the array, like "points[].image"
        await deleteImagesByPath(item, remainingPath);
      } else {
        // The array contains direct image strings, like "images[]"
        if (typeof item === 'string') {
          await deleteImage(item);
        }
      }
    }
  }
}

/**
 * Handle simple paths without arrays
 */
async function handleSimplePath(obj, path) {
  const value = getNestedValue(obj, path);
  if (typeof value === 'string') {
    await deleteImage(value);
  } else if (Array.isArray(value)) {
    // Handle arrays at the end of path
    for (const item of value) {
      if (typeof item === 'string') {
        await deleteImage(item);
      }
    }
  }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;

  return path.split('.').reduce((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return acc[key];
    }
    return undefined;
  }, obj);
}

/**
 * Cleanup middleware: finds record by id, deletes all images based on config
 */
function cleanupImages(model) {
  return async (req, res, next) => {
    try {
      const record = await model.findById(req.params.id);
      if (!record) return res.status(404).json({ message: "Record not found" });

      console.log(`🧹 Starting image cleanup for: ${model.modelName}`);
      await deleteImagesByConfig(record.toObject(), model.modelName);
      console.log("✅ Image cleanup complete");

      req.record = record;
      next();
    } catch (err) {
      console.error("❌ Image cleanup error:", err);
      res.status(500).json({ message: "Server error during image cleanup" });
    }
  };
}

module.exports = cleanupImages;