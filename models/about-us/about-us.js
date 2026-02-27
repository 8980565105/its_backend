const mongoose = require('mongoose');

const HeroSectionSchema = new mongoose.Schema({
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
}, { _id: false });

const WhoWeAreSchema = new mongoose.Schema({
    description: [
        {
            type: String,
            required: true
        }
    ],
    image: {
        type: String,
        required: true,
        // default: null
    }
}, { _id: false });

const GoalsSchema = new mongoose.Schema({
    missionTitle: {
        type: String,
        required: true
    },
    missionDescription: {
        type: String,
        required: true
    },
    missionImage: {
        type: String,
        required: true,
        default: null
    },
    visionTitle: {
        type: String,
        required: true
    },
    visionDescription: {
        type: String,
        required: true
    },
    visionImage: {
        type: String,
        required: true,
        default: null
    },
    valuesTitle: {
        type: String,
        required: true
    },
    valuesDescription: {
        type: String,
        required: true
    },
    valuesImage: {
        type: String,
        required: true,
        default: null
    }
}, { _id: false });

const AboutUsSchema = new mongoose.Schema({
    heroSection : HeroSectionSchema,
    whoWeAre: WhoWeAreSchema,
    goals: GoalsSchema,
}, { timestamps: true });

module.exports = mongoose.model('AboutUs', AboutUsSchema);


