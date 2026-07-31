import React from 'react';
import { MapPin, Navigation, Radio, ExternalLink } from 'lucide-react';

const OrderLiveMap = ({ location, customerName = 'Customer', orderNumber = '', height = 260 }) => {
  const latitude = location?.latitude || 20.2961;
  const longitude = location?.longitude || 85.8245;
  const address = location?.address || 'Live GPS Position Shared';
  const updatedAt = location?.updatedAt ? new Date(location.updatedAt).toLocaleTimeString() : 'Just now';

  // Use OpenStreetMap embed iframe - zero React-Leaflet dependency, works everywhere
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01}%2C${latitude - 0.01}%2C${longitude + 0.01}%2C${latitude + 0.01}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <div
      style={{
        border: '2.5px solid #0f172a',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '4px 4px 0px #0f172a',
        background: '#ffffff',
        marginTop: 12,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header Status Bar */}
      <div
        style={{
          background: '#0f172a',
          color: '#ffffff',
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          fontSize: '0.78rem',
          fontWeight: 800,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Radio size={14} color="#4ade80" className="spin" />
          <span style={{ color: '#4ade80' }}>REAL-TIME GPS TRACKING ACTIVE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Updated: {updatedAt}</span>
          <span style={{ background: '#0284c7', color: '#ffffff', padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem' }}>
            {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </span>
        </div>
      </div>

      {/* OpenStreetMap Embed iframe - No React-Leaflet required */}
      <div style={{ height: height, width: '100%', position: 'relative' }}>
        <iframe
          title={`Live Map - ${customerName} Order ${orderNumber}`}
          src={mapSrc}
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          loading="lazy"
          allowFullScreen
        />
      </div>

      {/* Footer with address + Google Maps link */}
      <div
        style={{
          padding: '10px 12px',
          background: '#f8fafc',
          borderTop: '2px dashed #cbd5e1',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: '#334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 160, overflow: 'hidden' }}>
          <MapPin size={14} color="#ef4444" style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{address}</span>
        </div>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: '#ffffff',
            border: '1.5px solid #0f172a',
            padding: '4px 10px',
            borderRadius: 8,
            color: '#0f172a',
            textDecoration: 'none',
            fontSize: '0.74rem',
            fontWeight: 800,
            boxShadow: '2px 2px 0px #0f172a',
            flexShrink: 0,
          }}
        >
          <Navigation size={12} color="#0284c7" /> Google Maps
        </a>
      </div>
    </div>
  );
};

export default OrderLiveMap;
