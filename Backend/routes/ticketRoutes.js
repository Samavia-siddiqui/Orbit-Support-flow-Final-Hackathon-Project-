import express from 'express';
import {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicketById,
  addReply,
  updateTicketStatus,
  deleteTicket,
} from '../controllers/ticketController.js';
import { protect, agentOnly, userOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, userOnly, createTicket);
router.get('/my', protect, getMyTickets);
router.get('/', protect, agentOnly, getAllTickets);
router.get('/:id', protect, getTicketById);
router.post('/:id/reply', protect, addReply);
router.patch('/:id/status', protect, agentOnly, updateTicketStatus);
router.put('/:id/status', protect, agentOnly, updateTicketStatus);
router.delete('/:id', protect, agentOnly, deleteTicket);

export default router;
