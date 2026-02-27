const mongoose = require('mongoose');

const engagementModelSchema = new mongoose.Schema(
  {
    modelTitle: {
      type: String,
      required: true,
      trim: true
    },
    modelDescription: {
      type: String,
      required: true
    },
    modelImage: {
      type: String,
      required: true
    },
    keyPoints: {
      type: [String], // Array of strings
      required: true
    },
    supportModel: {
      type: String,
      default: "24x7 chat support"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('EngagementModel', engagementModelSchema);
