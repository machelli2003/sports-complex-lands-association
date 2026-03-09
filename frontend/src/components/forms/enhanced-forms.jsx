import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Typography,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Search, Eye, EyeOff, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced Text Field with Icon Support
export const EnhancedTextField = ({
  label,
  error,
  helperText,
  icon,
  success,
  ...props
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      {label && (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: '#475569',
            mb: 1,
            fontSize: '0.875rem',
          }}
        >
          {label}
        </Typography>
      )}
      <TextField
        fullWidth
        error={error}
        helperText={helperText}
        InputProps={{
          startAdornment: icon ? (
            <InputAdornment position="start">
              <Box sx={{ color: error ? '#ef4444' : success ? '#10b981' : '#94a3b8' }}>
                {icon}
              </Box>
            </InputAdornment>
          ) : null,
          endAdornment: (
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <InputAdornment position="end">
                    <Check size={20} color="#10b981" />
                  </InputAdornment>
                </motion.div>
              )}
              {error && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                >
                  <InputAdornment position="end">
                    <X size={20} color="#ef4444" />
                  </InputAdornment>
                </motion.div>
              )}
            </AnimatePresence>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: '#e2e8f0',
              borderWidth: '1.5px',
            },
            '&:hover': {
              backgroundColor: 'white',
              '& fieldset': {
                borderColor: error ? '#ef4444' : success ? '#10b981' : '#6366f1',
              },
            },
            '&.Mui-focused': {
              backgroundColor: 'white',
              '& fieldset': {
                borderColor: error ? '#ef4444' : success ? '#10b981' : '#6366f1',
                borderWidth: '2px',
              },
            },
            '&.Mui-error': {
              '& fieldset': {
                borderColor: '#ef4444',
              },
            },
          },
          '& .MuiInputBase-input': {
            padding: '14px 16px',
            fontSize: '0.9375rem',
            color: '#0f172a',
          },
          '& .MuiFormHelperText-root': {
            marginLeft: 0,
            marginTop: '6px',
            fontSize: '0.8125rem',
          },
        }}
        {...props}
      />
    </Box>
  );
};

// Search Field
export const SearchField = ({ placeholder = 'Search...', ...props }) => {
  return (
    <TextField
      fullWidth
      placeholder={placeholder}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search size={20} color="#94a3b8" />
          </InputAdornment>
        ),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          transition: 'all 0.2s ease',
          '& fieldset': {
            borderColor: 'transparent',
          },
          '&:hover': {
            backgroundColor: 'white',
            '& fieldset': {
              borderColor: '#e2e8f0',
            },
          },
          '&.Mui-focused': {
            backgroundColor: 'white',
            boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
            '& fieldset': {
              borderColor: '#6366f1',
              borderWidth: '2px',
            },
          },
        },
        '& .MuiInputBase-input': {
          padding: '12px 14px',
          fontSize: '0.9375rem',
        },
      }}
      {...props}
    />
  );
};

// Password Field with Toggle
export const PasswordField = ({ label, error, helperText, ...props }) => {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <Box sx={{ width: '100%' }}>
      {label && (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: '#475569',
            mb: 1,
            fontSize: '0.875rem',
          }}
        >
          {label}
        </Typography>
      )}
      <TextField
        fullWidth
        type={showPassword ? 'text' : 'password'}
        error={error}
        helperText={helperText}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                sx={{ color: '#94a3b8' }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            transition: 'all 0.2s ease',
            '& fieldset': {
              borderColor: '#e2e8f0',
              borderWidth: '1.5px',
            },
            '&:hover': {
              backgroundColor: 'white',
              '& fieldset': {
                borderColor: error ? '#ef4444' : '#6366f1',
              },
            },
            '&.Mui-focused': {
              backgroundColor: 'white',
              '& fieldset': {
                borderColor: error ? '#ef4444' : '#6366f1',
                borderWidth: '2px',
              },
            },
          },
          '& .MuiInputBase-input': {
            padding: '14px 16px',
            fontSize: '0.9375rem',
          },
        }}
        {...props}
      />
    </Box>
  );
};

// Enhanced Select Field
export const EnhancedSelect = ({
  label,
  options = [],
  error,
  helperText,
  ...props
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      {label && (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: '#475569',
            mb: 1,
            fontSize: '0.875rem',
          }}
        >
          {label}
        </Typography>
      )}
      <FormControl fullWidth error={error}>
        <Select
          sx={{
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#e2e8f0',
              borderWidth: '1.5px',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: error ? '#ef4444' : '#6366f1',
            },
            '&.Mui-focused': {
              backgroundColor: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: error ? '#ef4444' : '#6366f1',
                borderWidth: '2px',
              },
            },
            '& .MuiSelect-select': {
              padding: '14px 16px',
              fontSize: '0.9375rem',
            },
          }}
          {...props}
        >
          {options.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
              sx={{
                fontSize: '0.9375rem',
                '&:hover': {
                  backgroundColor: '#f8fafc',
                },
                '&.Mui-selected': {
                  backgroundColor: '#f0f4ff',
                  '&:hover': {
                    backgroundColor: '#e0e7ff',
                  },
                },
              }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    </Box>
  );
};

// Form Group Container
export const FormGroup = ({ title, description, children }) => {
  return (
    <Box
      sx={{
        p: 3,
        backgroundColor: 'white',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        mb: 3,
      }}
    >
      {title && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}
          >
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {description}
            </Typography>
          )}
        </Box>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {children}
      </Box>
    </Box>
  );
};

// Input with Character Counter
export const TextFieldWithCounter = ({
  maxLength = 100,
  value = '',
  label,
  ...props
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      {label && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: '#475569',
              fontSize: '0.875rem',
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: value.length > maxLength ? '#ef4444' : '#94a3b8',
              fontWeight: 500,
            }}
          >
            {value.length}/{maxLength}
          </Typography>
        </Box>
      )}
      <EnhancedTextField
        value={value}
        error={value.length > maxLength}
        helperText={
          value.length > maxLength ? 'Character limit exceeded' : ''
        }
        {...props}
      />
    </Box>
  );
};

export default EnhancedTextField;