const mongoose = require('mongoose');

const homeChooseItsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String, 
        default: null
    },
}, {
    timestamps: true
});


module.exports = mongoose.model('HomeChooseIts', homeChooseItsSchema);