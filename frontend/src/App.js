import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, CssBaseline, Toolbar, useMediaQuery, IconButton, Drawer } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { AuthContext } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';

import Dashboard from './pages/Dashboard';
import ClientSearch from './pages/ClientSearch';
import ClientProfile from './pages/ClientProfile';
import NewRegistration from './pages/NewRegistration';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Documents from './pages/Documents';
import AdminPanel from './pages/AdminPanel';
import ReceiptPrint from './pages/ReceiptPrint';
import AuditLogs from './pages/AuditLogs';

import Navbar from './components/Navbar';
import SidebarContent from './components/Sidebar'; // We'll treat SidebarContent as the inner content

const drawerWidth = 240;

const theme = createTheme({
  palette: {
    primary: { main: '#8B7355' },
    secondary: { main: '#78716C' },
    background: { default: '#F5F5F4', paper: '#FFFFFF' },
    text: { primary: '#1C1917', secondary: '#78716C' },
  },
  shape: { borderRadius: 8 },
});

function App() {
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user, token } = React.useContext(AuthContext);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Sidebar content
  const sidebar = <SidebarContent />;

  if (!token) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ThemeProvider>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Navbar onMenuClick={handleDrawerToggle} />

      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar for desktop */}
        {!isMobile && (
          <Box
            sx={{
              width: drawerWidth,
              flexShrink: 0,
            }}
          >
            {sidebar}
          </Box>
        )}

        {/* Sidebar for mobile */}
        {isMobile && (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': { width: drawerWidth },
            }}
          >
            {sidebar}
          </Drawer>
        )}

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            p: 3,
          }}
        >
          <Toolbar /> {/* keeps space for navbar */}

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<ClientSearch />} />
            <Route path="/client/:id" element={<ClientProfile />} />
            <Route path="/register" element={<NewRegistration />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/receipt/:paymentId" element={<ReceiptPrint />} />

            {/* Protected Routes */}
            <Route path="/reports" element={isAdmin ? <Reports /> : <Navigate to="/" />} />
            <Route path="/documents" element={<Documents />} />

            {/* Admin-only Routes */}
            <Route path="/admin" element={isAdmin ? <AdminPanel /> : <Navigate to="/" />} />
            <Route path="/audit-logs" element={isAdmin ? <AuditLogs /> : <Navigate to="/" />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
