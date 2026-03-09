import React, { useEffect, useState } from 'react';
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
  Avatar,
  IconButton,
  Chip
} from '@mui/material';
import {
  TrendingUp,
  Users,
  CheckCircle,
  DollarSign,
  AlertCircle,
  Settings,
  Calendar
} from 'lucide-react';
import { getDashboardData } from '../api';
import PasswordProtection from '../components/PasswordProtection';

function Dashboard() {
  const [data, setData] = useState({
    total_clients: 0,
    active_clients: 0,
    completed_clients: 0,
    stages: [],
    monthly_revenue: [],
    recent_payments: [],
    pending_payments_count: 0,
    total_revenue: 0,
    total_outstanding_balance: 0,
    clients_with_outstanding: 0,
    action_items: {
      pending_verifications: 0
    },
    financial_health: {
      this_month_revenue: 0,
      last_month_revenue: 0,
      performance_pct: 0
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getDashboardData();
        setData(res.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

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
        <Typography sx={{ fontWeight: 600, color: '#64748B' }}>Loading Dashboard...</Typography>
      </Box>
    );
  }

  const StatCard = ({ title, value, icon: Icon, subtitle, color = '#0D9488', chipLabel, chipColor }) => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        background: '#FFFFFF',
        transition: 'box-shadow 0.2s',
        '&:hover': {
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography
          variant="body2"
          sx={{
            color: '#64748B',
            fontWeight: 600,
            fontSize: '14px'
          }}
        >
          {title}
        </Typography>
        <Icon size={20} color={color} strokeWidth={2} />
      </Box>

      <Typography
        sx={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#1E293B',
          mb: 0.5
        }}
      >
        {value}
      </Typography>

      {subtitle && (
        <Typography
          variant="caption"
          sx={{ color: '#64748B', fontSize: '12px' }}
        >
          {subtitle}
        </Typography>
      )}

      {chipLabel && (
        <Chip
          label={chipLabel}
          size="small"
          sx={{
            mt: 1,
            background: chipColor?.bg || '#F0FDFA',
            color: chipColor?.text || '#0D9488',
            fontWeight: 600,
            fontSize: '12px'
          }}
        />
      )}
    </Paper>
  );

  return (
    <PasswordProtection pageName="Dashboard">
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
                Business Dashboard
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: '14px'
                }}
              >
                <Calendar size={14} />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
              <IconButton sx={{ color: '#64748B' }}>
                <Settings size={18} />
              </IconButton>
              <Avatar sx={{ width: 36, height: 36, bgcolor: '#0D9488' }}>A</Avatar>
            </Box>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ px: { xs: 2, md: 4 }, pb: 4 }}>

          {/* Stats Cards */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Clients"
                value={data.total_clients}
                icon={Users}
                color="#0D9488"
                chipLabel="All time"
                chipColor={{ bg: '#F0FDFA', text: '#0D9488' }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Active Clients"
                value={data.active_clients}
                icon={TrendingUp}
                color="#10B981"
                chipLabel="In progress"
                chipColor={{ bg: '#D1FAE5', text: '#065F46' }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Completed"
                value={data.completed_clients}
                icon={CheckCircle}
                color="#10B981"
                chipLabel="Projects"
                chipColor={{ bg: '#D1FAE5', text: '#065F46' }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Revenue"
                value={`GHS ${data.total_revenue.toLocaleString()}`}
                icon={DollarSign}
                color="#10B981"
                chipLabel={data.financial_health.performance_pct > 0 ? `+${data.financial_health.performance_pct.toFixed(1)}%` : `${data.financial_health.performance_pct.toFixed(1)}%`}
                chipColor={data.financial_health.performance_pct > 0 ? { bg: '#D1FAE5', text: '#065F46' } : { bg: '#FEE2E2', text: '#991B1B' }}
                subtitle={`GHS ${data.financial_health.this_month_revenue.toLocaleString()} this month`}
              />
            </Grid>
          </Grid>

          {/* Action Items & Financial Health Cards */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: '8px', border: '1px solid #E2E8F0', height: '100%', background: '#FFFFFF' }}>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <AlertCircle size={20} color="#0D9488" />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B', fontSize: '18px' }}>Staff Action Items</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, borderRadius: '8px', background: data.action_items.pending_verifications > 0 ? '#FEF2F2' : '#F0FDFA', border: '1px solid', borderColor: data.action_items.pending_verifications > 0 ? '#FCA5A5' : '#86EFAC' }}>
                      <Typography sx={{ color: '#64748B', fontSize: '13px', fontWeight: 600, mb: 1 }}>Pending Verifications</Typography>
                      <Typography sx={{ fontSize: '24px', fontWeight: 700, color: data.action_items.pending_verifications > 0 ? '#B91C1C' : '#0D9488' }}>
                        {data.action_items.pending_verifications}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>Documents needing review</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <Typography sx={{ color: '#64748B', fontSize: '13px', fontWeight: 600, mb: 1 }}>Monthly Progress</Typography>
                      <Typography sx={{ fontSize: '24px', fontWeight: 700, color: '#1E293B' }}>
                        {Math.round((data.completed_clients / (data.total_clients || 1)) * 100)}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>Overall completion rate</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: '8px', border: '1px solid #E2E8F0', height: '100%', background: '#FFFFFF' }}>
                <Box display="flex" alignItems="center" gap={1} mb={3}>
                  <TrendingUp size={20} color="#0D9488" />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B', fontSize: '18px' }}>Financial Health</Typography>
                </Box>
                <Box sx={{ p: 2, borderRadius: '8px', background: 'linear-gradient(135deg, #F0FDFA 0%, #E0F2F1 100%)', border: '1px solid #B2DFDB' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography sx={{ color: '#64748B', fontSize: '13px', fontWeight: 600 }}>This Month vs Last Month</Typography>
                      <Box display="flex" alignItems="baseline" gap={1}>
                        <Typography sx={{ fontSize: '24px', fontWeight: 700, color: '#0D9488' }}>GHS {data.financial_health.this_month_revenue.toLocaleString()}</Typography>
                        <Typography sx={{ fontSize: '14px', fontWeight: 600, color: data.financial_health.performance_pct > 0 ? '#059669' : '#DC2626' }}>
                          {data.financial_health.performance_pct > 0 ? '↑' : '↓'} {Math.abs(data.financial_health.performance_pct).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ color: '#64748B', fontSize: '12px' }}>Last Month</Typography>
                      <Typography sx={{ fontWeight: 600, color: '#475569' }}>GHS {data.financial_health.last_month_revenue.toLocaleString()}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Outstanding Notice */}
          {data.pending_payments_count > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 4,
                borderRadius: '8px',
                border: '1px solid #FCD34D',
                background: '#FEF3C7'
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                <AlertCircle size={20} color="#92400E" />
                <Typography sx={{ fontWeight: 600, color: '#92400E', fontSize: '14px' }}>
                  {data.pending_payments_count} Pending Payment
                  {data.pending_payments_count > 1 ? 's' : ''} •
                  GHS {data.total_outstanding_balance.toLocaleString()} Outstanding
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Clients by Stage */}
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
              <Typography
                sx={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#1E293B'
                }}
              >
                Clients by Stage
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Project distribution across workflow stages
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {data.stages.map((stage, idx) => (
                <Grid item xs={6} sm={4} md={3} lg={2} key={idx}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '8px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      transition: 'all 0.2s',
                      '&:hover': {
                        background: '#F0FDFA',
                        borderColor: '#0D9488'
                      }
                    }}
                  >
                    <Typography sx={{ color: '#64748B', fontSize: '14px', mb: 1, fontWeight: 600 }}>
                      {stage.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '24px',
                        fontWeight: 600,
                        color: '#1E293B'
                      }}
                    >
                      {stage.count}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Tables Section */}
          <Grid container spacing={3}>
            {/* Recent Payments */}
            <Grid item xs={12} lg={7}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #E2E8F0'
                }}
              >
                <Box sx={{ p: 3, borderBottom: '1px solid #E2E8F0' }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '20px', color: '#1E293B', mb: 0.5 }}>
                    Recent Payments
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Latest transactions and client payments
                  </Typography>
                </Box>

                <TableContainer sx={{ maxHeight: 450 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Client</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Stage</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {data.recent_payments.slice(0, 8).map((payment, idx) => (
                        <TableRow key={idx} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                          <TableCell sx={{ fontSize: '14px', fontWeight: 600 }}>{payment.client_name}</TableCell>
                          <TableCell sx={{ fontSize: '14px' }}>
                            <Chip
                              label={payment.payment_type}
                              size="small"
                              sx={{
                                background: '#F0FDFA',
                                color: '#0D9488',
                                fontWeight: 600,
                                fontSize: '12px'
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: '#10B981', fontWeight: 600, fontSize: '14px' }}>
                            GHS {payment.amount.toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ fontSize: '14px', color: '#64748B' }}>
                            {new Date(payment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </TableCell>
                          <TableCell sx={{ fontSize: '14px', color: '#64748B' }}>{payment.stage}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Monthly Revenue */}
            <Grid item xs={12} lg={5}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #E2E8F0',
                  height: '100%'
                }}
              >
                <Box sx={{ p: 3, borderBottom: '1px solid #E2E8F0' }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '20px', color: '#1E293B', mb: 0.5 }}>
                    Monthly Revenue
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Last 6 months performance
                  </Typography>
                </Box>

                <TableContainer sx={{ maxHeight: 450 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Month</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Revenue (GHS)</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {data.monthly_revenue.slice(-6).map((month, idx) => (
                        <TableRow key={idx} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Calendar size={16} color="#0D9488" />
                              <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>{month.month}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, fontSize: '14px', color: '#1E293B' }}>
                            {month.total.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>

        </Box>
      </Box>
    </PasswordProtection>
  );
}

export default Dashboard;