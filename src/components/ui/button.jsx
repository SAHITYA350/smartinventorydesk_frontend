import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  className = '',
  loading = false,
  ...props
}) => {
  const variantClass = {
    primary: 'shadcn-btn-primary',
    secondary: 'shadcn-btn-secondary',
    danger: 'shadcn-btn-danger',
    ghost: 'shadcn-btn-ghost',
  }[variant] || 'shadcn-btn-primary';

  return (
    <button
      className={`shadcn-btn ${variantClass} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="spinner-sm">Processing...</span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
