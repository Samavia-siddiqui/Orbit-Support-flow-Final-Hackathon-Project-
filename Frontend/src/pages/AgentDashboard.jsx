import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Swal from 'sweetalert2';
import { 
  LayoutDashboard, 
  Inbox, 
  UserCheck, 
  LogOut, 
  Search, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  HelpCircle,
  ToggleLeft,
  Bell,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

export default function AgentDashboard() {
  const { user, logout, notifications, clearNotification, clearAllNotifications } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState({
    Billing: true,
    Technical: true,
    Account: true,
    General: true,
    Other: true
  });

  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [updatingCategory, setUpdatingCategory] = useState('');
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('unassigned'); // 'unassigned' | 'my' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchTickets();
    fetchCategories();
  }, []);

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Background silent fetch for real-time ticket updates
  const fetchTicketsSilent = async () => {
    try {
      const res = await api.get('/tickets');
      setTickets(res.data);
    } catch (err) {
      console.error('Error auto-refreshing tickets:', err);
    }
  };

  // Real-time socket updates for new replies, new tickets, and status changes
  useEffect(() => {
    if (!socket) return;
    const handleLiveTicketUpdate = () => {
      console.log('[AgentDashboard] Live socket event received, updating ticket queue silently.');
      fetchTicketsSilent();
    };

    socket.on('newReply', handleLiveTicketUpdate);
    socket.on('newTicket', handleLiveTicketUpdate);
    socket.on('ticketStatusUpdated', handleLiveTicketUpdate);

    return () => {
      socket.off('newReply', handleLiveTicketUpdate);
      socket.off('newTicket', handleLiveTicketUpdate);
      socket.off('ticketStatusUpdated', handleLiveTicketUpdate);
    };
  }, [socket]);

  const handleNotificationClick = (ticketId) => {
    clearNotification(ticketId);
    setShowNotifications(false);
    navigate(`/tickets/${ticketId}`);
  };

  const handleClearAllNotifications = (e) => {
    e.stopPropagation();
    if (clearAllNotifications) {
      clearAllNotifications();
    } else {
      const uniqueTicketIds = [...new Set(notifications.map((n) => n.ticketId))];
      uniqueTicketIds.forEach((id) => clearNotification(id));
    }
  };

  const fetchTickets = async () => {
    try {
      setLoadingTickets(true);
      const res = await api.get('/tickets');
      setTickets(res.data);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await api.get('/category-availability');
      if (res.data) {
        setCategories({
          Billing: res.data.Billing ?? true,
          Technical: res.data.Technical ?? true,
          Account: res.data.Account ?? true,
          General: res.data.General ?? true,
          Other: res.data.Other ?? true
        });
      }
    } catch (err) {
      console.error('Error fetching category availability:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleToggleCategory = async (catName) => {
    const nextState = !categories[catName];
    try {
      setUpdatingCategory(catName);
      const res = await api.put('/category-availability', {
        [catName]: nextState
      });
      setCategories({
        Billing: res.data.Billing ?? true,
        Technical: res.data.Technical ?? true,
        Account: res.data.Account ?? true,
        General: res.data.General ?? true,
        Other: res.data.Other ?? true
      });
    } catch (err) {
      console.error('Error updating category availability:', err);
      alert('Failed to update category availability status.');
    } finally {
      setUpdatingCategory('');
    }
  };

  const handleAssignToMe = async (ticketId, e) => {
    e.stopPropagation(); // Avoid triggering card navigation
    try {
      const res = await api.put(`/tickets/${ticketId}/status`, {
        status: 'In Progress'
      });
      // Update local ticket details in-place
      setTickets((prev) => prev.map((t) => (t._id === ticketId ? res.data : t)));
    } catch (err) {
      console.error('Error assigning ticket:', err);
      alert('Failed to assign ticket.');
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout Session?',
      text: 'Are you sure you want to end your current session?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0c5256',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout',
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        Swal.fire({
          title: 'Logged Out',
          text: 'You have been successfully logged out.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          navigate('/login');
        });
      }
    });
  };

  // Stat computations
  const totalCount = tickets.length;
  const unassignedCount = tickets.filter(t => !t.assignedTo).length;
  const myCount = tickets.filter(t => t.assignedTo && t.assignedTo._id === user._id).length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  const filteredTickets = tickets.filter((ticket) => {
    // Tab filters
    if (activeTab === 'unassigned' && ticket.assignedTo) return false;
    if (activeTab === 'my' && (!ticket.assignedTo || ticket.assignedTo._id !== user._id)) return false;

    // Search query match (against subject or client name)
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.createdBy?.name && ticket.createdBy.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter match
    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;

    // Priority filter match
    const matchesPriority = priorityFilter === 'All' || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-outline-variant/20 text-on-surface-variant';
      case 'In Progress':
        return 'bg-secondary-container/20 text-secondary border border-secondary-container/30';
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
        return 'bg-error/10 text-error';
      case 'Medium':
        return 'bg-secondary/10 text-secondary';
      case 'Low':
        return 'bg-primary-container/10 text-primary';
      default:
        return 'bg-surface-variant text-on-surface-variant';
    }
  };

  return (
    <div className="text-on-background font-body-md min-h-screen flex antialiased relative bg-warm-ivory">
      
      {/* Decorative Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-100px] left-[-100px] w-[600px] h-[600px] bg-primary rounded-full blur-[120px] opacity-[0.05] animate-pulse"></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-[500px] h-[500px] bg-secondary rounded-full blur-[120px] opacity-[0.05] animate-pulse"></div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Side Navigation Bar (Drawer on mobile, fixed sidebar on desktop) */}
      <aside 
        className={`w-[260px] h-screen fixed left-0 top-0 bg-primary text-on-primary border-r border-outline-variant/20 flex flex-col py-6 z-50 shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Portal Header */}
        <div className="px-6 mb-8 flex items-center justify-between">
          <div 
            onClick={() => {
              setMobileMenuOpen(false);
              navigate('/profile');
            }}
            className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-all"
            title="View Profile Settings"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg text-white overflow-hidden border border-white/20 shrink-0">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Agent Profile" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || 'A'
              )}
            </div>
            <div className="overflow-hidden">
              <h1 className="font-h2 text-sm font-bold text-white leading-none mb-1 truncate max-w-[130px]">{user?.name}</h1>
              <span className="text-white/70 text-[10px] font-semibold tracking-wider uppercase">Agent Portal</span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation queue tabs */}
        <nav className="flex-grow flex flex-col gap-1">
          <button
            onClick={() => {
              setActiveTab('unassigned');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 px-6 py-3 w-full text-left transition-all ${
              activeTab === 'unassigned' 
                ? 'bg-white/10 border-l-4 border-secondary text-white font-bold' 
                : 'text-white/70 hover:bg-white/5'
            } cursor-pointer`}
          >
            <Inbox size={18} />
            <span>Unassigned Pool</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab('my');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 px-6 py-3 w-full text-left transition-all ${
              activeTab === 'my' 
                ? 'bg-white/10 border-l-4 border-secondary text-white font-bold' 
                : 'text-white/70 hover:bg-white/5'
            } cursor-pointer`}
          >
            <UserCheck size={18} />
            <span>Assigned to Me</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab('all');
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 px-6 py-3 w-full text-left transition-all ${
              activeTab === 'all' 
                ? 'bg-white/10 border-l-4 border-secondary text-white font-bold' 
                : 'text-white/70 hover:bg-white/5'
            } cursor-pointer`}
          >
            <LayoutDashboard size={18} />
            <span>All Tickets Queue</span>
          </button>
        </nav>

        {/* Sidebar Footer Actions */}
        <div className="px-6 mt-auto flex flex-col gap-4">
          <div className="flex flex-col gap-1 border-t border-white/10 pt-4">
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-3 px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded transition-all text-sm cursor-pointer"
            >
              <LogOut size={16} />
              <span>Logout Session</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="lg:ml-[260px] flex-1 min-h-screen p-4 sm:p-6 lg:p-container-padding flex flex-col gap-5 sm:gap-stack-lg z-10 w-full overflow-x-hidden">
        
        {/* Mobile Top Navigation Bar */}
        <div className="lg:hidden flex items-center justify-between bg-surface-container-lowest p-3.5 rounded-2xl border border-outline-variant/30 shadow-sm">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-surface-container/60 hover:bg-surface-container text-primary transition-colors cursor-pointer flex items-center gap-2"
            aria-label="Open sidebar menu"
          >
            <Menu size={22} />
            <span className="font-bold text-xs uppercase tracking-wider text-primary">Menu</span>
          </button>

          <div className="flex items-center gap-2">
            <div 
              onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs cursor-pointer border border-primary/20 overflow-hidden"
              title="Profile"
            >
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Agent" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || 'A'
              )}
            </div>

            {/* Mobile Notification Bell */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 bg-surface-container/60 rounded-full text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center justify-center"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-secondary text-on-secondary text-[10px] font-bold min-w-[18px] h-4.5 rounded-full flex items-center justify-center px-1 animate-pulse shadow-sm">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Header toolbar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="font-h1 text-2xl sm:text-h1 text-on-background font-bold">Agent Dashboard</h2>
            <p className="font-body-md text-sm sm:text-base text-on-surface-variant mt-1">Overview of support request queues and live category states.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
              <input
                type="text"
                placeholder="Search by title/user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-full text-body-md outline-none focus:border-primary w-full shadow-ambient"
              />
            </div>

            {/* Desktop Notification Bell Dropdown */}
            <div className="hidden lg:block relative" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 bg-surface-container-lowest border border-outline-variant/60 rounded-full text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors shadow-ambient cursor-pointer flex items-center justify-center"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={19} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-secondary text-on-secondary text-[11px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1 animate-pulse shadow-sm">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Dropdown panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-surface-container-lowest rounded-2xl shadow-[0px_10px_30px_rgba(0,0,0,0.12)] border border-outline-variant/30 z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-warm-ivory border-b border-outline-variant/20 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-primary">Live Alerts</span>
                      {notifications.length > 0 && (
                        <span className="text-[10px] bg-secondary/15 text-secondary px-2 py-0.5 rounded-full font-bold">
                          {notifications.length} new
                        </span>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <button 
                        onClick={handleClearAllNotifications}
                        className="text-[11px] text-secondary hover:underline font-bold cursor-pointer"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/10">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.replyId}
                          onClick={() => handleNotificationClick(n.ticketId)}
                          className="px-4 py-3 hover:bg-warm-ivory/60 transition-colors cursor-pointer text-left group"
                        >
                          <div className="flex justify-between items-start mb-1 gap-2">
                            <span className="text-xs font-bold text-primary group-hover:text-secondary transition-colors truncate">
                              {n.ticketTitle || `Ticket #${n.ticketId?.slice(-6)}`}
                            </span>
                            <span className="text-[10px] text-on-surface-variant opacity-75 shrink-0">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-secondary mb-0.5">
                            {n.sentBy?.name || 'Customer'}:
                          </p>
                          <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-xs text-on-surface-variant opacity-70 font-medium">
                        No new notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Statistics Widgets Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-gutter">
          <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-stack-md shadow-ambient flex flex-col gap-1.5 sm:gap-2">
            <div className="flex justify-between items-center text-on-surface-variant text-sm font-semibold">
              <span>Total Tickets</span>
              <LayoutDashboard size={18} className="text-outline" />
            </div>
            <div className="font-h1 text-2xl sm:text-h1 font-bold text-on-background">{totalCount}</div>
            <span className="text-xs text-primary font-semibold flex items-center gap-1">
              <TrendingUp size={12} /> System aggregate
            </span>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-stack-md shadow-ambient flex flex-col gap-1.5 sm:gap-2">
            <div className="flex justify-between items-center text-on-surface-variant text-sm font-semibold">
              <span>Unassigned Pool</span>
              <Inbox size={18} className="text-error" />
            </div>
            <div className="font-h1 text-2xl sm:text-h1 font-bold text-on-background">{unassignedCount}</div>
            <span className="text-xs text-error font-semibold flex items-center gap-1">
              {unassignedCount > 0 ? '⚠️ Requires attention' : '✅ Clear'}
            </span>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-stack-md shadow-ambient flex flex-col gap-1.5 sm:gap-2">
            <div className="flex justify-between items-center text-on-surface-variant text-sm font-semibold">
              <span>Assigned to You</span>
              <UserCheck size={18} className="text-secondary" />
            </div>
            <div className="font-h1 text-2xl sm:text-h1 font-bold text-on-background">{myCount}</div>
            <span className="text-xs text-on-surface-variant font-medium">Active processing</span>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-4 sm:p-stack-md shadow-ambient flex flex-col gap-1.5 sm:gap-2">
            <div className="flex justify-between items-center text-on-surface-variant text-sm font-semibold">
              <span>Resolved Pool</span>
              <CheckCircle size={18} className="text-primary" />
            </div>
            <div className="font-h1 text-2xl sm:text-h1 font-bold text-on-background">{resolvedCount}</div>
            <span className="text-xs text-primary font-semibold flex items-center gap-1">
              <TrendingUp size={12} /> Closed requests
            </span>
          </div>
        </section>

        {/* Category Availability Toggle block */}
        <section className="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-ambient">
          <h3 className="font-section-header text-base sm:text-section-header font-bold text-on-surface mb-3 sm:mb-4">
            Category Agent Availability Controls
          </h3>
          {loadingCategories ? (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
              {Object.keys(categories).map((catName) => (
                <div 
                  key={catName} 
                  className="bg-warm-ivory border border-outline-variant/30 rounded-xl p-3 sm:p-4 flex flex-col justify-between items-center text-center shadow-xs"
                >
                  <span className="font-body-md text-xs sm:text-sm font-bold text-primary mb-2 sm:mb-3 truncate max-w-full">{catName}</span>
                  
                  {/* Custom Toggle switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={categories[catName]}
                      onChange={() => handleToggleCategory(catName)}
                      disabled={updatingCategory === catName}
                      className="sr-only peer"
                    />
                    <div className="w-10 sm:w-11 h-5.5 sm:h-6 bg-outline-variant/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 sm:after:h-5 after:w-4.5 sm:after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                  </label>
                  
                  <span className={`text-[9px] sm:text-[10px] font-extrabold mt-2 sm:mt-3 tracking-wide ${
                    categories[catName] ? 'text-primary' : 'text-on-surface-variant/70'
                  }`}>
                    {categories[catName] ? 'AVAILABLE' : 'OFFLINE'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Filters and Ticket List Queue */}
        <section className="bg-surface-container-lowest rounded-xl shadow-ambient flex-1 flex flex-col overflow-hidden w-full">
          
          {/* Header filter controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-outline-variant/20 p-3.5 sm:px-6 sm:py-4 gap-3 sm:gap-4">
            
            {/* Tab switches */}
            <div className="grid grid-cols-3 gap-1 bg-surface-container/60 p-1 rounded-xl sm:flex sm:bg-transparent sm:p-0 sm:gap-2 w-full sm:w-auto">
              <button 
                onClick={() => setActiveTab('unassigned')}
                className={`px-2.5 sm:px-4 py-2 font-bold text-xs sm:text-sm rounded-lg sm:rounded-full transition-all text-center ${
                  activeTab === 'unassigned' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant'
                } cursor-pointer`}
              >
                Unassigned ({unassignedCount})
              </button>
              <button 
                onClick={() => setActiveTab('my')}
                className={`px-2.5 sm:px-4 py-2 font-bold text-xs sm:text-sm rounded-lg sm:rounded-full transition-all text-center ${
                  activeTab === 'my' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant'
                } cursor-pointer`}
              >
                Assigned ({myCount})
              </button>
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-2.5 sm:px-4 py-2 font-bold text-xs sm:text-sm rounded-lg sm:rounded-full transition-all text-center ${
                  activeTab === 'all' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant'
                } cursor-pointer`}
              >
                All ({totalCount})
              </button>
            </div>

            {/* Filter selectors */}
            <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl sm:rounded-full px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary cursor-pointer text-center sm:text-left shadow-2xs"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl sm:rounded-full px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary cursor-pointer text-center sm:text-left shadow-2xs"
              >
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Ticket Listing Queue Container */}
          <div className="flex-1 w-full">
            {loadingTickets ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : filteredTickets.length > 0 ? (
              <>
                {/* 1. MOBILE VIEW: Professional Card List (Zero Horizontal Scroll!) */}
                <div className="md:hidden divide-y divide-outline-variant/15 w-full">
                  {filteredTickets.map((ticket) => (
                    <div 
                      key={ticket._id}
                      onClick={() => navigate(`/tickets/${ticket._id}`)}
                      className="p-3.5 hover:bg-warm-ivory/60 active:bg-surface-variant/30 transition-colors cursor-pointer flex flex-col gap-2"
                    >
                      {/* Top row: Ticket ID, Category & Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                            #{ticket._id.substring(ticket._id.length - 6).toUpperCase()}
                          </span>
                          <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-variant/60 px-2 py-0.5 rounded">
                            {ticket.category}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 rounded font-badge text-[10px] font-bold ${getPriorityBadgeStyles(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-badge text-[10px] font-bold border ${getStatusBadgeStyles(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </div>
                      </div>

                      {/* Middle row: Subject / Title */}
                      <h4 className="font-semibold text-sm text-on-background line-clamp-2 leading-snug">
                        {ticket.title}
                      </h4>

                      {/* Bottom row: Customer info + Action Button / Assigned Badge */}
                      <div className="flex items-center justify-between pt-1 gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-secondary/15 flex items-center justify-center text-[9px] font-bold text-secondary border border-outline-variant/10 shrink-0">
                            {ticket.createdBy?.name?.substring(0, 2).toUpperCase() || 'U'}
                          </div>
                          <span className="font-medium text-xs text-on-surface truncate">{ticket.createdBy?.name || 'User'}</span>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          {!ticket.assignedTo ? (
                            <button
                              onClick={(e) => handleAssignToMe(ticket._id, e)}
                              className="py-1 px-3 bg-primary text-white rounded-full text-xs font-bold hover:bg-primary/90 shadow-xs cursor-pointer"
                            >
                              Assign to me
                            </button>
                          ) : (
                            <span className="text-[10px] font-semibold text-on-surface-variant bg-surface-variant/50 px-2.5 py-0.5 rounded-full">
                              {ticket.assignedTo.name === user.name ? 'Assigned to Me' : `Assigned: ${ticket.assignedTo.name}`}
                            </span>
                          )}
                          <ChevronRight size={16} className="text-outline-variant" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. DESKTOP / TABLET VIEW: Sleek Multi-column Table */}
                <div className="hidden md:block w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-container-highest/50 font-badge text-badge text-on-surface-variant uppercase border-b border-outline-variant/10">
                      <tr>
                        <th className="py-3 px-6 font-semibold">Ticket #</th>
                        <th className="py-3 px-6 font-semibold">Subject</th>
                        <th className="py-3 px-6 font-semibold">Customer</th>
                        <th className="py-3 px-6 font-semibold">Category</th>
                        <th className="py-3 px-6 font-semibold">Priority</th>
                        <th className="py-3 px-6 font-semibold">Status</th>
                        <th className="py-3 px-6 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="font-body-md text-body-md divide-y divide-outline-variant/10">
                      {filteredTickets.map((ticket) => (
                        <tr 
                          key={ticket._id}
                          onClick={() => navigate(`/tickets/${ticket._id}`)}
                          className="hover:bg-warm-ivory/50 transition-colors cursor-pointer group"
                        >
                          <td className="py-4 px-6 text-on-surface-variant font-mono text-xs font-bold">
                            #{ticket._id.substring(ticket._id.length - 6).toUpperCase()}
                          </td>
                          <td className="py-4 px-6 font-semibold text-on-background truncate max-w-[200px]">
                            {ticket.title}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-secondary/15 flex items-center justify-center text-[10px] font-bold text-secondary border border-outline-variant/10 shrink-0">
                                {ticket.createdBy?.name?.substring(0, 2).toUpperCase() || 'U'}
                              </div>
                              <span className="font-medium text-sm text-on-surface truncate max-w-[140px]">{ticket.createdBy?.name || 'User'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-on-surface-variant text-sm font-semibold">{ticket.category}</td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-0.5 rounded font-badge text-[11px] font-bold ${getPriorityBadgeStyles(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-0.5 rounded-full font-badge text-[10px] font-bold tracking-wide border ${getStatusBadgeStyles(ticket.status)}`}>
                              {ticket.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {!ticket.assignedTo && (
                              <button
                                onClick={(e) => handleAssignToMe(ticket._id, e)}
                                className="py-1 px-3 bg-primary/10 text-primary rounded-full text-xs font-bold hover:bg-primary hover:text-on-primary transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                              >
                                Assign to me
                              </button>
                            )}
                            {ticket.assignedTo && (
                              <span className="text-xs text-on-surface-variant opacity-80 font-medium">
                                Assigned to {ticket.assignedTo.name === user.name ? 'Me' : ticket.assignedTo.name}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-on-surface-variant">
                <HelpCircle size={36} className="mb-2 opacity-50" />
                <p className="font-semibold text-sm">No tickets match the active filters.</p>
              </div>
            )}
          </div>
        </section>
      </main>

    </div>
  );
}
