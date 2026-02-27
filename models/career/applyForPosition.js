const mongoose = require("mongoose");

const applyPositionSchema = new mongoose.Schema(
    {
        name: {
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
        graduation : {
            type: String,
            required: true
        },
        experience: {
            type: String,
            required: true
        },
        positionApplied : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'OpenningPosition',
            required: true
        },
        currentCTC: {
            type: String,
            required: true
        },
        noticePeriod: {
            type: String,
            required: true
        },
        message:  {
            type: String,
            required: true
        },
        fileUrl: {
            type: String,
            default: null
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ApplyPosition", applyPositionSchema
)