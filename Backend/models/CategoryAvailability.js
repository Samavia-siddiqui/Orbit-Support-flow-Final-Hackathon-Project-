import mongoose from 'mongoose';

const categoryAvailabilitySchema = new mongoose.Schema(
  {
    Billing: {
      type: Boolean,
      default: true,
    },
    Technical: {
      type: Boolean,
      default: true,
    },
    Account: {
      type: Boolean,
      default: true,
    },
    General: {
      type: Boolean,
      default: true,
    },
    Other: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const CategoryAvailability = mongoose.model(
  'CategoryAvailability',
  categoryAvailabilitySchema
);

export default CategoryAvailability;
