import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Plus, Bell } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Header() {
  const { user, logout, notifications, clearNotification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleNotificationClick = (ticketId) => {
    clearNotification(ticketId);
    setShowNotifications(false);
    navigate(`/tickets/${ticketId}`);
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    // Clear notifications for all tickets in the list
    const uniqueTicketIds = [...new Set(notifications.map(n => n.ticketId))];
    uniqueTicketIds.forEach(id => clearNotification(id));
  };

  return (
    <nav className="bg-surface-container-lowest text-primary font-body-lg text-body-lg w-full top-0 sticky shadow-[0px_4px_12px_rgba(30,42,43,0.05)] z-40 relative">
      <div className="flex justify-between items-center h-16 px-container-padding max-w-[1200px] mx-auto w-full">
        {/* Brand Logo & Name */}
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => navigate(user?.role === 'agent' ? '/agent/dashboard' : '/dashboard')}
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold">
            O
          </div>
          <span className="font-h2 text-h2 font-bold text-primary">Orbit</span>
        </div>

        {/* Navigation Links */}
        {user && (
          <div className="hidden md:flex items-center gap-8 h-full">
            {user.role === 'user' ? (
              <div className="bg-surface-container/70 p-1 rounded-full border border-outline-variant/30 flex items-center gap-1 shadow-inner">
                <Link
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    location.pathname === '/dashboard'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-primary hover:bg-white/70'
                  }`}
                  to="/dashboard"
                >
                  My Tickets
                </Link>
                <Link
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    location.pathname === '/create-ticket'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-primary hover:bg-white/70'
                  }`}
                  to="/create-ticket"
                >
                  New Ticket
                </Link>
              </div>
            ) : (
              <div className="bg-surface-container/70 p-1 rounded-full border border-outline-variant/30 flex items-center shadow-inner">
                <Link
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                    location.pathname === '/agent/dashboard'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-primary hover:bg-white/70'
                  }`}
                  to="/agent/dashboard"
                >
                  Agent Dashboard
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Trailing User profile & Action buttons */}
        <div className="flex items-center gap-4">
          {user && (
            <>
              {/* Notification Bell Icon & Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-on-surface-variant hover:text-primary hover:bg-surface-variant/50 rounded-full transition-colors cursor-pointer flex items-center justify-center"
                >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 bg-secondary text-on-secondary text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Panel */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-outline-variant/20 z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-surface-bright border-b border-outline-variant/10 flex justify-between items-center">
                      <span className="font-bold text-sm text-primary">Notifications</span>
                      {notifications.length > 0 && (
                        <button 
                          onClick={handleClearAll}
                          className="text-[10px] text-secondary hover:underline font-bold cursor-pointer"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto divide-y divide-outline-variant/10">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.replyId}
                            onClick={() => handleNotificationClick(n.ticketId)}
                            className="px-4 py-3 hover:bg-warm-ivory/50 transition-colors cursor-pointer text-left"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[11px] font-bold text-secondary truncate max-w-[150px]">
                                {n.ticketTitle}
                              </span>
                              <span className="text-[9px] text-on-surface-variant opacity-75">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-primary mb-0.5">
                              {n.sentBy?.name || 'Support'}:
                            </p>
                            <p className="text-xs text-on-surface-variant line-clamp-2">
                              {n.message}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-xs text-on-surface-variant opacity-70 font-medium">
                          No new notifications
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate('/profile')}
                title="View Profile Settings"
              >
                <span className="font-body-md text-on-surface-variant hidden sm:inline">
                  Hi, {user.name} ({user.role})
                </span>
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover border border-outline-variant"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-outline-variant">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              
              <button
                onClick={handleLogout}
                className="text-on-surface-variant hover:text-error transition-colors p-2 rounded-full hover:bg-surface-variant/50 cursor-pointer"
                title="Logout"
              >
                <LogOut size={20} />
              </button>

              {user.role === 'user' && location.pathname !== '/create-ticket' && (
                <button
                  onClick={() => navigate('/create-ticket')}
                  className="bg-secondary text-on-secondary px-4 py-2 rounded-full font-body-lg flex items-center gap-2 hover:bg-secondary/90 transition-colors shadow-sm cursor-pointer"
                >
                  <Plus size={18} />
                  <span>Create Request</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
