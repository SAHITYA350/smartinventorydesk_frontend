import React from 'react';

export const HeroIllustration = () => {
  return (
    <div style={{ width: '100%', maxWidth: '320px', margin: '0 auto' }}>
      <svg
        viewBox="0 0 320 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: 'auto',
          maxHeight: '220px',
          background: '#FFFBEB',
          border: '3px solid #0F172A',
          borderRadius: '16px',
          boxShadow: '5px 5px 0px #0F172A',
          overflow: 'hidden',
        }}
      >
        {/* Animated Background Pulse */}
        <rect width="320" height="240" fill="#FFFBEB" />
        
        {/* Decorative Grid Lines */}
        <line x1="0" y1="60" x2="320" y2="60" stroke="#0F172A" strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />
        <line x1="0" y1="120" x2="320" y2="120" stroke="#0F172A" strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />
        <line x1="0" y1="180" x2="320" y2="180" stroke="#0F172A" strokeWidth="1" strokeDasharray="4 4" opacity="0.15" />

        {/* Bench */}
        <line x1="30" y1="180" x2="290" y2="180" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
        <line x1="50" y1="180" x2="50" y2="215" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
        <line x1="270" y1="180" x2="270" y2="215" stroke="#0F172A" strokeWidth="6" strokeLinecap="round" />
        <line x1="40" y1="192" x2="280" y2="192" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />

        {/* Character sitting on bench */}
        <circle cx="160" cy="85" r="28" fill="#FBBF24" stroke="#0F172A" strokeWidth="4" />
        {/* Hair / Cap */}
        <path d="M140 75 C145 60, 175 60, 180 75 Z" fill="#0F172A" />
        {/* Torso */}
        <path d="M125 180 C125 125, 195 125, 195 180 Z" fill="#0F172A" />
        
        {/* Laptop Desk */}
        <rect x="135" y="130" width="55" height="32" rx="5" fill="#38BDF8" stroke="#0F172A" strokeWidth="3" />
        <line x1="125" y1="162" x2="200" y2="162" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />

        {/* Floating Animated Code Bubbles */}
        <circle cx="90" cy="70" r="10" fill="#4ADE80" stroke="#0F172A" strokeWidth="3" />
        <circle cx="230" cy="75" r="14" fill="#F472B6" stroke="#0F172A" strokeWidth="3" />
        <rect x="220" y="115" width="20" height="20" rx="4" fill="#A855F7" stroke="#0F172A" strokeWidth="3" />

        {/* Code Lines inside Laptop */}
        <line x1="145" y1="140" x2="175" y2="140" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        <line x1="145" y1="148" x2="165" y2="148" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
};

export default HeroIllustration;
