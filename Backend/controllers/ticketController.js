import Ticket from '../models/Ticket.js';

// User creates ticket
export const createTicket = async (req, res) => {
  try {
    const { title, description, priority, category } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const ticket = await Ticket.create({
      title,
      description,
      priority: priority || 'Medium',
      category: category || 'General',
      createdBy: req.user._id,
    });

    const io = req.app.get('io');
    if (io) {
      io.to('agents').emit('newTicket', {
        ticketId: ticket._id,
        ticketTitle: ticket.title,
        createdBy: {
          _id: req.user._id,
          name: req.user.name,
        },
        category: ticket.category,
        priority: ticket.priority,
        createdAt: ticket.createdAt,
      });
    }

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retrieve logged-in user's tickets
export const getMyTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retrieve all tickets (Agent Only, with status filter)
export const getAllTickets = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const tickets = await Ticket.find(filter)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retrieve single ticket (Owner or Agent Only)
export const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email profileImageUrl')
      .populate('assignedTo', 'name email profileImageUrl')
      .populate('replies.sentBy', 'name email profileImageUrl');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const isOwner = ticket.createdBy._id.toString() === req.user._id.toString();
    const isAgent = req.user.role === 'agent';

    if (!isOwner && !isAgent) {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add reply to ticket (Owner or Agent Only)
export const addReply = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const isOwner = ticket.createdBy.toString() === req.user._id.toString();
    const isAgent = req.user.role === 'agent';

    if (!isOwner && !isAgent) {
      return res.status(403).json({ message: 'Not authorized to reply to this ticket' });
    }

    // Add reply
    ticket.replies.push({
      message,
      sentBy: req.user._id,
    });
    await ticket.save();

    // Populate for response
    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name email profileImageUrl')
      .populate('assignedTo', 'name email profileImageUrl')
      .populate('replies.sentBy', 'name email profileImageUrl');

    // Socket.io notification hook
    const io = req.app.get('io');
    if (io) {
      const addedReply = updatedTicket.replies[updatedTicket.replies.length - 1];
      const payload = {
        ticketId: updatedTicket._id,
        ticketTitle: updatedTicket.title,
        reply: addedReply,
      };

      if (isAgent) {
        // Agent replied -> notify user (createdBy)
        io.to(updatedTicket.createdBy._id.toString()).emit('newReply', payload);
      } else {
        // User replied -> notify assigned agent (if assigned) or broadcast to all agents!
        if (updatedTicket.assignedTo) {
          io.to(updatedTicket.assignedTo._id.toString()).emit('newReply', payload);
        } else {
          io.to('agents').emit('newReply', payload);
        }
      }
    }

    res.status(201).json({
      ...updatedTicket.toObject(),
      reply: addedReply,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Ticket Status (Agent Only)
export const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Update status
    ticket.status = status;

    // Auto-assign to the agent performing the update if currently unassigned
    if (!ticket.assignedTo) {
      ticket.assignedTo = req.user._id;
    }

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name email profileImageUrl')
      .populate('assignedTo', 'name email profileImageUrl')
      .populate('replies.sentBy', 'name email profileImageUrl');

    res.status(200).json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
