const mongoose = require('mongoose');

const ServiceTechnologyListSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceTechnologyList', ServiceTechnologyListSchema);
