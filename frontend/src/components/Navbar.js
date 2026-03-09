import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

function Navbar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: 1201,
        background: '2f1b12',
        px: { xs: 1, sm: 3, md: 4 }, // responsive padding
      }}
    >
      <Toolbar>
        <Typography
          variant={isMobile ? "h6" : "h5"}
          noWrap
          component="div"
          sx={{
            maxWidth: { xs: '180px', sm: '220px', md: '300px' },
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 600
          }}
        >
          {isMobile ? "SCLRA System" : "Sports Complex Lands Regularization Association"}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
