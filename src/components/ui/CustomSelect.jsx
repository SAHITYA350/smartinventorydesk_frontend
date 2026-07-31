import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  disabled = false,
  style = {},
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0, width: 0, openUpward: false });
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < 230 && rect.top > 230;

      setMenuCoords({
        top: openUpward ? rect.top - 6 : rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        openUpward,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        !event.target.closest('.custom-select-portal-menu')
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format option objects
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value ?? opt._id ?? opt.id,
        label: opt.label ?? opt.name ?? opt.categoryName ?? String(opt.value),
        disabled: Boolean(opt.disabled),
      };
    }
    return { value: opt, label: String(opt), disabled: false };
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));

  const handleSelect = (optionValue, isOptDisabled) => {
    if (isOptDisabled) return;
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            updatePosition();
            setIsOpen(!isOpen);
          }
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 12px',
          background: '#ffffff',
          color: '#0f172a',
          fontFamily: 'var(--font-neo)',
          fontSize: '0.85rem',
          fontWeight: 800,
          border: '2.5px solid #0f172a',
          borderRadius: 10,
          boxShadow: isOpen ? '3px 3px 0px var(--neo-cyan)' : '3px 3px 0px var(--neo-yellow)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          gap: 8,
          boxSizing: 'border-box',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.15s ease',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'left',
            flex: 1,
          }}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          color="#0f172a"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Front Modal Portal Menu (Floating over entire screen without container scrollbars) */}
      {isOpen &&
        ReactDOM.createPortal(
          <>
            {/* Backdrop click dismiss */}
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 999998,
                background: 'transparent',
              }}
              onClick={() => setIsOpen(false)}
            />

            {/* Floating Dropdown Overlay */}
            <div
              className="custom-select-portal-menu"
              style={{
                position: 'fixed',
                top: menuCoords.openUpward ? 'auto' : menuCoords.top,
                bottom: menuCoords.openUpward ? window.innerHeight - menuCoords.top : 'auto',
                left: menuCoords.left,
                width: menuCoords.width,
                maxHeight: 220,
                overflowY: 'auto',
                background: '#ffffff',
                border: '2.5px solid #0f172a',
                boxShadow: '4px 4px 0px #0f172a',
                borderRadius: 10,
                zIndex: 999999,
                padding: 4,
                boxSizing: 'border-box',
              }}
            >
              {normalizedOptions.length > 0 ? (
                normalizedOptions.map((opt, idx) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelect(opt.value, opt.disabled)}
                      style={{
                        padding: '8px 10px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: opt.disabled ? '#94a3b8' : '#0f172a',
                        background: isSelected ? 'var(--neo-yellow)' : 'transparent',
                        borderRadius: 6,
                        cursor: opt.disabled ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        marginBottom: 2,
                        boxSizing: 'border-box',
                        wordBreak: 'break-word',
                      }}
                      onMouseEnter={(e) => {
                        if (!opt.disabled && !isSelected) e.currentTarget.style.background = '#f1f5f9';
                      }}
                      onMouseLeave={(e) => {
                        if (!opt.disabled && !isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ flex: 1 }}>{opt.label}</span>
                      {isSelected && <Check size={14} color="#0f172a" style={{ flexShrink: 0 }} />}
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: 10, fontSize: '0.8rem', color: '#64748b', textAlign: 'center', fontWeight: 700 }}>
                  No options available
                </div>
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
};

export default CustomSelect;
