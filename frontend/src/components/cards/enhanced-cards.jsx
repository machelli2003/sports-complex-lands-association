import React from 'react';
import { Card, CardContent, CardActions, Typography, Box, Avatar, Chip } from '@mui/material';
import { motion } from 'framer-motion';

// Animated Card Wrapper
const MotionCard = motion(Card);

// Modern Dashboard Card
export const DashboardCard = ({ title, value, icon, trend, color = '#6366f1', ...props }) => {
  return (
    <MotionCard
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.12)' }}
      transition={{ duration: 0.2 }}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        ...props.sx,
      }}
    >
      {/* Background Gradient Accent */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '120px',
          height: '120px',
          background: `linear-gradient(135deg, ${color}20 0%, ${color}05 100%)`,
          borderRadius: '0 0 0 100%',
        }}
      />

      <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        {/* Icon */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: `0 4px 12px ${color}40`,
            }}
          >
            {icon}
          </Box>
          
          {/* Trend Badge */}
          {trend && (
            <Chip
              label={trend}
              size="small"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: trend.startsWith('+') ? '#dcfce7' : '#fee2e2',
                color: trend.startsWith('+') ? '#059669' : '#dc2626',
                border: 'none',
              }}
            />
          )}
        </Box>

        {/* Title */}
        <Typography
          variant="body2"
          sx={{
            color: '#64748b',
            fontWeight: 500,
            mb: 0.5,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.75rem',
          }}
        >
          {title}
        </Typography>

        {/* Value */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#0f172a',
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </Typography>
      </CardContent>
    </MotionCard>
  );
};

// Feature Card (for pricing, features, etc.)
export const FeatureCard = ({ title, description, icon, features = [], highlighted = false, ...props }) => {
  return (
    <MotionCard
      whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)' }}
      transition={{ duration: 0.3 }}
      sx={{
        border: highlighted ? '2px solid #6366f1' : '1px solid #e2e8f0',
        borderRadius: '20px',
        position: 'relative',
        overflow: 'hidden',
        ...props.sx,
      }}
    >
      {/* Highlighted Badge */}
      {highlighted && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            backgroundColor: '#6366f1',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          Popular
        </Box>
      )}

      <CardContent sx={{ p: 4 }}>
        {/* Icon */}
        {icon && (
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              mb: 3,
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
            }}
          >
            {icon}
          </Box>
        )}

        {/* Title */}
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#0f172a' }}>
          {title}
        </Typography>

        {/* Description */}
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3, lineHeight: 1.7 }}>
          {description}
        </Typography>

        {/* Features List */}
        {features.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {features.map((feature, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: '#475569' }}>
                  {feature}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </MotionCard>
  );
};

// Profile/User Card
export const ProfileCard = ({ name, role, avatar, stats = [], ...props }) => {
  return (
    <MotionCard
      whileHover={{ y: -4 }}
      sx={{
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        overflow: 'hidden',
        ...props.sx,
      }}
    >
      {/* Header with Gradient */}
      <Box
        sx={{
          height: '80px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        }}
      />

      <CardContent sx={{ p: 3, mt: -5 }}>
        {/* Avatar */}
        <Avatar
          src={avatar}
          sx={{
            width: 80,
            height: 80,
            border: '4px solid white',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            mb: 2,
          }}
        >
          {name?.charAt(0)}
        </Avatar>

        {/* Name & Role */}
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
          {name}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
          {role}
        </Typography>

        {/* Stats */}
        {stats.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
              gap: 2,
              pt: 2,
              borderTop: '1px solid #e2e8f0',
            }}
          >
            {stats.map((stat, index) => (
              <Box key={index} sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </MotionCard>
  );
};

// Product/Item Card
export const ProductCard = ({ image, title, price, category, onAddToCart, ...props }) => {
  return (
    <MotionCard
      whileHover={{ y: -6 }}
      sx={{
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        ...props.sx,
      }}
    >
      {/* Image */}
      <Box
        sx={{
          height: 200,
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        {/* Category Badge */}
        {category && (
          <Chip
            label={category}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              backgroundColor: 'white',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        )}
      </Box>

      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a', mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#6366f1' }}>
          {price}
        </Typography>
      </CardContent>

      <CardActions sx={{ p: 2.5, pt: 0 }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAddToCart}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 600,
            fontSize: '0.9375rem',
            cursor: 'pointer',
          }}
        >
          Add to Cart
        </motion.button>
      </CardActions>
    </MotionCard>
  );
};

export default DashboardCard;