const mongoose = require('mongoose');

const creativeWorkSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true, // ✅ make it required (change to false if optional)
            trim: true
        },
        url: {
            type: String,
            required: false, // ✅ optional (set true if required)
            trim: true
        },
        image: {
            type: String,
            required: true,
            default: null
        },
        // description: {
        //     type: String,
        //     required: true
        // },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('CreativeWork', creativeWorkSchema);
