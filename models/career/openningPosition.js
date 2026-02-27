const mongoose = require('mongoose');

const openningPositionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: null
    },
    openning: {
        type: [Number, String], // Allows number or string
        required: true
    },
    qualifications: {
        type: String,
        required: true
    },
    experience: {
        type: String,
        required: true
    }
}, { timestamps: true });
module.exports = mongoose.model('OpenningPosition', openningPositionSchema);
