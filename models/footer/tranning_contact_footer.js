const mongoose = require("mongoose");

const tranningContactFooterSchema = new mongoose.Schema(
    {
        fullname: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true
        },
        message: {
            type: String,
            required: true
        },
        location: {
            type: String,
            required: true
        },
        selectedCourse: {
            type: String,
            required: true,
            enum:["Web Development","Full Stack Development", "Mobile App Development", "UI/UX Design", "Web Design", "Other Services" ]
        },
    },
    {
        timestamps: true
    }
)
module.exports = mongoose.model("TranningContact", tranningContactFooterSchema);