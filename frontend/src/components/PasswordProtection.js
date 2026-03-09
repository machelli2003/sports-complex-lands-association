import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { Lock } from 'lucide-react';

import { verifyPagePassword } from '../api';

function PasswordProtection({ children, pageName }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const authKey = `auth_${pageName}`;
    const authenticated = sessionStorage.getItem(authKey) === 'true';

    if (authenticated) {
      setIsAuthenticated(true);
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [pageName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await verifyPagePassword(pageName, password);

      if (response.data.valid) {
        setIsAuthenticated(true);
        sessionStorage.setItem(`auth_${pageName}`, 'true');
        setOpen(false);
        setPassword('');
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    } catch (err) {
      setError('Password verification failed. Please try again.');
      setPassword('');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!isAuthenticated) {
      setError('Password is required to access this page.');
    }
  };

  if (!isAuthenticated) {
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: '1px solid #E7E5E4',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Lock size={18} color="white" />
            </Box>

            <Box>
              <Typography variant="h6" fontWeight={600}>
                Restricted Access
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pageName}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <form onSubmit={handleSubmit} id="password-form">
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Enter the authorized password to continue.
            </Typography>

            <TextField
              autoFocus
              fullWidth
              type="password"
              label="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              margin="normal"
              error={!!error}
            />
          </form>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            type="submit"
            form="password-form"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Continue'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return children;
}

export default PasswordProtection;
