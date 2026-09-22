import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import SignupOrLogin from './signup or login';
import UserDashboard from './pages/UserDashboard';
import CreateTicket from './pages/CreateTicket';
import TicketDetails from './pages/TicketDetails';
import AgentDashboard from './pages/AgentDashboard';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Landing from './pages/Landing';
import { useEffect } from 'react';

function SocketListener() {
  const socket = useSocket();
  const { addNotification, user } = useAuth();

  useEffect(() => {
    if (!socket) return;

    const handleNewReply = (data) => {
      if (!data || !data.reply) return;
      
      // Do not notify self about own sent message
      const senderId = (data.reply.sentBy?._id || data.reply.sentBy)?.toString();
      const currentUserId = (user?._id || user?.id)?.toString();
      if (senderId && currentUserId && senderId === currentUserId) {
        return;
      }

      // If creatorId is known and current user is a customer, only notify the creator
      const creatorId = (data.creatorId || data.ticket?.createdBy?._id || data.ticket?.createdBy || data.createdBy?._id || data.createdBy)?.toString();
      const isAgent = user?.role === 'agent' || user?.role === 'admin';
      const isCreator = currentUserId && creatorId && currentUserId === creatorId;
      
      if (!isAgent && !isCreator && creatorId) {
        return;
      }

      console.log('[SocketListener] Adding reply notification to bell:', data.ticketTitle);
      addNotification({
        replyId: data.reply._id || `${data.ticketId}-${Date.now()}-${Math.random()}`,
        ticketId: data.ticketId,
        ticketTitle: data.ticketTitle || 'Support Ticket',
        message: data.reply.message,
        sentBy: data.reply.sentBy,
        createdAt: data.reply.createdAt || new Date().toISOString(),
        type: 'reply',
      });
    };

    const handleNewTicket = (data) => {
      if (!data || !data.ticketId) return;

      const role = user?.role?.toLowerCase();
      if (role === 'agent' || role === 'admin') {
        console.log('[SocketListener] Adding new ticket notification to bell:', data.ticketTitle);
        addNotification({
          replyId: `new-ticket-${data.ticketId}-${Date.now()}`,
          ticketId: data.ticketId,
          ticketTitle: data.ticketTitle || 'New Ticket',
          message: `New support request: "${data.ticketTitle}" (${data.category || 'General'})`,
          sentBy: data.createdBy,
          createdAt: data.createdAt || new Date().toISOString(),
          type: 'new_ticket',
        });
      }
    };

    const handleTicketStatusUpdated = (data) => {
      if (!data || !data.ticketId) return;

      // Notify customer when status updated
      if (user?.role !== 'agent' && user?.role !== 'admin') {
        console.log('[SocketListener] Adding status update notification to bell:', data.status);
        addNotification({
          replyId: `status-${data.ticketId}-${Date.now()}`,
          ticketId: data.ticketId,
          ticketTitle: data.ticketTitle || 'Support Ticket',
          message: `Ticket status updated to "${data.status}"`,
          sentBy: { name: 'Support Desk' },
          createdAt: new Date().toISOString(),
          type: 'status_update',
        });
      }
    };

    socket.on('newReply', handleNewReply);
    socket.on('newTicket', handleNewTicket);
    socket.on('ticketStatusUpdated', handleTicketStatusUpdated);

    return () => {
      socket.off('newReply', handleNewReply);
      socket.off('newTicket', handleNewTicket);
      socket.off('ticketStatusUpdated', handleTicketStatusUpdated);
    };
  }, [socket, addNotification, user?._id, user?.id, user?.role]);

  return null;
}

// Route protector for customers (users)
function CustomerRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'agent') return <Navigate to="/agent/dashboard" />;
  return children;
}

// Route protector for support agents
function AgentRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'agent') return <Navigate to="/dashboard" />;
  return children;
}

function AppContent() {
  const { user } = useAuth();

  return (
    <SocketProvider user={user}>
      <SocketListener />
      <Router>
        <Routes>
          {/* Public Landing route */}
          <Route 
            path="/" 
            element={user ? <Navigate to={user.role === 'agent' ? '/agent/dashboard' : '/dashboard'} /> : <Landing />} 
          />

          {/* Public Authentication routes */}
          <Route 
            path="/login" 
            element={!user ? <SignupOrLogin /> : <Navigate to={user.role === 'agent' ? '/agent/dashboard' : '/dashboard'} />} 
          />
          <Route 
            path="/register" 
            element={!user ? <SignupOrLogin /> : <Navigate to={user.role === 'agent' ? '/agent/dashboard' : '/dashboard'} />} 
          />

          {/* Protected Customer Routes */}
          <Route 
            path="/dashboard" 
            element={<CustomerRoute><UserDashboard /></CustomerRoute>} 
          />
          <Route 
            path="/create-ticket" 
            element={<CustomerRoute><CreateTicket /></CustomerRoute>} 
          />
          <Route 
            path="/tickets/:id" 
            element={user ? <TicketDetails /> : <Navigate to="/login" />} 
          />

          {/* Protected Agent Routes */}
          <Route 
            path="/agent/dashboard" 
            element={<AgentRoute><AgentDashboard /></AgentRoute>} 
          />

          {/* Protected Shared Routes */}
          <Route 
            path="/profile" 
            element={user ? <Profile /> : <Navigate to="/login" />} 
          />

          {/* Catch-all page redirection */}
          <Route 
            path="*" 
            element={user ? <NotFound /> : <Navigate to="/login" />} 
          />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
