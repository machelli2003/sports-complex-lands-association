import React, { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { login as apiLogin } from '../api';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Box, Typography, Paper } from '@mui/material';
function LoginPage() {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await apiLogin(username, password);
      // Backend returns: { access_token: "...", user_id: 1, role: "..." }
      if (response && response.data && response.data.access_token) {
        login({ user_id: response.data.user_id, role: response.data.role }, response.data.access_token);
        navigate('/');
      } else {
        setError('Login failed: Invalid response from server');
      }
    } catch (err) {
      console.error(err);
      setError('Invalid credentials or server error');
    }
  };
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f8fafc">
      <Paper elevation={3} sx={{ p: 4, minWidth: 320 }}>
        <Typography variant="h5" mb={2}>Login</Typography>
        <form onSubmit={handleSubmit}>
          <TextField label="Username" fullWidth margin="normal" value={username} onChange={e => setUsername(e.target.value)} />
          <TextField label="Password" type="password" fullWidth margin="normal" value={password} onChange={e => setPassword(e.target.value)} />
          {error && <Typography color="error">{error}</Typography>}
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>Login</Button>
        </form>
      </Paper>
    </Box>
  );
}
export default LoginPage;