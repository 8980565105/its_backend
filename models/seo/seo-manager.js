const mongoose = require("mongoose");

const seoManagerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    seo_keyphrase: {
        type: String,
        default: "",
    },
    seo_title: {
        type: String,
        default: "",
    },
    meta_description: {
        type: String,
        default: "",
    },
    cover_image: {
        type: String,
        default: "",
    },
    // 🔥 NEW: Track which service/hire this belongs to
    linkedService: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        default: null
    },
    linkedHirePage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HirePageData',
        default: null
    },
    linkedType: {
        type: String,
        enum: ['service', 'hire', 'independent'],
        default: 'independent'
    },
    // 🔥 NEW: Prevent auto-sync for independent pages
    isAutoManaged: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});

// Add indexes for better performance
seoManagerSchema.index({ slug: 1 });
seoManagerSchema.index({ title: 1 });
seoManagerSchema.index({ linkedType: 1 });
seoManagerSchema.index({ isAutoManaged: 1 });

module.exports = mongoose.model("SeoManager", seoManagerSchema);