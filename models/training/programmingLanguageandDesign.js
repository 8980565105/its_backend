const mongoose = require('mongoose');

const ProgrammingLanguageAndDesignSchema = new mongoose.Schema(
    {
        categroy: {
            type: String,
            required: true
        },
        subCategory:{
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
        descriptionOfCourse: {
            type: String,
            required: true
        },
        courseDuration: {
            type: String,
            required: true
        },
        courseTime: {
            type: String,
            required: true
        },
        skiilLevel:{
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
            required: true
        },
        courseDetails: [{
            type: String,
            required: true
        }],
        keyPointsOfTechnology: [{
            title: {
                type: String,
                required: true
            },
            points: [{
                type: String,
                required: true
            }]
        }],
        faqs: [{
            question: {
                type: String,
                required: true
            },
            answer: [{
                type: String,
                required: true
            }],
        }],
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('ProgrammingLanguageAndDesign', ProgrammingLanguageAndDesignSchema);
