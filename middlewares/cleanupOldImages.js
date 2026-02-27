// middlewares/cleanupOldImages.js
const { deleteImage } = require("../services/imageService");
const imageConfig = require("../config/imageConfig");

/**
 * Get nested value from object using path
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
 * Compare and delete old images that changed
 */
async function compareAndDeleteByPath(oldObj, newObj, path) {
    if (!oldObj) return;

    // Handle array notation like "heroSection.points[].image"
    if (path.includes('[]')) {
        await compareArrayPath(oldObj, newObj, path);
    } else {
        // Simple path
        await compareSimplePath(oldObj, newObj, path);
    }
}

/**
 * Compare array paths like "heroSection.points[].image"
 */
async function compareArrayPath(oldObj, newObj, path) {
    const parts = path.split('[]');
    const arrayPath = parts[0].endsWith('.') ? parts[0].slice(0, -1) : parts[0];
    const remainingPath = parts[1] ? parts[1].slice(1) : '';

    const oldArray = getNestedValue(oldObj, arrayPath);
    const newArray = getNestedValue(newObj, arrayPath);

    if (!Array.isArray(oldArray)) return;

    if (!remainingPath) {
        // Direct array of images like "images[]"
        for (let i = 0; i < oldArray.length; i++) {
            const oldImage = oldArray[i];
            const newImage = newArray?.[i];

            if (oldImage && oldImage !== newImage) {
                await deleteImage(oldImage);
            }
        }
    } else {
        // Nested path after array like "points[].image"
        for (let i = 0; i < oldArray.length; i++) {
            const oldItem = oldArray[i];
            const newItem = newArray?.[i];

            if (oldItem && typeof oldItem === 'object') {
                await compareAndDeleteByPath(oldItem, newItem, remainingPath);
            }
        }
    }
}

/**
 * Compare simple paths without arrays
 */
async function compareSimplePath(oldObj, newObj, path) {
    const oldValue = getNestedValue(oldObj, path);
    const newValue = getNestedValue(newObj, path);

    if (typeof oldValue === 'string' && oldValue !== newValue) {
        await deleteImage(oldValue);
    } else if (Array.isArray(oldValue)) {
        // Handle array of images
        for (let i = 0; i < oldValue.length; i++) {
            const oldImage = oldValue[i];
            const newImage = newValue?.[i];

            if (oldImage && oldImage !== newImage) {
                await deleteImage(oldImage);
            }
        }
    }
}

/**
 * Cleanup old images middleware for UPDATE operations
 */
function cleanupOldImages(model, modelName) {
    return async (req, res, next) => {
        try {
            console.log(`🔄 Cleanup called for model: ${modelName}`);

            const record = await model.findById(req.params.id);
            if (!record) return res.status(404).json({ message: 'Record not found' });

            const paths = imageConfig[modelName] || [];
            console.log(`📁 Config paths for ${modelName}:`, paths);

            const oldData = record.toObject();
            const newData = req.body;

            // Compare each configured path
            for (const path of paths) {
                console.log(`🔄 Processing path: ${path}`);
                await compareAndDeleteByPath(oldData, newData, path);
            }

            req.record = record;
            next();
        } catch (err) {
            console.error('❌ Old image cleanup error:', err);
            res.status(500).json({ message: 'Server error during image cleanup' });
        }
    };
}

module.exports = cleanupOldImages;