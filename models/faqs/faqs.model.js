const mongoose = require("mongoose");

const FaqsSchema = new mongoose.Schema(
  {
    categories: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("FaqModel", FaqsSchema);
