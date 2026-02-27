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

const KeyPointBoxSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    content: [
        {
            name: {
                type: String,
                required: true
            },
            image: {
                type: String,
                default: null
            }, // URL or file path
        }
    ]
}, { _id: false });

const ToolDetailSchema = new mongoose.Schema({
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
    }]
}, { _id: false });

const ToolSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: { type: String },
    details: [ToolDetailSchema], // array of detail boxes
}, { _id: false });

const ContentBlockSchema = new mongoose.Schema({
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
        required: true,
        default: null
    }, // URL or file path
}, { _id: false });

const WhyWorkWithSchema = new mongoose.Schema({
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
        required: true,
        default: null
    },
    content: [
        {
            title: {
                type: String,
                required: true
            },
            description: {
                type: String,
                required: true
            },
        }
    ]
}, { _id: false });


const ServiceSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: true
        },
        subCategory: {
            type: String,
            required: true
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        mainTitle: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        subMainTitle: {
            type: String,
            required: true
        },
        subMainTitleDescription: {
            type: String,
            required: true
        },
        contentBlocks: [ContentBlockSchema],

        WhyWorkWithThis: WhyWorkWithSchema,

        workProgress: {
            type: String,
            default: null
        },

        toolsAndTechnology: ToolSchema,

        whyCompanyPerfersThis: KeyPointBoxSchema,

        faqs: [FAQSchema],
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Service', ServiceSchema);