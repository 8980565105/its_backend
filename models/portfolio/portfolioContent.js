const mongoose = require('mongoose');

const portfolioContentSchema = new mongoose.Schema({
    heroSection: {
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true
        },
        points: [{
            label: {
                type: String,
                required: true
            },
            image: {
                type: String,
                required: true
            }
        }]
    }
}, { timestamps: true })

module.exports = mongoose.model('PortfolioContent', portfolioContentSchema);