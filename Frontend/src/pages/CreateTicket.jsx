import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Header from '../components/Header';
import BackgroundBlobs from '../components/BackgroundBlobs';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function CreateTicket() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState(null); // 'available' | 'unavailable' | null
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState('');
  const navigate = useNavigate();

  const handleCategoryChange = async (e) => {
    const value = e.target.value;
    setCategory(value);

    if (!value) {
      setAvailabilityStatus(null);
      return;
    }

    try {
      setCheckingAvailability(true);
      const res = await api.get('/category-availability');
      
      // Capitalize first letter to match DB schema (Billing, Technical, Account, General, Other)
      const dbKey = value.charAt(0).toUpperCase() + value.slice(1);
      const isAvailable = res.data[dbKey];
      
      if (isAvailable !== undefined) {
        setAvailabilityStatus(isAvailable ? 'available' : 'unavailable');
      } else {
        setAvailabilityStatus(null);
      }
    } catch (err) {
      console.error('Error fetching availability status:', err);
      setAvailabilityStatus(null);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !category) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      // Map category to capitalized format to match backend schema expectations
      const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
      
      const response = await api.post('/tickets', {
        title: title.trim(),
        description: description.trim(),
        priority,
        category: formattedCategory
      });

      setCreatedId(response.data._id);
      setSuccess(true);
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError(err.response?.data?.message || 'Failed to submit support ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BackgroundBlobs>
      <Header />
      <main className="flex-grow w-full max-w-[1200px] mx-auto px-container-padding py-stack-lg z-10 relative">
        {/* Header */}
        <div className="mb-stack-lg max-w-2xl mx-auto text-center">
          <h1 className="font-h1 text-h1 text-on-surface mb-stack-sm">How can we help?</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Please provide details about your issue, and our team will get back to you shortly.
          </p>
        </div>

        {/* Form Card Container */}
        <div className="max-w-2xl mx-auto relative">
          <div className="bg-surface-container-lowest rounded-xl shadow-ambient p-6 md:p-8 relative overflow-hidden">
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                {error && (
                  <div className="bg-error-container/20 border border-error/25 p-3 rounded-lg text-error flex items-center gap-2 text-sm">
                    <AlertTriangle size={18} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Subject / Title */}
                <div>
                  <label className="block font-body-md font-medium text-on-surface mb-2" htmlFor="title">
                    Subject <span className="text-error">*</span>
                  </label>
                  <input
                    id="title"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder-outline"
                    placeholder="Brief summary of your request"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Category Selection with Agent Availability Check */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block font-body-md font-medium text-on-surface" htmlFor="category">
                      Category <span className="text-error">*</span>
                    </label>
                    
                    {/* Live Availability status indicator */}
                    {checkingAvailability ? (
                      <span className="flex items-center gap-1 text-[12px] text-on-surface-variant">
                        <Loader2 size={12} className="animate-spin" /> Checking agent status...
                      </span>
                    ) : availabilityStatus === 'available' ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 rounded-full font-bold tracking-wide">
                        Agent Available
                      </span>
                    ) : availabilityStatus === 'unavailable' ? (
                      <span className="bg-amber-100 text-amber-800 text-[11px] px-2 py-0.5 rounded-full font-bold tracking-wide">
                        No Agent Available Right Now
                      </span>
                    ) : null}
                  </div>
                  
                  <div className="relative">
                    <select
                      id="category"
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                      value={category}
                      onChange={handleCategoryChange}
                      required
                    >
                      <option value="" disabled>Select a category</option>
                      <option value="billing">Billing & Subscriptions</option>
                      <option value="technical">Technical Support</option>
                      <option value="account">Account Management</option>
                      <option value="general">General Inquiry</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block font-body-md font-medium text-on-surface mb-2" htmlFor="priority">
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      id="priority"
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-body-md font-medium text-on-surface mb-2" htmlFor="description">
                    Description <span className="text-error">*</span>
                  </label>
                  <textarea
                    id="description"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors placeholder-outline resize-y"
                    placeholder="Please provide as much detail as possible..."
                    rows={5}
                    maxLength={1000}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <p className="font-body-md text-[13px] text-on-surface-variant mt-1 text-right">
                    {description.length} / 1000 characters
                  </p>
                </div>

                {/* Form Actions */}
                <div className="pt-2 flex justify-end gap-4 items-center">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="font-body-md font-medium text-on-surface-variant hover:text-on-surface transition-colors px-4 py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary hover:bg-primary/90 text-on-primary font-body-md font-medium px-6 py-2.5 rounded-full transition-all flex items-center gap-2 justify-center min-w-[120px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Ticket</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Success State Overlay */
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600">
                  <CheckCircle size={36} />
                </div>
                <h2 className="font-section-header text-section-header text-on-surface mb-2">Request Submitted</h2>
                <p className="font-body-md text-on-surface-variant text-center mb-6 max-w-sm">
                  We've received your ticket and our support team is on it. You can track this request on your dashboard.
                </p>
                <div className="bg-surface-variant/30 rounded-lg p-4 w-full max-w-xs flex flex-col items-center border border-outline-variant/20 mb-8">
                  <span className="font-body-md text-on-surface-variant text-sm mb-1">Ticket Reference</span>
                  <span className="font-badge text-badge bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-bold tracking-wider">
                    #REQ-{createdId.substring(createdId.length - 6).toUpperCase()}
                  </span>
                </div>
                <button
                  className="bg-secondary text-on-secondary hover:bg-secondary/90 px-6 py-2.5 rounded-full transition-all font-body-md font-medium cursor-pointer"
                  onClick={() => navigate('/dashboard')}
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </BackgroundBlobs>
  );
}
