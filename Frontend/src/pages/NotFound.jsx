import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackgroundBlobs from '../components/BackgroundBlobs';
import { useAuth } from '../context/AuthContext';
import { HelpCircle, Home } from 'lucide-react';

export default function NotFound() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'agent') {
      navigate('/agent/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <BackgroundBlobs>
      <main className="flex-grow w-full max-w-[1200px] mx-auto px-container-padding py-stack-lg flex flex-col items-center justify-center min-h-screen relative z-10 text-center">
        
        {/* Error message card */}
        <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-ambient p-8 flex flex-col items-center border border-outline-variant/10">
          
          <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mb-6 text-secondary">
            <HelpCircle size={44} />
          </div>

          <h1 className="font-h1 text-[72px] text-primary font-black leading-none mb-2">404</h1>
          <h2 className="font-section-header text-section-header text-on-surface mb-3">Oops! Page Not Found</h2>
          <p className="font-body-md text-on-surface-variant mb-8 max-w-sm">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>

          <button
            onClick={handleGoHome}
            className="bg-primary hover:bg-primary/90 text-on-primary font-body-md font-medium px-6 py-3 rounded-full transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Home size={16} />
            <span>Go Back Home</span>
          </button>
        </div>
      </main>
    </BackgroundBlobs>
  );
}
