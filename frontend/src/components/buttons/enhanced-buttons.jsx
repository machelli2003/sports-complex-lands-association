import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';

// Animated Button Wrapper
const MotionButton = motion(Button);

// Primary Action Button with Gradient
export const GradientButton = ({ children, loading, ...props }) => {
  return (
    <MotionButton
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      sx={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: 'white',
        padding: '12px 32px',
        borderRadius: '12px',
        fontWeight: 600,
        fontSize: '0.9375rem',
        textTransform: 'none',
        boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
        transition: 'all 0.3s ease',
        '&:hover': {
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          boxShadow: '0 6px 20px rgba(99, 102, 241, 0.5)',
          transform: 'translateY(-2px)',
        },
        '&:disabled': {
          background: 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)',
          color: 'white',
        },
        ...props.sx,
      }}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <CircularProgress size={20} sx={{ color: 'white' }} />
      ) : (
        children
      )}
    </MotionButton>
  );
};

// Ghost Button (Minimal style)
export const GhostButton = ({ children, ...props }) => {
  return (
    <MotionButton
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      variant="text"
      sx={{
        color: '#64748b',
        padding: '10px 24px',
        borderRadius: '10px',
        fontWeight: 500,
        textTransform: 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: '#f1f5f9',
          color: '#475569',
        },
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </MotionButton>
  );
};

// Icon Button with Badge
export const IconButtonWithBadge = ({ icon, badge, ...props }) => {
  return (
    <MotionButton
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      sx={{
        position: 'relative',
        minWidth: '48px',
        height: '48px',
        borderRadius: '12px',
        padding: '12px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        color: '#475569',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: '#f1f5f9',
          borderColor: '#cbd5e1',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
        ...props.sx,
      }}
      {...props}
    >
      {icon}
      {badge && (
        <span
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            width: '8px',
            height: '8px',
            backgroundColor: '#ef4444',
            borderRadius: '50%',
            border: '2px solid white',
          }}
        />
      )}
    </MotionButton>
  );
};

// Success Button
export const SuccessButton = ({ children, ...props }) => {
  return (
    <MotionButton
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      variant="contained"
      sx={{
        backgroundColor: '#10b981',
        color: 'white',
        padding: '10px 24px',
        borderRadius: '10px',
        fontWeight: 500,
        textTransform: 'none',
        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
        '&:hover': {
          backgroundColor: '#059669',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
        },
        ...props.sx,
      }}
      {...props}
    >
      {children}
    </MotionButton>
  );
};

// Danger Button
export const DangerButton = ({ children, loading, ...props }) => {
  return (
    <MotionButton
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      variant="contained"
      sx={{
        backgroundColor: '#ef4444',
        color: 'white',
        padding: '10px 24px',
        borderRadius: '10px',
        fontWeight: 500,
        textTransform: 'none',
        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
        '&:hover': {
          backgroundColor: '#dc2626',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
        },
        ...props.sx,
      }}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <CircularProgress size={20} sx={{ color: 'white' }} />
      ) : (
        children
      )}
    </MotionButton>
  );
};

export default GradientButton;