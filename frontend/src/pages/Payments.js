import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPayments, addPayment, fetchStages, fetchPaymentTypesByStage, fetchReceiptFile } from '../api';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  DollarSign,
  Search,
  Plus,
  Receipt,
  CreditCard,
  Smartphone,
  Building2,
  Banknote,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Printer,
  X,
  Download,
  Calendar
} from 'lucide-react';

function Payments() {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stages, setStages] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [paymentForm, setPaymentForm] = useState({
    client_id: '',
    stage_id: '',
    payment_type: '',
    amount: '',
    receipt_number: '',
    payment_method: 'cash',
    recorded_by: 1
  });
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [receiptPath, setReceiptPath] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState(null);

  useEffect(() => {
    const loadStages = async () => {
      try {
        const res = await fetchStages();
        setStages(res.data || []);
      } catch (err) {
        console.error('Failed to load stages', err);
      }
    };
    loadStages();
  }, []);

  const handleFetch = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchPayments(clientId);
      setRows(res.data.map((p, idx) => ({ id: p.payment_id, ...p })));
    } catch (err) {
      setError('Could not fetch payments');
    }
    setLoading(false);
  };

  const handleStageChange = async (stageId) => {
    const stageIdStr = stageId ? String(stageId) : '';
    setPaymentForm({ ...paymentForm, stage_id: stageIdStr, payment_type: '' });
    if (stageId) {
      try {
        const res = await fetchPaymentTypesByStage(stageId);
        const types = res.data.payment_types || [];
        setPaymentTypes(types);
        if (types.length === 0) {
          setAddError('No payment types available for this stage.');
        } else {
          setAddError('');
        }
      } catch (err) {
        console.error('Failed to load payment types', err);
        setPaymentTypes([]);
        setAddError('Failed to load payment types for this stage.');
      }
    } else {
      setPaymentTypes([]);
      setAddError('');
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');

    if (!paymentForm.client_id) {
      setAddError('Client ID or name is required');
      return;
    }
    if (!paymentForm.stage_id) {
      setAddError('Please select a stage');
      return;
    }
    if (!paymentForm.payment_type) {
      setAddError('Please select a payment type');
      return;
    }
    if (!paymentForm.amount) {
      setAddError('Amount is required');
      return;
    }
    if (!paymentForm.receipt_number) {
      setAddError('Receipt number is required');
      return;
    }
    if (parseFloat(paymentForm.amount) <= 0) {
      setAddError('Amount must be greater than 0');
      return;
    }

    try {
      // send client_identifier so backend can resolve by id, file_number, or full_name
      const response = await addPayment({
        ...paymentForm,
        amount: parseFloat(paymentForm.amount),
        client_identifier: paymentForm.client_id,
      });

      const paymentData = {
        payment_id: response.payment_id,
        client_id: paymentForm.client_id,
        receipt_number: paymentForm.receipt_number,
        payment_date: new Date().toISOString(),
        amount: parseFloat(paymentForm.amount),
        payment_type: paymentForm.payment_type,
        payment_method: paymentForm.payment_method || 'cash',
        status: 'paid'
      };
      localStorage.setItem(`payment_${response.payment_id}`, JSON.stringify(paymentData));

      setAddSuccess('Payment added successfully!');
      setShowReceiptModal(true);
      setReceiptPath(response.receipt_path || '');
      setCurrentPaymentId(response.payment_id);
      setPaymentForm({
        client_id: '',
        stage_id: '',
        payment_type: '',
        amount: '',
        receipt_number: '',
        payment_method: 'cash',
        recorded_by: 1
      });
      setPaymentTypes([]);
      setTimeout(() => setAddSuccess(''), 5000);

      if (clientId) {
        handleFetch();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to add payment.';
      setAddError(errorMessage);
    }
  };

  const getStatusColor = (status) => {
    return status === 'paid' ? '#10B981' : '#F59E0B';
  };

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'cash': return <Banknote size={16} />;
      case 'card': return <CreditCard size={16} />;
      case 'mobile_money': return <Smartphone size={16} />;
      case 'bank_transfer': return <Building2 size={16} />;
      default: return <DollarSign size={16} />;
    }
  };

  const columns = [
    {
      field: 'payment_id',
      headerName: 'ID',
      width: 90,
      renderCell: (params) => (
        <Chip
          label={`#${params.value}`}
          size="small"
          sx={{
            fontWeight: 600,
            background: '#F0FDFA',
            color: '#0D9488',
            fontSize: '12px'
          }}
        />
      )
    },
    {
      field: 'stage_id',
      headerName: 'Stage',
      width: 110,
      renderCell: (params) => (
        <Chip
          label={`Stage ${params.value}`}
          size="small"
          sx={{
            background: '#0D9488',
            color: 'white',
            fontWeight: 600,
            fontSize: '12px'
          }}
        />
      )
    },
    {
      field: 'payment_type',
      headerName: 'Type',
      width: 180,
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 600, color: '#1E293B', fontSize: '14px' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 150,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <DollarSign size={16} color="#10B981" strokeWidth={2.5} />
          <Typography sx={{ fontWeight: 600, color: '#10B981', fontSize: '14px' }}>
            GHS {params.value?.toLocaleString()}
          </Typography>
        </Box>
      )
    },
    {
      field: 'payment_date',
      headerName: 'Date',
      width: 200,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Calendar size={14} color="#64748B" />
          <Typography sx={{ color: '#475569', fontWeight: 500, fontSize: '14px' }}>
            {new Date(params.value).toLocaleString()}
          </Typography>
        </Box>
      )
    },
    {
      field: 'receipt_number',
      headerName: 'Receipt',
      width: 150,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <Receipt size={14} color="#64748B" />
          <Typography sx={{ fontWeight: 600, color: '#475569', fontSize: '14px' }}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'payment_method',
      headerName: 'Method',
      width: 150,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          {getPaymentMethodIcon(params.value)}
          <Typography sx={{ color: '#475569', fontWeight: 500, textTransform: 'capitalize', fontSize: '14px' }}>
            {params.value?.replace('_', ' ')}
          </Typography>
        </Box>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            bgcolor: params.value === 'paid' ? '#D1FAE5' : '#FEF3C7',
            color: params.value === 'paid' ? '#065F46' : '#92400E',
            fontWeight: 600,
            textTransform: 'capitalize',
            fontSize: '12px'
          }}
        />
      )
    },
    {
      field: 'print',
      headerName: 'Actions',
      width: 120,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          startIcon={<Printer size={14} />}
          onClick={() => navigate(`/receipt/${params.row.payment_id}`)}
          disabled={!params.row.receipt_number}
          sx={{
            borderRadius: '6px',
            textTransform: 'none',
            fontWeight: 600,
            borderColor: '#CBD5E1',
            color: '#475569',
            fontSize: '12px',
            '&:hover': {
              borderColor: '#0D9488',
              bgcolor: '#F0FDFA',
              color: '#0D9488'
            }
          }}
        >
          Print
        </Button>
      ),
    },
  ];

  const totalPaid = rows.filter(r => r.status === 'paid').reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalPending = rows.filter(r => r.status !== 'paid').reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalTransactions = rows.length;

  return (
    <Box sx={{ minHeight: '100vh', background: '#F8FAFC', p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontSize: '30px', fontWeight: 600, color: '#1E293B', mb: 1 }}>
          Payment Management
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', fontSize: '14px' }}>
          Track and manage all client payments
        </Typography>
      </Box>

      {/* Add Payment Button */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B', fontSize: '20px' }}>
          Payment Records
        </Typography>
        <Button
          variant="contained"
          startIcon={showAddForm ? <X size={20} /> : <Plus size={20} />}
          onClick={() => {
            setShowAddForm(!showAddForm);
            setAddError('');
            setAddSuccess('');
          }}
          sx={{
            background: showAddForm ? '#64748B' : '#0D9488',
            borderRadius: '6px',
            px: 3,
            py: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '14px',
            '&:hover': {
              background: showAddForm ? '#475569' : '#0F766E'
            }
          }}
        >
          {showAddForm ? 'Cancel' : 'Add New Payment'}
        </Button>
      </Box>

      {/* Add Payment Form */}
      {showAddForm && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            borderRadius: '8px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B', mb: 3, fontSize: '20px' }}>
            Add New Payment
          </Typography>

          <form onSubmit={handleAddPayment}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Client ID or Name"
                  value={paymentForm.client_id}
                  onChange={e => setPaymentForm({ ...paymentForm, client_id: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DollarSign size={18} color="#64748B" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Stage</InputLabel>
                  <Select
                    value={paymentForm.stage_id || ''}
                    label="Stage"
                    onChange={e => handleStageChange(e.target.value)}
                  >
                    <MenuItem value=""><em>Select a Stage</em></MenuItem>
                    {stages.map((stage) => (
                      <MenuItem key={stage.stage_id} value={stage.stage_id}>
                        Stage {stage.stage_number} - {stage.stage_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Payment Type</InputLabel>
                  <Select
                    value={paymentForm.payment_type || ''}
                    label="Payment Type"
                    onChange={e => setPaymentForm({ ...paymentForm, payment_type: e.target.value })}
                    disabled={!paymentForm.stage_id}
                  >
                    <MenuItem value="">
                      <em>{!paymentForm.stage_id ? 'Select a stage first' : 'Select a Payment Type'}</em>
                    </MenuItem>
                    {paymentTypes.map((type) => (
                      <MenuItem key={type.payment_type} value={type.payment_type}>
                        {type.payment_type}
                        {type.required_amount && ` (GHS ${type.required_amount.toLocaleString()})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography sx={{ fontWeight: 600, color: '#10B981', fontSize: '14px' }}>GHS</Typography>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Receipt Number"
                  value={paymentForm.receipt_number}
                  onChange={e => setPaymentForm({ ...paymentForm, receipt_number: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Receipt size={18} color="#64748B" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentForm.payment_method}
                    label="Payment Method"
                    onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="card">Card</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="mobile_money">Mobile Money</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {addError && (
              <Box sx={{ mt: 3, p: 2, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px' }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <AlertCircle size={20} color="#DC2626" />
                  <Typography sx={{ color: '#DC2626', fontWeight: 600, fontSize: '14px' }}>{addError}</Typography>
                </Box>
              </Box>
            )}

            {addSuccess && (
              <Box sx={{ mt: 3, p: 2, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px' }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircle size={20} color="#10B981" />
                  <Typography sx={{ color: '#166534', fontWeight: 600, fontSize: '14px' }}>{addSuccess}</Typography>
                </Box>
              </Box>
            )}

            <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => setShowAddForm(false)}
                sx={{
                  borderRadius: '6px',
                  px: 3,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#CBD5E1',
                  color: '#64748B',
                  fontSize: '14px'
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<CheckCircle size={20} />}
                sx={{
                  background: '#10B981',
                  borderRadius: '6px',
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '14px',
                  '&:hover': { background: '#059669' }
                }}
              >
                Add Payment
              </Button>
            </Box>
          </form>
        </Paper>
      )}

      {/* Search Section */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: '8px', background: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B', mb: 2, fontSize: '20px' }}>
          Search Payments
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            label="Client ID"
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            placeholder="Enter client ID..."
            sx={{ flex: 1, minWidth: '200px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color="#64748B" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<Search size={18} />}
            onClick={handleFetch}
            disabled={!clientId || loading}
            sx={{
              background: '#0D9488',
              borderRadius: '6px',
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '14px',
              '&:hover': { background: '#0F766E' }
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </Box>

        {error && (
          <Box sx={{ mt: 3, p: 2, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px' }}>
            <Typography sx={{ color: '#DC2626', fontWeight: 600, fontSize: '14px' }}>{error}</Typography>
          </Box>
        )}
      </Paper>

      {/* Stats Cards */}
      {rows.length > 0 && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                <Typography sx={{ color: '#64748B', fontSize: '14px', fontWeight: 600 }}>Total Paid</Typography>
                <TrendingUp size={20} color="#10B981" />
              </Box>
              <Typography sx={{ fontSize: '24px', fontWeight: 600, color: '#1E293B' }}>
                GHS {totalPaid.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                <Typography sx={{ color: '#64748B', fontSize: '14px', fontWeight: 600 }}>Total Pending</Typography>
                <TrendingDown size={20} color="#F59E0B" />
              </Box>
              <Typography sx={{ fontSize: '24px', fontWeight: 600, color: '#1E293B' }}>
                GHS {totalPending.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                <Typography sx={{ color: '#64748B', fontSize: '14px', fontWeight: 600 }}>Total Transactions</Typography>
                <Receipt size={20} color="#0D9488" />
              </Box>
              <Typography sx={{ fontSize: '24px', fontWeight: 600, color: '#1E293B' }}>
                {totalTransactions}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Data Grid */}
      <Paper elevation={0} sx={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
          disableSelectionOnClick
          autoHeight
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              background: '#F8FAFC',
              fontWeight: 600,
              fontSize: '14px'
            },
            '& .MuiDataGrid-cell': {
              borderColor: '#F1F5F9'
            },
            '& .MuiDataGrid-row:hover': {
              bgcolor: '#F8FAFC'
            }
          }}
        />
      </Paper>

      {/* Receipt Modal */}
      <Dialog open={showReceiptModal} onClose={() => setShowReceiptModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, fontSize: '20px', borderBottom: '1px solid #E2E8F0' }}>
          Payment Receipt Generated
        </DialogTitle>
        <DialogContent sx={{ pt: 4 }}>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircle size={48} color="#10B981" strokeWidth={2} style={{ marginBottom: 16 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B', mb: 1 }}>
              Payment Recorded Successfully!
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
              {receiptPath ? 'Your receipt has been generated and is ready to download.' : 'Payment was recorded successfully.'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2, justifyContent: 'center', borderTop: '1px solid #E2E8F0' }}>
          <Button
            onClick={() => setShowReceiptModal(false)}
            variant="outlined"
            sx={{
              borderRadius: '6px',
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#CBD5E1',
              color: '#64748B'
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<Printer size={18} />}
            onClick={() => {
              if (currentPaymentId) {
                navigate(`/receipt/${currentPaymentId}`);
              }
            }}
            sx={{
              background: '#0D9488',
              borderRadius: '6px',
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { background: '#0F766E' }
            }}
          >
            Print Receipt
          </Button>
          {receiptPath && (
            <Button
              variant="outlined"
              startIcon={<Download size={18} />}
              onClick={async () => {
                try {
                  const response = await fetchReceiptFile(currentPaymentId);
                  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `receipt_${currentPaymentId}.pdf`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(url);
                } catch (err) {
                  console.error('Failed to download receipt', err);
                }
              }}
              sx={{
                borderColor: '#10B981',
                color: '#10B981',
                borderRadius: '6px',
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Download PDF
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Payments;