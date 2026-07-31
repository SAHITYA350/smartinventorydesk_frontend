import React from 'react';

export const Card = ({ children, className = '', ...props }) => (
  <div className={`glass-card ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={`card-header-box ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`auth-title ${className}`}>{children}</h3>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`card-content-box ${className}`}>{children}</div>
);
