import React from 'react';
import { Box, Container, Typography, Skeleton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// Page Container with Fade-in Animation
export const AnimatedPage = ({ children, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{ width: '100%' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Page Header Component
export const PageHeader = ({ title, subtitle, action, breadcrumbs }) => {
  return (
    <Box
      sx={{
        mb: 4,
        pb: 3,
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <Typography
                variant="body2"
                sx={{
                  color: index === breadcrumbs.length - 1 ? '#6366f1' : '#94a3b8',
                  fontWeight: index === breadcrumbs.length - 1 ? 600 : 400,
                  fontSize: '0.875rem',
                  cursor: index === breadcrumbs.length - 1 ? 'default' : 'pointer',
                  '&:hover': {
                    color: index === breadcrumbs.length - 1 ? '#6366f1' : '#64748b',
                  },
                }}
              >
                {crumb}
              </Typography>
              {index < breadcrumbs.length - 1 && (
                <Typography sx={{ color: '#cbd5e1', fontSize: '0.875rem' }}>
                  /
                </Typography>
              )}
            </React.Fragment>
          ))}
        </Box>
      )}

      {/* Title and Action */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#0f172a',
              mb: subtitle ? 1 : 0,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" sx={{ color: '#64748b', maxWidth: '600px' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && <Box>{action}</Box>}
      </Box>
    </Box>
  );
};

// Grid Layout for Cards/Items
export const GridLayout = ({ children, columns = 3, gap = 3 }) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: `repeat(${columns}, 1fr)`,
        },
        gap: gap,
      }}
    >
      {children}
    </Box>
  );
};

// Loading Skeleton for Cards
export const CardSkeleton = () => {
  return (
    <Box
      sx={{
        p: 3,
        backgroundColor: 'white',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
      }}
    >
      <Skeleton variant="circular" width={48} height={48} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="60%" height={32} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="40%" height={24} />
    </Box>
  );
};

// Loading Skeleton for Table Rows
export const TableRowSkeleton = ({ columns = 5 }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, p: 2 }}>
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton
          key={index}
          variant="rectangular"
          width={`${100 / columns}%`}
          height={40}
          sx={{ borderRadius: '8px' }}
        />
      ))}
    </Box>
  );
};

// Page Loading State
export const PageLoading = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        gap: 3,
      }}
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </motion.div>
      <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500 }}>
        Loading...
      </Typography>
    </Box>
  );
};

// Empty State Component
export const EmptyState = ({ icon, title, description, action }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        textAlign: 'center',
        p: 4,
      }}
    >
      {/* Icon Container */}
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '20px',
          backgroundColor: '#f8fafc',
          border: '2px dashed #cbd5e1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          color: '#94a3b8',
        }}
      >
        {icon}
      </Box>

      {/* Text */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: '#0f172a',
          mb: 1,
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: '#64748b',
          maxWidth: '400px',
          mb: 3,
        }}
      >
        {description}
      </Typography>

      {/* Action */}
      {action && <Box>{action}</Box>}
    </Box>
  );
};

// Section Container
export const Section = ({ title, description, children, action }) => {
  return (
    <Box sx={{ mb: 5 }}>
      {/* Section Header */}
      {(title || action) && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Box>
            {title && (
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: '#0f172a',
                  mb: description ? 0.5 : 0,
                }}
              >
                {title}
              </Typography>
            )}
            {description && (
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                {description}
              </Typography>
            )}
          </Box>
          {action && <Box>{action}</Box>}
        </Box>
      )}

      {/* Section Content */}
      {children}
    </Box>
  );
};

// Animated List Container (Stagger Children)
export const AnimatedList = ({ children }) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

// Animated List Item
export const AnimatedListItem = ({ children, ...props }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0 },
      }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Dashboard Layout
export const DashboardLayout = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
      }}
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
};

// Two Column Layout
export const TwoColumnLayout = ({ sidebar, main, sidebarWidth = '300px' }) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: `${sidebarWidth} 1fr`,
        },
        gap: 3,
      }}
    >
      <Box>{sidebar}</Box>
      <Box>{main}</Box>
    </Box>
  );
};

// Stats Grid (for dashboard metrics)
export const StatsGrid = ({ children }) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          lg: 'repeat(4, 1fr)',
        },
        gap: 3,
        mb: 4,
      }}
    >
      {children}
    </Box>
  );
};

export default AnimatedPage;