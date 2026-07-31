import React from 'react';

export const Input = ({
  label,
  icon: Icon,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="shadcn-input-group">
      {label && <label className="shadcn-label">{label}</label>}
      <div className="shadcn-input-wrapper">
        {Icon && <Icon className="shadcn-input-icon" size={18} />}
        <input
          className={`shadcn-input ${Icon ? 'has-icon' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
};

export default Input;
