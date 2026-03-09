import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchClients } from '../api';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip,
  InputAdornment,
  IconButton,
  Fade,
  Divider
} from '@mui/material';
import { Search, X, Users, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

function ClientSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() && !stageFilter && !statusFilter) {
      setError('Please enter a search term or select filters');
      return;
    }
    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const res = await searchClients(searchQuery, stageFilter, statusFilter);
      setRows(res.data.map(client => ({ id: client.client_id, ...client })));
    } catch (err) {
      setError('Search failed. Please try again.');
      setRows([]);
    }
    setLoading(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    setStageFilter('');
    setStatusFilter('');
    setRows([]);
    setError('');
    setHasSearched(false);
  };

  const handleSearchAll = async () => {
    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const res = await searchClients('', '', '');
      setRows(res.data.map(client => ({ id: client.client_id, ...client })));
    } catch (err) {
      setError('Failed to load all clients');
      setRows([]);
    }
    setLoading(false);
  };

  const activeFiltersCount = [searchQuery, stageFilter, statusFilter].filter(Boolean).length;

  const columns = [
    {
      field: 'client_id',
      headerName: 'ID',
      width: 90,
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#1E293B' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'file_number',
      headerName: 'File Number',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '14px', color: '#1E293B' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'full_name',
      headerName: 'Full Name',
      width: 220,
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#1E293B' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '14px', color: '#64748B' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'ghana_card_number',
      headerName: 'Ghana Card',
      width: 180,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '14px', color: '#64748B' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'association_name',
      headerName: 'Association',
      width: 200,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '14px', color: '#64748B' }}>
          {params.value || 'N/A'}
        </Typography>
      )
    },
    {
      field: 'current_stage',
      headerName: 'Stage',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={`Stage ${params.value}`}
          size="small"
          sx={{
            background: '#F0FDFA',
            color: '#0D9488',
            fontWeight: 600,
            fontSize: '12px'
          }}
        />
      )
    },
    {
      field: 'outstanding_balance',
      headerName: 'Outstanding (GHS)',
      width: 180,
      renderCell: (params) => (
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: '14px',
            color: params.value > 0 ? '#EF4444' : '#10B981'
          }}
        >
          GHS {params.value?.toLocaleString() || 0}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => {
        const statusColors = {
          active: { bg: '#D1FAE5', color: '#065F46' },
          inactive: { bg: '#FEE2E2', color: '#991B1B' },
          completed: { bg: '#D1FAE5', color: '#065F46' }
        };
        const colors = statusColors[params.value?.toLowerCase()] || { bg: '#F1F5F9', color: '#475569' };

        return (
          <Chip
            label={params.value}
            size="small"
            sx={{
              background: colors.bg,
              color: colors.color,
              fontWeight: 600,
              fontSize: '12px',
              textTransform: 'capitalize'
            }}
          />
        );
      }
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', background: '#F8FAFC' }}>
      {/* PAGE HEADER */}
      <Box
        sx={{
          px: { xs: 2, md: 4 },
          py: 3,
          mb: 4,
          borderBottom: '1px solid #E2E8F0',
          background: '#FFFFFF'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '8px',
                bgcolor: '#0D9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Users size={20} color="white" />
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: { xs: '24px', md: '30px' },
                  fontWeight: 600,
                  color: '#1E293B'
                }}
              >
                Client Search
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#64748B',
                  fontSize: '14px'
                }}
              >
                Search and filter your client database
              </Typography>
            </Box>
          </Box>

          {activeFiltersCount > 0 && (
            <Chip
              label={`${activeFiltersCount} active filter${activeFiltersCount > 1 ? 's' : ''}`}
              size="small"
              sx={{
                background: '#F0FDFA',
                color: '#0D9488',
                fontWeight: 600,
                fontSize: '12px'
              }}
            />
          )}
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, md: 4 }, pb: 4 }}>
        {/* FILTER SECTION */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            border: '1px solid #E2E8F0',
            borderRadius: '8px'
          }}
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            mb={3}
          >
            <Typography
              sx={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#1E293B'
              }}
            >
              Search Filters
            </Typography>

            {activeFiltersCount > 0 && (
              <Button
                size="small"
                onClick={handleClear}
                startIcon={<X size={16} />}
                sx={{
                  color: '#64748B',
                  '&:hover': {
                    background: '#F8FAFC'
                  }
                }}
              >
                Clear All
              </Button>
            )}
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by name, file #, phone or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} color="#0D9488" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <X size={16} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#0D9488'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0D9488'
                    }
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel
                  sx={{
                    '&.Mui-focused': {
                      color: '#0D9488'
                    }
                  }}
                >
                  Stage
                </InputLabel>
                <Select
                  value={stageFilter}
                  label="Stage"
                  onChange={e => setStageFilter(e.target.value)}
                  sx={{
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#0D9488'
                    }
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="1">Stage 1</MenuItem>
                  <MenuItem value="2">Stage 2</MenuItem>
                  <MenuItem value="3">Stage 3</MenuItem>
                  <MenuItem value="4">Stage 4</MenuItem>
                  <MenuItem value="5">Stage 5</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel
                  sx={{
                    '&.Mui-focused': {
                      color: '#0D9488'
                    }
                  }}
                >
                  Status
                </InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={e => setStatusFilter(e.target.value)}
                  sx={{
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#0D9488'
                    }
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
              startIcon={<Search size={16} />}
              sx={{
                background: '#0D9488',
                borderRadius: '6px',
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '14px',
                '&:hover': {
                  background: '#0F766E'
                },
                '&:disabled': {
                  background: '#E2E8F0',
                  color: '#94A3B8'
                }
              }}
            >
              Search
            </Button>

            <Button
              variant="outlined"
              onClick={handleSearchAll}
              disabled={loading}
              startIcon={<RefreshCw size={16} />}
              sx={{
                borderColor: '#0D9488',
                color: '#0D9488',
                borderRadius: '6px',
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '14px',
                '&:hover': {
                  borderColor: '#0F766E',
                  background: '#F0FDFA'
                },
                '&:disabled': {
                  borderColor: '#E2E8F0',
                  color: '#94A3B8'
                }
              }}
            >
              Load All
            </Button>
          </Box>
        </Paper>

        {/* ALERTS */}
        {error && (
          <Fade in>
            <Paper
              sx={{
                p: 3,
                mb: 3,
                bgcolor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px'
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <AlertCircle size={20} color="#DC2626" />
                <Typography sx={{ fontWeight: 600, color: '#DC2626', fontSize: '14px' }}>
                  {error}
                </Typography>
              </Box>
            </Paper>
          </Fade>
        )}

        {hasSearched && !loading && (
          <Fade in>
            <Paper
              sx={{
                p: 3,
                mb: 3,
                bgcolor: rows.length ? '#F0FDF4' : '#FEF2F2',
                border: `1px solid ${rows.length ? '#BBF7D0' : '#FECACA'}`,
                borderRadius: '8px'
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                {rows.length ? (
                  <CheckCircle size={20} color="#10B981" />
                ) : (
                  <AlertCircle size={20} color="#DC2626" />
                )}
                <Typography sx={{ fontWeight: 600, color: rows.length ? '#065F46' : '#DC2626', fontSize: '14px' }}>
                  {rows.length
                    ? `Found ${rows.length} client${rows.length !== 1 ? 's' : ''}`
                    : 'No clients found'}
                </Typography>
              </Box>
            </Paper>
          </Fade>
        )}

        {/* DATA GRID */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden'
          }}
        >
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20, 50]}
            disableSelectionOnClick
            autoHeight
            onRowClick={(params) => navigate(`/client/${params.id}`)}
            sx={{
              border: 'none',
              cursor: 'pointer',
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: '#F8FAFC',
                fontWeight: 600,
                fontSize: '14px',
                color: '#64748B',
                borderBottom: '1px solid #E2E8F0'
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #F1F5F9'
              },
              '& .MuiDataGrid-row:hover': {
                bgcolor: '#F8FAFC'
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: '1px solid #E2E8F0',
                bgcolor: '#F8FAFC'
              },
              '& .MuiTablePagination-root': {
                color: '#64748B'
              },
              '& .MuiDataGrid-selectedRowCount': {
                color: '#64748B'
              }
            }}
          />
        </Paper>
      </Box>
    </Box>
  );
}

export default ClientSearch;