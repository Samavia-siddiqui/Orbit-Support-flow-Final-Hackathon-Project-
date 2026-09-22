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
      const currentPath = window.location.pathname;
      const onCurrentTicketPage = currentPath === `/tickets/${data.ticketId}`;
      
      // Do not notify self about own sent message
      const senderId = (data.reply.sentBy?._id || data.reply.sentBy)?.toString();
      const currentUserId = (user?._id || user?.id)?.toString();
      if (senderId && currentUserId && senderId === currentUserId) {
        return;
      }

      // Only notify if current user is the ticket creator OR an agent/admin
      const isCreator = currentUserId && data.creatorId && currentUserId === data.creatorId.toString();
      const isAgent = user?.role === 'agent' || user?.role === 'admin';
      if (!isCreator && !isAgent) {
        return;
      }

      if (!onCurrentTicketPage) {
        addNotification({
          replyId: data.reply._id || `${data.ticketId}-${Date.now()}`,
          ticketId: data.ticketId,
          ticketTitle: data.ticketTitle || 'Support Ticket',
          message: data.reply.message,
          sentBy: data.reply.sentBy,
          createdAt: data.reply.createdAt || new Date().toISOString(),
          type: 'reply',
        });
      }
    };

    const handleNewTicket = (data) => {
      if (!data || !data.ticketId) return;

      // Only notify if current user is agent/admin
      const role = user?.role?.toLowerCase();
      if (role === 'agent' || role === 'admin') {
        addNotification({
          replyId: `new-ticket-${data.ticketId}`,
          ticketId: data.ticketId,
          ticketTitle: data.ticketTitle,
          message: `New support request: "${data.ticketTitle}" (${data.category || 'General'})`,
          sentBy: data.createdBy,
          createdAt: data.createdAt || new Date().toISOString(),
          type: 'new_ticket',
        });
      }
    };

    const handleTicketStatusUpdated = (data) => {
      if (!data || !data.ticketId) return;
      const currentPath = window.location.pathname;
      const onCurrentTicketPage = currentPath === `/tickets/${data.ticketId}`;

      // Notify customer if status changed and not on that ticket page
      if (user?.role !== 'agent' && !onCurrentTicketPage) {
        addNotification({
          replyId: `status-${data.ticketId}-${Date.now()}`,
          ticketId: data.ticketId,
          ticketTitle: data.ticketTitle,
          message: `Status updated to "${data.status}"`,
          sentBy: { name: 'Support System' },
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
