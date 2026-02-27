const mongoose = require('mongoose');

const navbarGroupTabImageHandleSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true
    },
    linkedType: {
        type: String,
        enum: ['service', 'hire'],
        required: true
    },
    linkedService: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        // FIX: Removed 'default: null'
    },
    linkedHirePage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HirePageData',
        // FIX: Removed 'default: null'
    },
}, {
    timestamps: true,
});

// ✨ FIX: Add sparse unique indexes. This is the crucial part.
// This ensures that uniqueness is only applied when the field actually has a value.
navbarGroupTabImageHandleSchema.index({ linkedService: 1 }, { unique: true, sparse: true });
navbarGroupTabImageHandleSchema.index({ linkedHirePage: 1 }, { unique: true, sparse: true });


module.exports = mongoose.model("NavbarGroupTabImageManage", navbarGroupTabImageHandleSchema);