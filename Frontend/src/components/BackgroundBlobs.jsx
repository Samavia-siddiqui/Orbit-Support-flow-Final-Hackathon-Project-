import React from 'react';

export default function BackgroundBlobs({ children }) {
  return (
    <div className="relative min-h-screen bg-[#F7F5F1] w-full flex flex-col justify-between overflow-x-hidden antialiased">
      {/* Ultra-soft, Subtle Atmospheric Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Top-left Soft Teal Ambient Glow */}
        <div 
          className="absolute -top-36 -left-36 w-[600px] h-[600px] bg-primary rounded-full blur-[160px] opacity-[0.035] animate-pulse"
          style={{ animationDuration: '12s' }}
        ></div>
        
        {/* Bottom-right Soft Terracotta Ambient Glow */}
        <div 
          className="absolute -bottom-28 -right-28 w-[520px] h-[520px] bg-secondary rounded-full blur-[160px] opacity-[0.03] animate-pulse"
          style={{ animationDuration: '14s' }}
        ></div>
      </div>

      {/* Foreground content panel */}
      <div className="relative z-10 w-full min-h-screen flex flex-col flex-grow">
        {children}
      </div>
    </div>
  );
}
