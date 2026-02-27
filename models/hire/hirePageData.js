const mongoose = require('mongoose');

const FAQSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
}, { _id: false });

const OurExpertiseSchema = new mongoose.Schema({
    keyPoints: [{
        type: String,
        required: true
    }],
}, { _id: false });

const hireingProcessSchema = new mongoose.Schema({
    steps: [{
        type: String,
        required: true
    }],
}, { _id: false });

const whyHireUsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    details: [{
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
    }],
}, { _id: false });

const HireDaidatedSchema = new mongoose.Schema({
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
}, { _id: false });


const SucessSpeacksSchema = new mongoose.Schema({
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
}, { _id: false });

const unLoackPowerSchema = new mongoose.Schema({
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
}, { _id: false });


const TechStackDetailSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    }, 
    section: {
        type: Number,
        required: true
    },
    keyPoints: [{
        type: String,
        required: true
    }],
}, { _id: false });

const TechStackSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    details: [TechStackDetailSchema],
}, { _id: false });


const HireDevelopersAsYourNeeds = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    planDetails: [{
        timelLine: {
            type: String,
            required: true
        },
        price: {
            type: String,
            required: true
        },
        keyPoints: [{
            type: String,
            required: true
        }],
    }],
    benefits: [{
        type: String,
        required: true
    }],

}, { _id: false });


const HirePageDataSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    subCategory: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    keyPoints: [{
        type: String,
        required: true
    }],
    successSpeacks: SucessSpeacksSchema,
    hireDevelopersAsYourNeeds: HireDevelopersAsYourNeeds,
    hireDadiated: HireDaidatedSchema,
    ourExpertise: OurExpertiseSchema,
    techStack: TechStackSchema,
    whyHireUs: whyHireUsSchema,
    unloackPower: unLoackPowerSchema,
    hireingProcess: hireingProcessSchema,
    faq: [FAQSchema],
}, { timestamps: true });

module.exports = mongoose.model('HirePageData', HirePageDataSchema);

