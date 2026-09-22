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

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name email profileImageUrl')
      .populate('assignedTo', 'name email profileImageUrl');

    const io = req.app.get('io');
    if (io) {
      const payload = {
        ticketId: ticket._id.toString(),
        ticketTitle: ticket.title,
        createdBy: {
          _id: req.user._id.toString(),
          name: req.user.name,
          email: req.user.email,
          profileImageUrl: req.user.profileImageUrl,
        },
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt,
        ticket: populatedTicket || ticket,
      };

      console.log(`[Socket] Broadcasting newTicket event for ticket ${ticket._id}`);
      io.to('agents').emit('newTicket', payload);
      io.to('admin').emit('newTicket', payload);
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
      .populate('createdBy', 'name email profileImageUrl')
      .populate('assignedTo', 'name email profileImageUrl')
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
    const isAgent = req.user.role === 'agent' || req.user.role === 'admin';

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
    const isAgent = req.user.role === 'agent' || req.user.role === 'admin';

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
        ticketId: updatedTicket._id.toString(),
        ticketTitle: updatedTicket.title,
        reply: addedReply,
        ticket: updatedTicket,
      };

      const creatorId = (updatedTicket.createdBy?._id || updatedTicket.createdBy).toString();

      if (isAgent) {
        // Agent/Admin replied -> notify customer (createdBy) in their private room
        console.log(`[Socket] Agent replied, emitting newReply to user room ${creatorId}`);
        io.to(creatorId).emit('newReply', payload);
      } else {
        // Customer replied -> notify assigned agent or broadcast to all agents
        if (updatedTicket.assignedTo) {
          const assignedId = (updatedTicket.assignedTo._id || updatedTicket.assignedTo).toString();
          io.to(assignedId).emit('newReply', payload);
        }
        console.log(`[Socket] User replied, emitting newReply to agents broadcast rooms`);
        io.to('agents').emit('newReply', payload);
        io.to('admin').emit('newReply', payload);
      }
    }

    res.status(201).json({
      ...updatedTicket.toObject(),
      reply: updatedTicket.replies[updatedTicket.replies.length - 1],
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

    // Socket.io notification for status change
    const io = req.app.get('io');
    if (io) {
      const statusPayload = {
        ticketId: updatedTicket._id.toString(),
        ticketTitle: updatedTicket.title,
        status: updatedTicket.status,
        assignedTo: updatedTicket.assignedTo,
        ticket: updatedTicket,
      };

      const creatorId = (updatedTicket.createdBy?._id || updatedTicket.createdBy).toString();
      io.to(creatorId).emit('ticketStatusUpdated', statusPayload);
      io.to('agents').emit('ticketStatusUpdated', statusPayload);
      io.to('admin').emit('ticketStatusUpdated', statusPayload);
    }

    res.status(200).json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
