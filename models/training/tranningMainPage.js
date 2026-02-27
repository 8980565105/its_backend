const mongoose = require('mongoose');

const HeroSectionSchema = new mongoose.Schema({
    subTitle: {
        type: String,
        required: true
    },
    mainTitle: {
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
}, { _id: false });

const AboutusSectionSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true
    },
    subTitle: {
        type: String,
        required: true
    },
    mainTitle: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    detailbox: {
        title: {
            type: String,
            required: true
        },
        detailbox: [{
            heading: {
                type: String,
                required: true
            },
            description: {
                type: String,
                required: true
            }
        }]
    }

}, { _id: false });

const ITSInstituteFacilitiesSectionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    points: [{
        heading: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true
        },
    }]
}, { _id: false })

const rightCoursePickSectionSchema = new mongoose.Schema({
    mainHeading: {
        type: String,
        required: true
    },
    cardBox: [{
        heading: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true
        },
    }],
    subTitle: {
        type: String,
        required: true
    },
    mainTitle: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    detailbox: [{
        image: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        }
    }]

}, { _id: false })

const TranningMainPageSchema = new mongoose.Schema({
    heroSection: HeroSectionSchema,
    aboutusSection: AboutusSectionSchema,
    itsInstituteFacilitiesSection: ITSInstituteFacilitiesSectionSchema,
    rightCoursePickSection: rightCoursePickSectionSchema
}, { timestamps: true });

module.exports = mongoose.model('TrainingMainPageData', TranningMainPageSchema)