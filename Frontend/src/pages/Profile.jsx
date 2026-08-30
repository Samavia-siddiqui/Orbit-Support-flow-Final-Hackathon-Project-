import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Header from '../components/Header';
import BackgroundBlobs from '../components/BackgroundBlobs';
import { useAuth } from '../context/AuthContext';
import { Camera, Mail, Lock, Loader2, ArrowLeft, CheckCircle2, User, Shield, AlertTriangle } from 'lucide-react';

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

    // Check size limit (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size exceeds the 2MB limit.');
      setSuccess(false);
      return;
    }

    // Check MIME type constraints
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPG, JPEG, and PNG images are allowed.');
      setSuccess(false);
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
      updateUser(res.data.user);
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
      <main className="w-full max-w-[1200px] mx-auto px-container-padding py-stack-lg flex flex-col items-center justify-center min-h-[calc(100vh-64px)] relative z-10">
        
        {/* Back Link */}
        <div className="w-full max-w-[480px] mb-4 flex items-center gap-2 text-on-surface-variant shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors group cursor-pointer"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <span className="text-body-md font-body-md font-medium">Go Back</span>
        </div>

        {/* Profile Details Card */}
        <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-ambient p-8 flex flex-col items-center border border-outline-variant/10">
          
          {/* Avatar upload zone */}
          <div 
            onClick={handleAvatarClick}
            className="relative mb-6 group cursor-pointer w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-ambient bg-surface-container flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            title="Click to upload a new profile image"
          >
            {user?.profileImageUrl ? (
              <img 
                className="w-full h-full object-cover" 
                src={user.profileImageUrl} 
                alt="Profile Avatar" 
              />
            ) : (
              <div className="text-primary font-bold text-2xl uppercase">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            
            {/* Upload indicator overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <Loader2 className="text-white animate-spin" size={24} />
              ) : (
                <Camera className="text-white" size={24} />
              )}
            </div>
          </div>

          {/* Hidden File Picker Input */}
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png"
            className="hidden"
            disabled={uploading}
          />

          {/* User Account Role badge */}
          <div className="bg-primary/10 text-primary font-badge text-badge px-3 py-1 rounded-full mb-6 tracking-wider font-bold uppercase">
            {user?.role || 'Customer'}
          </div>

          {/* Status logs */}
          {error && (
            <div className="w-full bg-error-container/20 border border-error/25 p-3 rounded-lg text-error flex items-center gap-2 text-xs mb-4">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="w-full bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-800 flex items-center gap-2 text-xs mb-4">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>Profile avatar updated successfully!</span>
            </div>
          )}

          {/* Details Form */}
          <form className="w-full space-y-4 flex flex-col" onSubmit={(e) => e.preventDefault()}>
            
            {/* Display Name */}
            <div className="flex flex-col gap-2">
              <label className="font-body-md font-semibold text-on-surface text-sm flex items-center gap-2">
                <User size={16} className="text-on-surface-variant" />
                <span>Full Name</span>
              </label>
              <input 
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/30 bg-surface-container-lowest/50 text-on-surface-variant/70 font-body-md cursor-not-allowed outline-none"
                value={user?.name || ''} 
                readOnly
              />
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-2">
              <label className="font-body-md font-semibold text-on-surface text-sm flex items-center gap-2">
                <Mail size={16} className="text-on-surface-variant" />
                <span>Email Address</span>
              </label>
              <div className="relative">
                <input 
                  className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/30 bg-surface-container-lowest/50 text-on-surface-variant/70 font-body-md cursor-not-allowed pr-10 outline-none"
                  value={user?.email || ''} 
                  readOnly
                />
                <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant" />
              </div>
            </div>

            {/* Role Profile */}
            <div className="flex flex-col gap-2">
              <label className="font-body-md font-semibold text-on-surface text-sm flex items-center gap-2">
                <Shield size={16} className="text-on-surface-variant" />
                <span>Account Role</span>
              </label>
              <div className="relative">
                <input 
                  className="w-full px-4 py-2.5 rounded-lg border border-outline-variant/30 bg-surface-container-lowest/50 text-on-surface-variant/70 font-body-md cursor-not-allowed pr-10 outline-none"
                  value={user?.role?.toUpperCase() || ''} 
                  readOnly
                />
                <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant" />
              </div>
            </div>

            <p className="text-xs text-on-surface-variant/70 text-center mt-4">
              To request credentials modifications, contact the portal administrator.
            </p>
          </form>
        </div>
      </main>
    </BackgroundBlobs>
  );
}
