import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip
} from '@mui/material';
import { fetchClient, fetchPayments, getOutstandingBalance } from '../api';
import ClientPaymentSettings from '../components/ClientPaymentSettings';

function ClientProfile() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [payments, setPayments] = useState([]);
  const [outstandingBalance, setOutstandingBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [clientRes, paymentsRes, balanceRes] = await Promise.all([
        fetchClient(id),
        fetchPayments(id),
        getOutstandingBalance(id)
      ]);
      setClient(clientRes.data);
      setPayments(paymentsRes.data);
      setOutstandingBalance(balanceRes.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [id]); // eslint-disable-line

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 3
        }}
      >
        <CircularProgress sx={{ color: '#0D9488', mb: 3 }} />
        <Typography sx={{ fontWeight: 600, color: '#64748B' }}>Loading Client Profile...</Typography>
      </Box>
    );
  }

  if (!client) {
    return (
      <Box sx={{ minHeight: '100vh', background: '#F8FAFC', p: 4 }}>
        <Typography sx={{ color: '#EF4444', fontWeight: 600 }}>Client not found.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#F8FAFC' }}>

      {/* Header */}
      <Box
        sx={{
          px: { xs: 2, md: 4 },
          py: 3,
          mb: 4,
          borderBottom: '1px solid #E2E8F0',
          background: '#FFFFFF'
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography
              sx={{
                fontSize: { xs: '24px', md: '30px' },
                fontWeight: 600,
                color: '#1E293B',
                mb: 0.5
              }}
            >
              Client Profile
            </Typography>

            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '14px' }}>
              {client.full_name} • File #{client.file_number}
            </Typography>
          </Box>

          <ClientPaymentSettings clientId={id} onUpdate={fetchAll} />
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ px: { xs: 2, md: 4 }, pb: 4 }}>

        {/* Outstanding Summary */}
        {outstandingBalance && (
          <Grid container spacing={3} mb={4}>
            {[
              { label: 'Total Expected', value: outstandingBalance.total_expected },
              { label: 'Total Paid', value: outstandingBalance.total_paid },
              { label: 'Outstanding Balance', value: outstandingBalance.outstanding_balance }
            ].map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF'
                  }}
                >
                  <Typography sx={{ color: '#64748B', fontSize: '14px', fontWeight: 600, mb: 1 }}>
                    {item.label}
                  </Typography>

                  <Typography sx={{ fontSize: '24px', fontWeight: 600, color: '#1E293B' }}>
                    GHS {item.value?.toLocaleString() || 0}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Client Information */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            background: '#FFFFFF'
          }}
        >
          <Box sx={{ mb: 3, borderBottom: '1px solid #E2E8F0', pb: 2 }}>
            <Typography sx={{ fontSize: '20px', fontWeight: 600, color: '#1E293B' }}>
              Client Information
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Personal and registration details
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography sx={{ fontSize: '14px', color: '#64748B' }}>Phone</Typography>
              <Typography sx={{ fontWeight: 600 }}>{client.phone}</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography sx={{ fontSize: '14px', color: '#64748B' }}>Ghana Card</Typography>
              <Typography sx={{ fontWeight: 600 }}>{client.ghana_card_number}</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography sx={{ fontSize: '14px', color: '#64748B' }}>Status</Typography>
              <Chip
                label={client.status}
                size="small"
                sx={{
                  mt: 1,
                  background: '#F0FDFA',
                  color: '#0D9488',
                  fontWeight: 600,
                  fontSize: '12px'
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Payment History */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid #E2E8F0',
            mb: 4
          }}
        >
          <Box sx={{ p: 3, borderBottom: '1px solid #E2E8F0' }}>
            <Typography sx={{ fontWeight: 600, fontSize: '20px', color: '#1E293B' }}>
              Payment History
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              All recorded client payments
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, background: '#F8FAFC' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600, background: '#F8FAFC' }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600, background: '#F8FAFC' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, background: '#F8FAFC' }}>Receipt</TableCell>
                  <TableCell sx={{ fontWeight: 600, background: '#F8FAFC' }}>Status</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.payment_id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                    <TableCell>{payment.payment_type}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      GHS {payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{payment.payment_date}</TableCell>
                    <TableCell>{payment.receipt_number}</TableCell>
                    <TableCell>{payment.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

      </Box>
    </Box>
  );
}

export default ClientProfile;