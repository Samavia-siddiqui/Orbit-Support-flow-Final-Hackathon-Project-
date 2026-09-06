import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Header from '../components/Header';
import BackgroundBlobs from '../components/BackgroundBlobs';
import { useAuth } from '../context/AuthContext';
import { Camera, Mail, Lock, Loader2, ArrowLeft, CheckCircle2, User, Shield, AlertTriangle, KeyRound, UploadCloud, Info } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleAvatarClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPG, JPEG, or PNG).');
      return;
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size exceeds the 2MB limit. Please select a smaller photo.');
      return;
    }

    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      setUploading(true);
      setError('');
      setSuccess(false);

      const res = await api.put('/users/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Synchronize in-place with auth context
      const updatedUser = res.data.user || res.data;
      updateUser(updatedUser);
      setSuccess(true);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(err.response?.data?.message || 'Failed to update profile avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <BackgroundBlobs>
      <Header />
      <main className="w-full max-w-[800px] mx-auto px-4 md:px-container-padding py-8 flex flex-col items-center min-h-[calc(100vh-64px)] relative z-10">
        
        {/* Top Navigation Row */}
        <div className="w-full mb-6 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              if (window.history.length > 2) {
                navigate(-1);
              } else {
                navigate(user?.role === 'agent' ? '/agent/dashboard' : '/dashboard');
              }
            }}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer py-1.5 px-3 rounded-xl hover:bg-white/80 border border-transparent hover:border-outline-variant/30 text-sm font-semibold"
          >
            <ArrowLeft size={18} />
            <span>Go Back</span>
          </button>

          <span className="text-xs font-semibold text-on-surface-variant/70 uppercase tracking-widest bg-white/70 backdrop-blur-sm px-3.5 py-1 rounded-full border border-outline-variant/25 shadow-sm">
            Account Center
          </span>
        </div>

        {/* Master Profile Card */}
        <div className="w-full bg-white rounded-3xl shadow-ambient border border-outline-variant/20 overflow-hidden flex flex-col">
          
          {/* Decorative Cover Banner */}
          <div className="h-36 bg-gradient-to-r from-primary via-primary-container to-secondary/85 relative overflow-hidden flex items-end justify-end p-4">
            {/* Subtle decorative circles */}
            <div className="absolute top-[-40px] right-[-30px] w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="absolute bottom-[-50px] left-[20%] w-60 h-60 bg-secondary/20 rounded-full blur-2xl pointer-events-none"></div>
            
            <span className="relative z-10 text-white/85 text-xs font-medium bg-black/25 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
              SupportFlow Profile
            </span>
          </div>

          {/* Profile Identity & Avatar Area */}
          <div className="px-6 md:px-10 pb-8 pt-0 relative flex flex-col items-center text-center">
            
            {/* Overlapping Avatar */}
            <div className="relative -mt-16 mb-4 group cursor-pointer" onClick={handleAvatarClick} title="Click to upload a new profile image">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md bg-surface-container flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95">
                {user?.profileImageUrl ? (
                  <img 
                    className="w-full h-full object-cover" 
                    src={user.profileImageUrl} 
                    alt={user?.name || "Profile"} 
                  />
                ) : (
                  <div className="text-primary font-bold text-3xl uppercase">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                
                {/* Upload indicator overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  {uploading ? (
                    <Loader2 className="text-white animate-spin" size={28} />
                  ) : (
                    <Camera className="text-white" size={28} />
                  )}
                </div>
              </div>

              {/* Floating Camera Button Badge */}
              <button 
                type="button"
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-md border-2 border-white hover:bg-primary/90 transition-all cursor-pointer"
                aria-label="Upload photo"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              </button>
            </div>

            {/* Hidden File Picker */}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png"
              className="hidden"
              disabled={uploading}
            />

            {/* User Title & Subtitle */}
            <h1 className="font-h1 text-2xl md:text-3xl font-bold text-on-surface mb-1">
              {user?.name || 'User Profile'}
            </h1>
            <p className="font-body-md text-on-surface-variant text-sm mb-4">
              {user?.email || 'user@example.com'}
            </p>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
              <span className="bg-primary/10 text-primary font-bold text-xs px-3.5 py-1 rounded-full uppercase tracking-wider border border-primary/20">
                {user?.role === 'agent' ? 'Support Agent' : 'Customer'}
              </span>
              <span className="bg-emerald-50 text-emerald-700 font-semibold text-xs px-3 py-1 rounded-full border border-emerald-200/80 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Session
              </span>
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={uploading}
                className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container/60 hover:bg-surface-container transition-colors cursor-pointer border border-outline-variant/20"
              >
                <UploadCloud size={14} />
                <span>Change Photo</span>
              </button>
            </div>

            {/* Alerts */}
            {error && (
              <div className="w-full max-w-lg bg-error-container/25 border border-error/25 p-3.5 rounded-xl text-error flex items-center gap-2.5 text-xs mb-6 text-left shadow-sm">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="w-full max-w-lg bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-emerald-800 flex items-center gap-2.5 text-xs mb-6 text-left shadow-sm">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span>Profile avatar updated successfully! Changes are synced in real time.</span>
              </div>
            )}

            {/* Information Cards Bento Grid */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              
              {/* Card 1: Full Name */}
              <div className="bg-[#FAFDFC] p-5 rounded-2xl border border-outline-variant/30 flex flex-col gap-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                    <User size={15} className="text-primary" />
                    Full Name
                  </span>
                  <span className="text-[11px] text-outline font-medium">Display Name</span>
                </div>
                <div className="text-base font-bold text-on-surface mt-1">
                  {user?.name || 'Not available'}
                </div>
                <span className="text-[11px] text-on-surface-variant/70">Verified account identity</span>
              </div>

              {/* Card 2: Email Address */}
              <div className="bg-[#FAFDFC] p-5 rounded-2xl border border-outline-variant/30 flex flex-col gap-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                    <Mail size={15} className="text-primary" />
                    Email Address
                  </span>
                  <Lock size={12} className="text-outline-variant" />
                </div>
                <div className="text-base font-bold text-on-surface mt-1 truncate">
                  {user?.email || 'Not available'}
                </div>
                <span className="text-[11px] text-on-surface-variant/70">Primary login credential</span>
              </div>

              {/* Card 3: Role & Permissions */}
              <div className="bg-[#FAFDFC] p-5 rounded-2xl border border-outline-variant/30 flex flex-col gap-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                    <Shield size={15} className="text-secondary" />
                    Role & Permissions
                  </span>
                  <span className="text-[11px] font-mono font-bold text-secondary uppercase bg-secondary/10 px-2 py-0.5 rounded">
                    {user?.role || 'user'}
                  </span>
                </div>
                <div className="text-xs text-on-surface font-medium mt-1 leading-relaxed">
                  {user?.role === 'agent' 
                    ? 'Access to Unassigned pool, tickets triage, category toggles, and status workflow.' 
                    : 'Authorized to raise support tickets, chat in live threads, and track resolution.'}
                </div>
              </div>

              {/* Card 4: Security & Encryption */}
              <div className="bg-[#FAFDFC] p-5 rounded-2xl border border-outline-variant/30 flex flex-col gap-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                    <KeyRound size={15} className="text-primary" />
                    Security & Encryption
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Protected
                  </span>
                </div>
                <div className="text-xs text-on-surface font-medium mt-1 leading-relaxed">
                  Password protected via salted bcrypt hash. Real-time WebSockets authenticated via stateless 30-day JWT.
                </div>
              </div>

            </div>

            {/* Footer IAM Info */}
            <div className="w-full mt-6 pt-4 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant/70">
              <span className="flex items-center gap-1.5">
                <Info size={14} className="text-outline" />
                To change credentials, contact the system administrator.
              </span>
              <span className="font-mono text-[11px] bg-surface-container px-2.5 py-1 rounded-md text-on-surface-variant font-medium">
                Orbit IAM v2.0
              </span>
            </div>

          </div>

        </div>
      </main>
    </BackgroundBlobs>
  );
}
