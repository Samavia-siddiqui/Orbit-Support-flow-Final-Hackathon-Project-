import CategoryAvailability from '../models/CategoryAvailability.js';

// Get Category Availability Configuration
export const getCategoryAvailability = async (req, res) => {
  try {
    const availability = await CategoryAvailability.findOne();
    if (!availability) {
      return res.status(404).json({ message: 'Category availability configuration not found.' });
    }
    res.status(200).json(availability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Category Availability Configuration
export const updateCategoryAvailability = async (req, res) => {
  try {
    let availability = await CategoryAvailability.findOne();
    if (!availability) {
      availability = new CategoryAvailability({});
    }

    const { Billing, Technical, Account, General, Other } = req.body;

    if (Billing !== undefined) availability.Billing = Billing;
    if (Technical !== undefined) availability.Technical = Technical;
    if (Account !== undefined) availability.Account = Account;
    if (General !== undefined) availability.General = General;
    if (Other !== undefined) availability.Other = Other;

    await availability.save();
    res.status(200).json(availability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
