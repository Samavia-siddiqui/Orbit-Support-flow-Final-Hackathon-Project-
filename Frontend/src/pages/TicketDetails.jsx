import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Header from '../components/Header';
import BackgroundBlobs from '../components/BackgroundBlobs';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ArrowLeft, Send, Clock, Loader2, AlertTriangle, User, Paperclip } from 'lucide-react';

export default function TicketDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newReply, setNewReply] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  // Real-time socket event listener for incoming replies
  useEffect(() => {
    if (!socket || !id) return;

    const handleNewReplyEvent = (data) => {
      // Check if the reply belongs to the current ticket
      if (data.ticketId === id) {
        setReplies((prev) => {
          // Double check to prevent duplicate messages
          const exists = prev.some((r) => r._id === data.reply._id);
          if (exists) return prev;
          return [...prev, data.reply];
        });
      }
    };

    socket.on('newReply', handleNewReplyEvent);

    return () => {
      socket.off('newReply', handleNewReplyEvent);
    };
  }, [socket, id]);

  // Auto-scroll to bottom of replies when replies state changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies]);

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data);
      setReplies(res.data.replies || []);
      setError('');
    } catch (err) {
      console.error('Error fetching ticket details:', err);
      setError('Could not load ticket details. It might have been deleted or you do not have permission.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    try {
      setSubmittingReply(true);
      const res = await api.post(`/tickets/${id}/reply`, {
        message: newReply.trim(),
      });
      // Append the reply locally
      setReplies((prev) => [...prev, res.data.reply]);
      setNewReply('');
    } catch (err) {
      console.error('Error posting reply:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleStatusChange = async (e) => {
    const nextStatus = e.target.value;
    try {
      setChangingStatus(true);
      const res = await api.put(`/tickets/${id}/status`, {
        status: nextStatus,
      });
      // Update ticket state with response to show new status and potential new assignedTo agent
      setTicket(res.data);
      setReplies(res.data.replies || []);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update ticket status.');
    } finally {
      setChangingStatus(false);
    }
  };

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-primary-container/20 text-primary border-primary-container/30';
      case 'In Progress':
        return 'bg-secondary-container/20 text-secondary border-secondary-container/30';
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Closed':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-surface-variant text-on-surface-variant border-outline-variant';
    }
  };

  const getFormattedTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFormattedDate = (dateString) => {
    return new Date(dateString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <BackgroundBlobs>
        <Header />
        <div className="flex-grow flex items-center justify-center relative z-10">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      </BackgroundBlobs>
    );
  }

  if (error || !ticket) {
    return (
      <BackgroundBlobs>
        <Header />
        <main className="flex-grow max-w-[1000px] mx-auto w-full px-4 py-stack-lg flex flex-col items-center justify-center relative z-10 text-center">
          <AlertTriangle size={48} className="text-error mb-4" />
          <h2 className="font-h2 text-h2 text-on-surface mb-2">Error Loading Ticket</h2>
          <p className="font-body-lg text-on-surface-variant mb-6">{error || 'Ticket not found.'}</p>
          <button
            onClick={() => navigate(user.role === 'agent' ? '/agent/dashboard' : '/dashboard')}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-full font-body-md hover:bg-primary/95 transition-colors cursor-pointer"
          >
            Go Back
          </button>
        </main>
      </BackgroundBlobs>
    );
  }

  return (
    <BackgroundBlobs>
      <Header />
      <main className="flex-1 relative z-10 w-full max-w-[1000px] mx-auto px-4 md:px-container-padding py-6 flex flex-col h-[calc(100vh-64px)] justify-between">
        
        {/* Back Link */}
        <div className="mb-4 flex items-center gap-2 text-on-surface-variant shrink-0">
          <button
            onClick={() => navigate(user.role === 'agent' ? '/agent/dashboard' : '/dashboard')}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors group cursor-pointer"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <span className="text-body-md font-body-md font-medium">
            Back to {user.role === 'agent' ? 'Agent Dashboard' : 'My Tickets'}
          </span>
        </div>

        {/* Conversation Box */}
        <div className="bg-surface-container-lowest rounded-[24px] shadow-ambient flex flex-col flex-grow overflow-hidden border border-outline-variant/10">
          
          {/* Header section */}
          <header className="px-6 py-4 md:px-8 md:py-6 border-b border-surface-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-bright shrink-0">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <span className="font-badge text-badge text-outline tracking-wider uppercase font-semibold">
                  #{ticket._id.substring(ticket._id.length - 6).toUpperCase()}
                </span>
                
                {/* Status selector for agents or label for users */}
                {user.role === 'agent' ? (
                  <div className="relative inline-flex items-center">
                    <select
                      value={ticket.status}
                      onChange={handleStatusChange}
                      disabled={changingStatus}
                      className={`px-3 py-1 text-sm font-semibold rounded-full border cursor-pointer outline-none transition-colors ${getStatusBadgeStyles(
                        ticket.status
                      )}`}
                    >
                      {ticket.assignedTo ? (
                        <>
                          <option value={ticket.status}>{ticket.status}</option>
                          {ticket.status !== 'Closed' && <option value="Closed">Closed</option>}
                        </>
                      ) : (
                        <>
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </>
                      )}
                    </select>
                    {changingStatus && <Loader2 size={12} className="animate-spin text-outline ml-2" />}
                  </div>
                ) : (
                  <span className={`px-2.5 py-0.5 rounded-full border text-badge font-badge font-bold uppercase tracking-wider ${getStatusBadgeStyles(ticket.status)}`}>
                    {ticket.status}
                  </span>
                )}

                <span className="text-xs px-2 py-0.5 rounded bg-surface-variant text-on-surface-variant font-medium">
                  {ticket.category}
                </span>
              </div>
              <h1 className="font-h1 text-h2 text-on-surface font-semibold">{ticket.title}</h1>
            </div>
            
            <div className="flex items-center gap-2 text-on-surface-variant text-sm mt-1 sm:mt-0">
              <Clock size={16} />
              <span>Created {getFormattedDate(ticket.createdAt)}</span>
            </div>
          </header>

          {/* Conversation Chat Stream */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 bg-[#FCFBF9]">
            
            {/* System timeline message */}
            <div className="flex justify-center my-2 shrink-0">
              <span className="px-4 py-1.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold tracking-wide">
                Ticket Opened • {getFormattedDate(ticket.createdAt)} at {getFormattedTime(ticket.createdAt)}
              </span>
            </div>

            {/* Original Ticket Description as First Message */}
            <div className="flex justify-start gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0 shadow-sm border border-outline-variant/30">
                {ticket.createdBy?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="max-w-[85%] md:max-w-[70%] flex flex-col items-start gap-1">
                <span className="text-sm font-bold text-primary ml-1">
                  {ticket.createdBy?.name || 'User'} <span className="font-normal text-[11px] text-on-surface-variant opacity-80">(Creator)</span>
                </span>
                <div className="bg-surface-container-lowest text-on-surface p-4 rounded-2xl rounded-tl-sm shadow-sm border border-surface-variant">
                  <p className="font-body-md text-body-md whitespace-pre-wrap">{ticket.description}</p>
                </div>
                <span className="text-[10px] text-on-surface-variant opacity-75 px-1">{getFormattedTime(ticket.createdAt)}</span>
              </div>
            </div>

            {/* Thread Replies */}
            {replies.map((reply) => {
              // Determine if the reply was sent by the logged-in user
              const isSelf = reply.sentBy && (reply.sentBy._id === user._id || reply.sentBy === user._id);

              return (
                <div key={reply._id} className={`flex ${isSelf ? 'justify-end' : 'justify-start gap-3'} mt-2`}>
                  
                  {/* Left avatar if message is from other party */}
                  {!isSelf && (
                    <div className="w-9 h-9 rounded-full bg-secondary/15 flex items-center justify-center text-secondary text-sm font-bold shrink-0 shadow-sm border border-outline-variant/30">
                      {reply.sentBy?.name?.charAt(0).toUpperCase() || 'S'}
                    </div>
                  )}

                  <div className={`max-w-[85%] md:max-w-[70%] flex flex-col ${isSelf ? 'items-end' : 'items-start'} gap-1`}>
                    {!isSelf && (
                      <span className="text-sm font-bold text-primary ml-1">
                        {reply.sentBy?.name || 'Support'}
                        {reply.sentBy?.role === 'agent' && (
                          <span className="bg-secondary/10 text-secondary text-[10px] px-1.5 py-0.5 rounded ml-1 font-semibold">
                            Agent
                          </span>
                        )}
                      </span>
                    )}

                    <div className={`p-4 rounded-2xl shadow-sm border ${
                      isSelf 
                        ? 'bg-surface text-on-surface rounded-tr-sm border-primary/10' 
                        : 'bg-surface-container-lowest text-on-surface rounded-tl-sm border-surface-variant'
                    }`}>
                      <p className="font-body-md text-body-md whitespace-pre-wrap">{reply.message}</p>
                    </div>
                    
                    <span className="text-[10px] text-on-surface-variant opacity-75 px-1">
                      {getFormattedTime(reply.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {/* Div hook to scroll to bottom */}
            <div ref={chatEndRef} />
          </div>

          {/* Footer Input Bar */}
          <div className="p-4 md:p-6 bg-surface-container-lowest border-t border-surface-variant shrink-0">
            {ticket.status === 'Closed' ? (
              <div className="text-center py-2 text-on-surface-variant/80 font-body-md text-sm font-medium">
                This ticket has been closed. No further replies can be added.
              </div>
            ) : (
              <form onSubmit={handleSendReply} className="relative flex items-end gap-3 bg-warm-ivory rounded-[20px] p-2 border border-outline-variant/30 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-sm">
                
                {/* Mock attachment icon */}
                <button type="button" className="p-2.5 text-on-surface-variant hover:text-primary hover:bg-white rounded-full transition-colors shrink-0 flex items-center justify-center cursor-pointer">
                  <Paperclip size={18} />
                </button>

                {/* Text area */}
                <textarea
                  className="w-full bg-transparent border-none focus:ring-0 resize-none font-body-md text-on-surface py-2 px-1 min-h-[40px] max-h-[120px] outline-none"
                  placeholder="Type your message here..."
                  rows={1}
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply(e);
                    }
                  }}
                  disabled={submittingReply}
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={submittingReply || !newReply.trim()}
                  className="h-10 px-5 bg-secondary text-on-secondary rounded-full hover:bg-secondary-container hover:text-on-secondary-container transition-colors shrink-0 flex items-center justify-center gap-2 font-medium mb-0.5 mr-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingReply ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <span>Send</span>
                      <Send size={14} />
                    </>
                  )}
                </button>
              </form>
            )}
            
            <div className="text-center mt-3 shrink-0">
              <span className="text-xs text-on-surface-variant/70 font-body-md">
                All conversations are secured and monitored.
              </span>
            </div>
          </div>

        </div>
      </main>
    </BackgroundBlobs>
  );
}
