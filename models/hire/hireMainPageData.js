const mongoose = require('mongoose');

const DevelopmentTeamSectionSchema = mongoose.Schema({
    heading: {
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
    }
}, { _id: false });

const DedicatedDeveloperSectionSchema = mongoose.Schema({
    maintitle: {
        type: String,
        required: true
    },
    services: [
        {
            title: {
                type: String,
                required: true
            },
            serviceItemBox: [
                {
                    image: {
                        type: String,
                        required: true
                    },
                    hirepageId: { // Corrected typo from hirepadeId to hirePageId for consistency
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'HirePageData',
                        required: true
                    }
                }
            ]
        }
    ]
}, { _id: false });

const whyHireDeveloperforYourProjectSchema = mongoose.Schema({
    mainTitle: {
        type: String,
        required: true
    },
    detailBox: [{
        image: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        }
    }]
}, { _id: false });


const whyChooseItsForDedicatedResourcesSchema = mongoose.Schema({
    mainTitle: {
        type: String,
        required: true
    },
    detailBox: [
        {
            image: {
                type: String,
                required: true
            },
            label: {
                type: String,
                required: true
            },
            description: {
                type: String,
                required: true
            }
        }
    ]
}, { _id: false });

const hireDedicatedResourcesAndTalentsSchema = mongoose.Schema({
    subTitle: {
        type: String,
        required: true
    },
    mainTitle: {
        type: String,
        required: true
    },
    keyPoints: [{
        type: String,
        required: true
    }],
    buttonTitle: {
        type: String,
        required: true
    }
}, { _id: false });

const HireMainPageDataSchema = mongoose.Schema({
    mainTitle: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    developmentTeamSection: DevelopmentTeamSectionSchema,
    dedicatedDeveloperSection: DedicatedDeveloperSectionSchema,
    whyHireDeveloperforYourProject: whyHireDeveloperforYourProjectSchema,
    whyChooseItsForDedicatedResources: whyChooseItsForDedicatedResourcesSchema,
    hireDedicatedResourcesAndTalents: [hireDedicatedResourcesAndTalentsSchema],
    pricePathAndFAQ: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HirePageData',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('HireMainPageData', HireMainPageDataSchema)