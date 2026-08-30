import express from 'express';
import { getCategoryAvailability, updateCategoryAvailability } from '../controllers/categoryController.js';
import { protect, agentOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getCategoryAvailability);
router.put('/', protect, agentOnly, updateCategoryAvailability);

export default router;
