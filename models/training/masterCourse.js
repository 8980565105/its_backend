const moongoose = require("mongoose");


const MasterCourseSchema = new moongoose.Schema(
    {
        category: {
            type: String,
            required: true
        },
        subCategory: {
            type: String,
            required: true
        },
        courseTitle: {
            type: String,
            required: true
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        aboutCourseDescription: {
            type: String,
            required: true
        },
        keyPointsOfTeachnology: [{
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
        courseDuration: {
            type: String,
            required: true
        },
        courseTime: {
            type: String,
            required: true
        },
        skillLevel: {
            type: String,
            required: true
        },
    },
    {
        timestamps: true
    }
);

module.exports = moongoose.model("MasterCourse", MasterCourseSchema);