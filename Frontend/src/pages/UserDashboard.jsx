import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Header from '../components/Header';
import BackgroundBlobs from '../components/BackgroundBlobs';
import { Search, Plus, Inbox, AlertTriangle, ArrowRight } from 'lucide-react';

export default function UserDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/tickets/my');
      setTickets(res.data);
      setError('');
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load tickets. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-primary-container/20 text-primary';
      case 'In Progress':
        return 'bg-secondary-container/20 text-secondary';
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-surface-variant text-on-surface-variant';
    }
  };

  const getPriorityBadgeStyles = (priority) => {
    switch (priority) {
      case 'High':
        return 'bg-error-container/25 text-error font-semibold';
      case 'Medium':
        return 'bg-secondary-container/15 text-secondary font-semibold';
      case 'Low':
        return 'bg-primary-container/10 text-primary';
      default:
        return 'bg-surface-variant text-on-surface-variant';
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <BackgroundBlobs>
      <Header />
      <main className="flex-grow max-w-[1200px] mx-auto w-full px-container-padding py-stack-lg flex flex-col gap-stack-lg relative z-10">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="font-h1 text-h1 text-on-surface">My Tickets</h1>
            <p className="font-body-md text-on-surface-variant mt-2">Manage and track your support requests.</p>
          </div>
          
          {/* Filters/Search */}
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-grow bg-surface-container-lowest border border-outline-variant rounded-full px-4 py-2 flex items-center focus-within:border-primary transition-all">
              <Search size={18} className="text-outline mr-2" />
              <input
                className="bg-transparent border-none outline-none text-body-md placeholder:text-outline w-full sm:w-48 focus:ring-0 p-0"
                placeholder="Search tickets..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Ticket List Area */}
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-6 bg-surface-variant rounded w-1/4"></div>
                  <div className="h-6 bg-surface-variant rounded w-16"></div>
                </div>
                <div className="h-4 bg-surface-variant rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-surface-variant rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-error-container/20 border border-error/20 p-6 rounded-xl text-center text-error flex flex-col items-center gap-2">
            <AlertTriangle size={32} />
            <p className="font-body-md">{error}</p>
            <button onClick={fetchTickets} className="text-primary hover:underline text-sm font-medium cursor-pointer">Try Again</button>
          </div>
        ) : filteredTickets.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket._id}
                onClick={() => navigate(`/tickets/${ticket._id}`)}
                className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient hover:bg-surface-bright transition-colors cursor-pointer group border border-transparent flex flex-col justify-between"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-body-md text-on-surface-variant font-medium">#{ticket._id.substring(ticket._id.length - 6).toUpperCase()}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    <span className="font-body-md text-on-surface-variant">Updated {getRelativeTime(ticket.updatedAt)}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className={`${getStatusBadgeStyles(ticket.status)} font-badge text-badge px-3 py-1 rounded-full flex items-center gap-1`}>
                      {ticket.status}
                    </span>
                    <span className={`${getPriorityBadgeStyles(ticket.priority)} font-badge text-badge px-3 py-1 rounded-full flex items-center gap-1`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>
                <h3 className="font-section-header text-section-header text-on-surface mb-2 group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>{ticket.title}</span>
                  <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </h3>
                <p className="font-body-md text-on-surface-variant line-clamp-2">{ticket.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-container-lowest/50 rounded-xl p-8 shadow-ambient">
            <div className="w-24 h-24 mb-6 bg-surface-variant rounded-full flex items-center justify-center shadow-ambient relative overflow-hidden text-outline">
              <Inbox size={48} />
            </div>
            <h2 className="font-h2 text-h2 text-on-surface mb-2">No active tickets</h2>
            <p className="font-body-lg text-on-surface-variant max-w-md mb-8">
              {searchQuery ? "No tickets found matching your query." : "You don't have any support requests at the moment. If you need help, feel free to create a new ticket."}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/create-ticket')}
                className="bg-secondary text-on-secondary px-6 py-3 rounded-full font-body-lg font-medium hover:bg-secondary/90 transition-colors shadow-sm flex items-center gap-2 cursor-pointer mx-auto"
              >
                <Plus size={20} />
                <span>Create New Ticket</span>
              </button>
            )}
          </div>
        )}
      </main>
    </BackgroundBlobs>
  );
}
