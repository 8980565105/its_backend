const mongoose = require('mongoose');

const expertiseIndustriesSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('ExpertiseIndustries', expertiseIndustriesSchema);