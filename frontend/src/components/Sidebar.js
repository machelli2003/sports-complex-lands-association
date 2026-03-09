import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PaymentIcon from '@mui/icons-material/Payment';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Client Search', icon: <SearchIcon />, path: '/search' },
  { text: 'New Registration', icon: <PersonAddIcon />, path: '/register' },
  { text: 'Payments', icon: <PaymentIcon />, path: '/payments' },
  { text: 'Documents', icon: <DescriptionIcon />, path: '/documents' },
  { text: 'Reports', icon: <BarChartIcon />, path: '/reports' },
  { text: 'Audit Logs', icon: <HistoryIcon />, path: '/audit-logs' },
  { text: 'Admin Panel', icon: <AdminPanelSettingsIcon />, path: '/admin' }
];

function Sidebar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = React.useContext(AuthContext);

  const filteredMenuItems = menuItems.filter((item) => {
    const adminOnly = ['Reports', 'Audit Logs', 'Admin Panel'];
    if (adminOnly.includes(item.text) && (!user || user.role !== 'admin')) {
      return false;
    }
    return true;
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar />

      {/* System Title */}
      <Box sx={{ px: 3, pb: 2 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            letterSpacing: 1,
            color: 'text.secondary'
          }}
        >
          NAVIGATION
        </Typography>
      </Box>

      <List sx={{ px: 1 }}>
        {filteredMenuItems.map((item) => (
          <ListItemButton
            key={item.text}
            component={NavLink}
            to={item.path}
            onClick={isMobile ? handleDrawerToggle : undefined}
            end={item.path === '/'}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              px: 2,
              py: 1.2,
              color: 'text.primary',
              '& .MuiListItemIcon-root': {
                minWidth: 36,
                color: 'text.secondary'
              },
              '&.active': {
                bgcolor: 'primary.main',
                color: '#fff',
                '& .MuiListItemIcon-root': {
                  color: '#fff'
                }
              },
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.04)'
              }

            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{
                fontSize: 14,
                fontWeight: 500
              }}
            />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid #E7E5E4' }}>
        <ListItemButton
          onClick={logout}
          sx={{
            borderRadius: 2,
            mb: 1,
            color: '#B91C1C',
            '& .MuiListItemIcon-root': {
              minWidth: 36,
              color: '#B91C1C'
            },
            '&:hover': {
              bgcolor: '#FEF2F2'
            }
          }}
        >
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{
              fontSize: 14,
              fontWeight: 600
            }}
          />
        </ListItemButton>
        <Typography variant="caption" color="text.secondary">
          Sports Complex System
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      {isMobile && (
        <IconButton
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 1300,
            bgcolor: '#fff',
            border: '1px solid #E7E5E4',
            '&:hover': { bgcolor: '#F5F5F4' }
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid #E7E5E4',
            bgcolor: '#FAFAF9'
          }
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}

export default Sidebar;
