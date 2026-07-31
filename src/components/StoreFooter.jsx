import React from 'react';
import {
  Globe,
  Code2,
  BookOpen,
  Heart,
  ShieldCheck,
  Store,
  Sparkles,
  ExternalLink,
  Cpu,
  Award,
  Share2
} from 'lucide-react';

const socialLinks = [
  {
    name: 'LinkedIn',
    handle: 'sahitya-ghosh-9ba098292',
    url: 'https://linkedin.com/in/sahitya-ghosh-9ba098292',
    badge: 'https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white',
    color: '#0077B5',
    icon: Globe,
  },
  {
    name: 'GitHub',
    handle: 'SAHITYA350',
    url: 'https://github.com/SAHITYA350',
    badge: 'https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white',
    color: '#24292e',
    icon: Code2,
  },
  {
    name: 'Twitter / X',
    handle: '@sahityagbcx',
    url: 'https://twitter.com/sahityagbcx',
    badge: 'https://img.shields.io/badge/Twitter-1DA1F2?style=flat-square&logo=twitter&logoColor=white',
    color: '#1DA1F2',
    icon: Share2,
  },
  {
    name: 'Dev.to Blog',
    handle: 'sahitya_ghosh_350',
    url: 'https://dev.to/sahitya_ghosh_350',
    badge: 'https://img.shields.io/badge/dev.to-0A0A0A?style=flat-square&logo=dev.to&logoColor=white',
    color: '#0A0A0A',
    icon: BookOpen,
  },
  {
    name: 'LeetCode',
    handle: 'balasur',
    url: 'https://www.leetcode.com/balasur',
    badge: 'https://img.shields.io/badge/-LeetCode-FFA116?style=flat-square&logo=LeetCode&logoColor=black',
    color: '#FFA116',
    icon: Code2,
  },
  {
    name: 'GeeksforGeeks',
    handle: 'sahityagmkep',
    url: 'https://auth.geeksforgeeks.org/user/sahityagmkep',
    badge: 'https://img.shields.io/badge/GeeksforGeeks-298D46?style=flat-square&logo=geeksforgeeks&logoColor=white',
    color: '#298D46',
    icon: Award,
  },
  {
    name: 'Facebook',
    handle: 'devinwithsahitya',
    url: 'https://fb.com/devinwithsahitya',
    badge: 'https://img.shields.io/badge/Facebook-1877F2?style=flat-square&logo=facebook&logoColor=white',
    color: '#1877F2',
    icon: Share2,
  },
  {
    name: 'Instagram',
    handle: 'sahityaghosh_350',
    url: 'https://instagram.com/sahityaghosh_350',
    badge: 'https://img.shields.io/badge/Instagram-E4405F?style=flat-square&logo=instagram&logoColor=white',
    color: '#E4405F',
    icon: Globe,
  },
];

const StoreFooter = () => {
  return (
    <footer
      style={{
        marginTop: 20,
        background: '#ffffff',
        borderTop: '3px solid #0f172a',
        padding: '16px 14px 12px 14px',
        boxShadow: '0px -4px 0px rgba(15, 23, 42, 0.05)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {/* Top Grid: App Info & Social Badges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            marginBottom: 16,
          }}
        >
          {/* Column 1: App Brand & Description */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div
                style={{
                  background: 'var(--neo-yellow, #facc15)',
                  padding: 6,
                  borderRadius: 8,
                  border: '1.8px solid #0f172a',
                  boxShadow: '2px 2px 0px #0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Store size={18} color="#0f172a" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, color: '#0f172a' }}>
                  SmartStore<span style={{ color: '#fbbf24' }}>.POS</span>
                </h3>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>
                  Inventory & Billing Desk System
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.76rem', color: '#475569', fontWeight: 600, lineHeight: 1.4, marginBottom: 10 }}>
              Comprehensive MERN-based retail operations platform. Empowers small stores with real-time stock audits, express billing invoices, Razorpay checkout, and live sales analytics.
            </p>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span
                style={{
                  background: '#f1f5f9',
                  color: '#0f172a',
                  padding: '3px 6px',
                  borderRadius: 6,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  border: '1.2px solid #0f172a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <ShieldCheck size={12} color="#16a34a" /> Enterprise Security
              </span>
              <span
                style={{
                  background: '#f1f5f9',
                  color: '#0f172a',
                  padding: '3px 6px',
                  borderRadius: 6,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  border: '1.2px solid #0f172a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Sparkles size={12} color="#0284c7" /> Socket.io Sync
              </span>
            </div>
          </div>

          {/* Column 2: Developer Profiles & Connect */}
          <div>
            <h4
              style={{
                fontSize: '0.88rem',
                fontWeight: 900,
                marginBottom: 8,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Cpu size={14} color="#0284c7" /> Developer Connections & Profiles
            </h4>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 6,
              }}
            >
              {socialLinks.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neo-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '5px 8px',
                      background: '#ffffff',
                      borderRadius: 8,
                      border: '1.5px solid #0f172a',
                      textDecoration: 'none',
                      color: '#0f172a',
                      transition: 'transform 0.15s ease, boxShadow 0.15s ease',
                      boxShadow: '1.5px 1.5px 0px #0f172a',
                      gap: 4,
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '3px 3px 0px #0f172a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '1.5px 1.5px 0px #0f172a';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          background: item.color,
                          color: '#ffffff',
                          padding: 4,
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IconComponent size={11} />
                      </div>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <strong style={{ fontSize: '0.7rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#0f172a' }}>
                          {item.name}
                        </strong>
                        <span style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.handle}
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar / Copyright */}
        <div
          style={{
            borderTop: '2px dashed #cbd5e1',
            paddingTop: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            fontSize: '0.74rem',
            fontWeight: 700,
            color: '#64748b',
          }}
        >
          <div>
            © {new Date().getFullYear()} <strong>SmartStore POS</strong>. Built with <Heart size={12} color="#ef4444" style={{ display: 'inline', verticalAlign: 'middle' }} /> by <strong>Sahitya Ghosh</strong>.
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href="https://github.com/SAHITYA350" target="_blank" rel="noreferrer" style={{ color: '#0284c7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              GitHub <ExternalLink size={10} />
            </a>
            <a href="https://linkedin.com/in/sahitya-ghosh-9ba098292" target="_blank" rel="noreferrer" style={{ color: '#0077B5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              LinkedIn <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default StoreFooter;
