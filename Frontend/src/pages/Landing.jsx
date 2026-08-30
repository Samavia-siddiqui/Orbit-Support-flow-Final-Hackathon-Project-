import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bolt, RefreshCw, ArrowUpDown, History, ArrowRight, Check } from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is already authenticated, redirect them to their respective dashboard
  React.useEffect(() => {
    if (user) {
      navigate(user.role === 'agent' ? '/agent/dashboard' : '/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="font-body-lg text-body-lg text-on-surface antialiased relative min-h-screen bg-warm-ivory flex flex-col justify-between">
      
      {/* Decorative Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-100px] left-[-200px] w-[600px] h-[600px] bg-primary rounded-full blur-[120px] opacity-[0.05] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[-100px] w-[500px] h-[500px] bg-secondary rounded-full blur-[120px] opacity-[0.05] animate-pulse"></div>
      </div>

      {/* Top Navbar */}
      <nav aria-label="Main navigation" className="bg-white/75 backdrop-blur-md text-primary sticky top-0 z-50 shadow-[0px_4px_12px_rgba(30,42,43,0.05)] border-b border-outline-variant/10">
        <div className="flex justify-between items-center px-6 md:px-container-padding py-4 max-w-[1200px] mx-auto w-full">
          {/* Brand Logo */}
          <div 
            onClick={() => navigate('/')}
            className="font-h2 text-h2 font-black tracking-wider text-primary cursor-pointer"
          >
            ORBIT
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/login')}
              className="text-on-surface-variant font-semibold hover:text-primary transition-colors cursor-pointer"
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="bg-secondary text-white px-6 py-2 rounded-full font-body-md text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
            >
              Sign up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-20 pb-24 px-6 md:px-container-padding max-w-[1200px] mx-auto w-full flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Hero Left Content */}
          <div className="w-full lg:w-1/2 flex flex-col items-start gap-6 z-10">
            <h1 className="font-h1 text-[44px] sm:text-[56px] text-on-surface leading-tight font-black">
              Support tickets, <span className="text-secondary italic font-black">sorted</span>.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
              Empower your team with a high-velocity, low-friction dashboard designed to resolve issues faster and keep customers happier, without the cognitive overload.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => navigate('/register')}
                className="bg-primary text-white px-8 py-3.5 rounded-full font-body-lg text-base font-bold hover:bg-primary/95 transition-colors cursor-pointer shadow-sm hover:shadow-md"
              >
                Get Started
              </button>
              <button
                onClick={() => navigate('/login')}
                className="bg-transparent border border-outline-variant text-on-surface px-8 py-3.5 rounded-full font-body-lg text-base font-semibold hover:bg-surface-variant/30 transition-colors cursor-pointer"
              >
                Log in
              </button>
            </div>
          </div>

          {/* Hero Right Product Mockup */}
          <div className="w-full lg:w-1/2 relative z-10">
            <div className="rounded-2xl shadow-ambient overflow-hidden border border-outline-variant/20 bg-white p-2">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTLKPGjj9C9zpOBxSteNJi45vw-h1E1n-GSx7j-2imSOd-DytElKuoQeDhVOe10B9QwfwWoHM4nXZYtCEh1jp7fHR5JP03fc7ONc7rgZEAAqw1cysspkVd3cY39jSADp90g-OGOP3ekmLWoyfnfPuWAt1-DCohB1irLAvH3KzpQsIgWxQi_UIaHAVns-1V_E6Jgjth5h5Nqpih-W0MiYYqaYutIBfejgqtTrSFlJl4TSSGNjN5ksYNZQ" 
                alt="ORBIT Customer Support Dashboard Interface" 
                className="w-full h-auto block rounded-xl"
              />
            </div>
            {/* Decortive Floating Element */}
            <div className="absolute -bottom-4 -left-4 bg-white shadow-ambient rounded-xl p-4 flex items-center gap-3 z-20 border border-outline-variant/10 animate-bounce">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Check size={16} />
              </div>
              <span className="font-body-md text-sm font-bold text-on-surface">Issue Resolved</span>
            </div>
          </div>

        </section>

        {/* Features Bento Section */}
        <section className="py-20 px-6 md:px-container-padding max-w-[1200px] mx-auto w-full">
          <div className="text-center mb-16">
            <h2 className="font-section-header text-3xl text-on-surface mb-4 font-black">
              Built for Velocity & Clarity
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              Everything you need to manage support flows without the clunky interfaces of legacy systems.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient hover:-translate-y-1 transition-all duration-300 border border-outline-variant/10">
              <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary mb-6">
                <Bolt size={20} />
              </div>
              <h3 className="font-body-lg text-lg font-bold text-on-surface mb-2">Submit in seconds</h3>
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                Frictionless entry forms ensure customers can report issues without navigating complex menus.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient hover:-translate-y-1 transition-all duration-300 border border-outline-variant/10">
              <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary mb-6">
                <RefreshCw size={20} />
              </div>
              <h3 className="font-body-lg text-lg font-bold text-on-surface mb-2">Real-time updates</h3>
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                Live socket connections mean agents see ticket changes the millisecond they happen.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient hover:-translate-y-1 transition-all duration-300 border border-outline-variant/10">
              <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary mb-6">
                <ArrowUpDown size={20} />
              </div>
              <h3 className="font-body-lg text-lg font-bold text-on-surface mb-2">Organized by priority</h3>
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                Smart queues automatically surface critical issues based on SLA and customer sentiment.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient hover:-translate-y-1 transition-all duration-300 border border-outline-variant/10">
              <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary mb-6">
                <History size={20} />
              </div>
              <h3 className="font-body-lg text-lg font-bold text-on-surface mb-2">Full conversation history</h3>
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                Never lose context. Complete interaction timelines are attached to every customer profile.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Band Section */}
        <section className="bg-primary text-white w-full py-20 px-6 md:px-container-padding text-center">
          <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
            <h2 className="font-h2 text-3xl md:text-4xl text-white font-bold leading-tight">
              Ready to streamline your support desk?
            </h2>
            <button
              onClick={() => navigate('/register')}
              className="bg-secondary text-white px-8 py-4 rounded-full font-body-lg text-base font-bold hover:opacity-95 active:scale-95 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <span>Create your account</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="bg-white border-t border-outline-variant/10 py-8 px-6 md:px-container-padding">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-[1200px] mx-auto w-full gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <span className="font-h2 text-xl font-black text-primary">
              ORBIT
            </span>
            <span className="font-body-md text-xs text-on-surface-variant">
              &copy; 2026 SupportFlow. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/login')}
              className="text-xs text-on-surface-variant hover:text-primary underline cursor-pointer"
            >
              Login
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="text-xs text-on-surface-variant hover:text-primary underline cursor-pointer"
            >
              Signup
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
