import React from 'react';

const BackgroundPattern: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-black">
      {/* Gradient overlay - REMOVED */}
      {/* <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black to-black" /> */}
      
      {/* Grid pattern - Updated color and opacity */}
      <div 
        className="absolute inset-0 opacity-30" // Increased opacity slightly
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(107, 114, 128, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(107, 114, 128, 0.3) 1px, transparent 1px)
          `, // Using gray-500 at 30% opacity
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Radial gradient for spotlight effect - REMOVED */}
      {/* <div className="absolute inset-0 bg-radial-gradient from-red-500/10 via-transparent to-transparent" /> */}
      
      {/* Animated glow effects - REMOVED */}
      {/* <div className="absolute -top-1/2 -left-1/2 w-full h-full animate-slow-spin">
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-red-500/30 rounded-full blur-3xl" />
      </div>
      <div className="absolute -bottom-1/2 -right-1/2 w-full h-full animate-slow-spin-reverse">
        <div className="absolute bottom-1/2 right-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      </div> */}
    </div>
  );
};

export default BackgroundPattern; 