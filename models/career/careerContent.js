const mongoose = require("mongoose");

const HeroSectionSchema = new mongoose.Schema(
    {
        image: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
    },
    { _id: false }
);

const CareerAtItsSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        image: { type: String, required: true },
        points: [{ type: String, required: true }],
    },
    { _id: false }
);

const WhyJoinItsSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        points: [
            {
                title: {
                    type: String,
                    required: true,
                },
                description: {
                    type: String,
                    required: true,
                },
                image: {
                    type: String,
                    required: true,
                },
            },
        ],
    },
    { _id: false }
);

const CareerContentSchema = new mongoose.Schema(
    {
        heroSection: HeroSectionSchema,
        careerAtIts: CareerAtItsSchema,
        whyJoinIts: WhyJoinItsSchema,
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("CareerContent", CareerContentSchema);