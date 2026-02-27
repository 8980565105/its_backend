const mongoose = require('mongoose');

const HeroSectonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    technologySection: [{
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
    }]
}, {
    _id: false
});

const ReasonsToChooseSchema = new mongoose.Schema({
    mainTitle: {
        type: String,
        required: true
    },
    deatailBox: [{

        image: {
            type: String,
            required: true
        },
        total: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        }
    }]

}, { _id: false });

const AboutOurCompanySchema = new mongoose.Schema({
    subtitle: {
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
    deatailBox: [{
        label: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true
        }
    }],
    image: {
        type: String,
        required: true
    },
    buttonContent: {
        total: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true
        }

    }
}, { _id: false })

const OverseasWebAgenciesSchema = new mongoose.Schema({
    mainTitle: {
        type: String,
        required: true
    },

    image: {
        type: String,
        required: true
    },
    desctiption: {
        type: String,
        required: true
    },
    detail: {
        title: {
            type: String,
            required: true
        },
        subtitle: {
            type: String,
            required: true
        }
    },
}, { _id: false })


const HomePageDataSchema = new mongoose.Schema({
    heroSecton: HeroSectonSchema,
    reasonsToChoose: ReasonsToChooseSchema,
    aboutOurCompany: AboutOurCompanySchema,
    overseasWebAgencies: OverseasWebAgenciesSchema
}, { timestamps: true })


module.exports = mongoose.model('HomePageData', HomePageDataSchema)