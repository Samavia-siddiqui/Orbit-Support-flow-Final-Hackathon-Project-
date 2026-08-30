import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
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
  ToggleLeft
} from 'lucide-react';

export default function AgentDashboard() {
  const { user, logout } = useAuth();
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
  
  const [activeTab, setActiveTab] = useState('unassigned'); // 'unassigned' | 'my' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  useEffect(() => {
    fetchTickets();
    fetchCategories();
  }, []);

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

      {/* Side Navigation Bar */}
      <aside className="w-sidebar-width h-screen fixed left-0 top-0 bg-primary text-on-primary border-r border-outline-variant/20 flex flex-col py-6 z-20 shadow-md">
        
        {/* Portal Header */}
        <div className="px-6 mb-8 flex flex-col items-start gap-2">
          <div 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-all"
            title="View Profile Settings"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg text-white overflow-hidden border border-white/20">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Agent Profile" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || 'A'
              )}
            </div>
            <div>
              <h1 className="font-h2 text-sm font-bold text-white leading-none mb-1 truncate max-w-[140px]">{user?.name}</h1>
              <span className="text-white/70 text-[10px] font-semibold tracking-wider uppercase">Agent Portal</span>
            </div>
          </div>
        </div>

        {/* Navigation queue tabs */}
        <nav className="flex-grow flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('unassigned')}
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
            onClick={() => setActiveTab('my')}
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
            onClick={() => setActiveTab('all')}
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
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded transition-all text-sm cursor-pointer"
            >
              <LogOut size={16} />
              <span>Logout Session</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="ml-[260px] flex-1 min-h-screen p-container-padding flex flex-col gap-stack-lg z-10">
        
        {/* Header toolbar */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="font-h1 text-h1 text-on-background">Agent Dashboard</h2>
            <p className="font-body-md text-on-surface-variant mt-1">Overview of support request queues and live category states.</p>
          </div>
          
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
        </header>

        {/* Statistics Widgets Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          <div className="bg-surface-container-lowest rounded-xl p-stack-md shadow-ambient flex flex-col gap-2">
            <div className="flex justify-between items-center text-on-surface-variant text-sm font-semibold">
              <span>Total Tickets</span>
              <LayoutDashboard size={18} className="text-outline" />
            </div>
            <div className="font-h1 text-h1 text-on-background">{totalCount}</div>
            <span className="text-xs text-primary font-semibold flex items-center gap-1">
              <TrendingUp size={12} /> System aggregate
            </span>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-stack-md shadow-ambient flex flex-col gap-2">
            <div className="flex justify-between items-center text-on-surface-variant text-sm font-semibold">
              <span>Unassigned Pool</span>
              <Inbox size={18} className="text-error" />
            </div>
            <div className="font-h1 text-h1 text-on-background">{unassignedCount}</div>
            <span className="text-xs text-error font-semibold flex items-center gap-1">
              {unassignedCount > 0 ? '⚠️ Requires attention' : '✅ Clear'}
            </span>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-stack-md shadow-ambient flex flex-col gap-2">
            <div className="flex justify-between items-center text-on-surface-variant text-sm font-semibold">
              <span>Assigned to You</span>
              <UserCheck size={18} className="text-secondary" />
            </div>
            <div className="font-h1 text-h1 text-on-background">{myCount}</div>
            <span className="text-xs text-on-surface-variant">Active processing</span>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-stack-md shadow-ambient flex flex-col gap-2">
            <div className="flex justify-between items-center text-on-surface-variant text-sm font-semibold">
              <span>Resolved Pool</span>
              <CheckCircle size={18} className="text-primary" />
            </div>
            <div className="font-h1 text-h1 text-on-background">{resolvedCount}</div>
            <span className="text-xs text-primary font-semibold flex items-center gap-1">
              <TrendingUp size={12} /> Closed requests
            </span>
          </div>
        </section>

        {/* Category Availability Toggle block */}
        <section className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient">
          <h3 className="font-section-header text-section-header text-on-surface mb-4">
            Category Agent Availability Controls
          </h3>
          {loadingCategories ? (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {Object.keys(categories).map((catName) => (
                <div 
                  key={catName} 
                  className="bg-warm-ivory border border-outline-variant/30 rounded-xl p-4 flex flex-col justify-between items-center text-center shadow-sm"
                >
                  <span className="font-body-md font-bold text-primary mb-3">{catName}</span>
                  
                  {/* Custom Toggle switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={categories[catName]}
                      onChange={() => handleToggleCategory(catName)}
                      disabled={updatingCategory === catName}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-outline-variant/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
                  </label>
                  
                  <span className={`text-[10px] font-extrabold mt-3 tracking-wide ${
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
        <section className="bg-surface-container-lowest rounded-xl shadow-ambient flex-1 flex flex-col overflow-hidden">
          
          {/* Header filter controls */}
          <div className="flex flex-wrap items-center justify-between border-b border-outline-variant/20 px-6 py-4 gap-4">
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('unassigned')}
                className={`px-4 py-2 font-bold text-sm rounded-full transition-all ${
                  activeTab === 'unassigned' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant'
                } cursor-pointer`}
              >
                Unassigned Pool ({unassignedCount})
              </button>
              <button 
                onClick={() => setActiveTab('my')}
                className={`px-4 py-2 font-bold text-sm rounded-full transition-all ${
                  activeTab === 'my' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant'
                } cursor-pointer`}
              >
                Assigned to Me ({myCount})
              </button>
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 font-bold text-sm rounded-full transition-all ${
                  activeTab === 'all' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant'
                } cursor-pointer`}
              >
                All Tickets ({totalCount})
              </button>
            </div>

            {/* Filter selectors */}
            <div className="flex items-center gap-2">
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-surface-container-lowest border border-outline-variant rounded-full px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-surface-container-lowest border border-outline-variant rounded-full px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary cursor-pointer"
                >
                  <option value="All">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ticket Listing Queue Table */}
          <div className="flex-1 overflow-auto">
            {loadingTickets ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : filteredTickets.length > 0 ? (
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
                          <div className="w-6 h-6 rounded-full bg-secondary/15 flex items-center justify-center text-[10px] font-bold text-secondary border border-outline-variant/10">
                            {ticket.createdBy?.name?.substring(0, 2).toUpperCase() || 'U'}
                          </div>
                          <span className="font-medium text-sm text-on-surface">{ticket.createdBy?.name || 'User'}</span>
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
