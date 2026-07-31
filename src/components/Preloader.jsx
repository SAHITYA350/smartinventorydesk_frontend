import React from 'react';
import { Store } from 'lucide-react';

const Preloader = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#fffbeb',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backgroundImage: 'linear-gradient(to right, rgba(15, 23, 42, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.05) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <style>{`
        @keyframes bouncePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes rotateBorder {
          to { transform: rotate(360deg); }
        }
        .preloader-badge {
          animation: bouncePulse 1.8s infinite ease-in-out;
          background: #fbbf24;
          padding: 24px;
          border-radius: 24px;
          border: 4px solid #0f172a;
          box-shadow: 6px 6px 0px #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }
        .preloader-spinner {
          width: 32px;
          height: 32px;
          border: 4px solid #cbd5e1;
          border-top-color: #0f172a;
          border-radius: 50%;
          animation: rotateBorder 1s linear infinite;
          margin-top: 16px;
        }
      `}</style>
      <div className="preloader-badge">
        <Store size={54} color="#0f172a" />
      </div>
      <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
        SmartStore<span style={{ color: '#fbbf24' }}>.POS</span>
      </h2>
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.9rem', fontWeight: 700, color: '#64748b', marginTop: 4 }}>
        Securing Inventory & Checkout...
      </span>
      <div className="preloader-spinner" />
    </div>
  );
};

export default Preloader;
