import React from 'react';

export default function BackgroundBlobs({ children }) {
  return (
    <div className="bg-blobs-container w-full relative min-h-screen">
      {/* Background drifting blur shapes */}
      <div className="blob blob-teal" />
      <div className="blob blob-terracotta" />
      <div className="blob blob-cream" />

      {/* Foreground content panel */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}
