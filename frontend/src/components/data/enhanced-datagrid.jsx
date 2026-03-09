import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Chip, Avatar, Typography, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled DataGrid with Modern Look
export const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  border: 'none',
  borderRadius: '16px',
  backgroundColor: 'white',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  
  '& .MuiDataGrid-main': {
    borderRadius: '16px',
  },
  
  // Column Headers
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
    borderRadius: '16px 16px 0 0',
    minHeight: '56px !important',
    maxHeight: '56px !important',
  },
  
  '& .MuiDataGrid-columnHeader': {
    padding: '0 16px',
    '&:focus': {
      outline: 'none',
    },
    '&:focus-within': {
      outline: 'none',
    },
  },
  
  '& .MuiDataGrid-columnHeaderTitle': {
    fontWeight: 700,
    fontSize: '0.875rem',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  
  // Rows
  '& .MuiDataGrid-row': {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#f8fafc',
      cursor: 'pointer',
    },
    '&.Mui-selected': {
      backgroundColor: '#f0f4ff',
      '&:hover': {
        backgroundColor: '#e0e7ff',
      },
    },
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  
  // Cells
  '& .MuiDataGrid-cell': {
    padding: '12px 16px',
    fontSize: '0.9375rem',
    color: '#0f172a',
    borderBottom: 'none',
    '&:focus': {
      outline: 'none',
    },
    '&:focus-within': {
      outline: 'none',
    },
  },
  
  // Footer
  '& .MuiDataGrid-footerContainer': {
    borderTop: '2px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    minHeight: '56px',
  },
  
  // Checkbox
  '& .MuiCheckbox-root': {
    color: '#94a3b8',
    '&.Mui-checked': {
      color: '#6366f1',
    },
  },
  
  // Scrollbar
  '& .MuiDataGrid-virtualScroller': {
    '&::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: '#f1f5f9',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#cbd5e1',
      borderRadius: '4px',
      '&:hover': {
        backgroundColor: '#94a3b8',
      },
    },
  },
}));

// Custom Cell Renderers for Common Use Cases

// Status Cell with Colored Chips
export const StatusCell = ({ value }) => {
  const statusColors = {
    active: { bg: '#dcfce7', color: '#059669' },
    pending: { bg: '#fef3c7', color: '#d97706' },
    inactive: { bg: '#fee2e2', color: '#dc2626' },
    completed: { bg: '#dbeafe', color: '#2563eb' },
  };

  const status = value?.toLowerCase() || 'pending';
  const colors = statusColors[status] || statusColors.pending;

  return (
    <Chip
      label={value}
      size="small"
      sx={{
        backgroundColor: colors.bg,
        color: colors.color,
        fontWeight: 600,
        fontSize: '0.8125rem',
        height: '28px',
        borderRadius: '8px',
        textTransform: 'capitalize',
      }}
    />
  );
};

// User Cell with Avatar and Name
export const UserCell = ({ name, email, avatar }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Avatar
        src={avatar}
        sx={{
          width: 36,
          height: 36,
          fontSize: '0.875rem',
          fontWeight: 600,
        }}
      >
        {name?.charAt(0)}
      </Avatar>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
          {name}
        </Typography>
        {email && (
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            {email}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// Progress Cell with Bar
export const ProgressCell = ({ value }) => {
  const percentage = parseFloat(value) || 0;
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          flex: 1,
          height: '8px',
          borderRadius: '4px',
          backgroundColor: '#e2e8f0',
          '& .MuiLinearProgress-bar': {
            backgroundColor: percentage >= 75 ? '#10b981' : percentage >= 50 ? '#3b82f6' : '#f59e0b',
            borderRadius: '4px',
          },
        }}
      />
      <Typography variant="body2" sx={{ fontWeight: 600, minWidth: '40px', color: '#64748b' }}>
        {percentage}%
      </Typography>
    </Box>
  );
};

// Currency Cell
export const CurrencyCell = ({ value, currency = 'USD' }) => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value || 0);

  return (
    <Typography
      variant="body2"
      sx={{
        fontWeight: 700,
        color: value >= 0 ? '#0f172a' : '#ef4444',
      }}
    >
      {formatted}
    </Typography>
  );
};

// Date Cell
export const DateCell = ({ value }) => {
  const date = new Date(value);
  const formatted = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Typography variant="body2" sx={{ color: '#64748b' }}>
      {formatted}
    </Typography>
  );
};

// Priority Cell
export const PriorityCell = ({ value }) => {
  const priorityConfig = {
    high: { color: '#ef4444', icon: '🔴' },
    medium: { color: '#f59e0b', icon: '🟡' },
    low: { color: '#10b981', icon: '🟢' },
  };

  const priority = value?.toLowerCase() || 'low';
  const config = priorityConfig[priority] || priorityConfig.low;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <span>{config.icon}</span>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          color: config.color,
          textTransform: 'capitalize',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

// Example Enhanced DataGrid Component
export const EnhancedDataGrid = ({ rows, columns, ...props }) => {
  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
      }}
    >
      <StyledDataGrid
        rows={rows}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10, 25, 50]}
        checkboxSelection
        disableSelectionOnClick
        autoHeight
        {...props}
      />
    </Box>
  );
};

// Example usage with custom columns
export const exampleColumns = [
  {
    field: 'user',
    headerName: 'User',
    width: 250,
    renderCell: (params) => (
      <UserCell
        name={params.row.name}
        email={params.row.email}
        avatar={params.row.avatar}
      />
    ),
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 130,
    renderCell: (params) => <StatusCell value={params.value} />,
  },
  {
    field: 'progress',
    headerName: 'Progress',
    width: 200,
    renderCell: (params) => <ProgressCell value={params.value} />,
  },
  {
    field: 'amount',
    headerName: 'Amount',
    width: 150,
    renderCell: (params) => <CurrencyCell value={params.value} />,
  },
  {
    field: 'priority',
    headerName: 'Priority',
    width: 130,
    renderCell: (params) => <PriorityCell value={params.value} />,
  },
  {
    field: 'date',
    headerName: 'Date',
    width: 150,
    renderCell: (params) => <DateCell value={params.value} />,
  },
];

export default EnhancedDataGrid;