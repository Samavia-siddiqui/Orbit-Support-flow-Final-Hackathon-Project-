import express from 'express';
import { updateProfileImage } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.put(
  '/profile-image',
  protect,
  upload.single('profileImage'),
  updateProfileImage
);

export default router;
