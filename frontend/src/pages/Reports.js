import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, CircularProgress, Grid, Chip, LinearProgress } from '@mui/material';
import { TrendingUp, TrendingDown, Download, Calendar, CheckCircle, AlertCircle, BarChart as ChartIcon, PieChart as PieIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { getDailyRevenue, getPaymentTypesSummary, getOutstandingPayments, getCompletionAnalytics, exportDailyRevenue, exportClients, getTotalTransactions } from '../api';
import PasswordProtection from '../components/PasswordProtection';

function Reports() {
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [outstanding, setOutstanding] = useState([]);
  const [completion, setCompletion] = useState([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportLoading, setExportLoading] = useState({ revenue: false, clients: false });

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setLoading(true);
        const [revenueRes, paymentTypesRes, outstandingRes, completionRes, transactionsRes] = await Promise.all([
          getDailyRevenue(),
          getPaymentTypesSummary(),
          getOutstandingPayments(),
          getCompletionAnalytics(),
          getTotalTransactions()
        ]);

        setDailyRevenue(revenueRes.data);
        setPaymentTypes(paymentTypesRes.data);
        setOutstanding(outstandingRes.data);
        setCompletion(completionRes.data);
        setTotalTransactions(transactionsRes.data.total_transactions);
      } catch (err) {
        setError('Failed to load reports data');
        console.error('Reports error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportsData();
  }, []);

  const handleExportRevenue = async () => {
    try {
      setExportLoading({ ...exportLoading, revenue: true });
      const response = await exportDailyRevenue();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'daily_revenue.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export revenue data');
    } finally {
      setExportLoading({ ...exportLoading, revenue: false });
    }
  };

  const handleExportClients = async () => {
    try {
      setExportLoading({ ...exportLoading, clients: true });
      const response = await exportClients();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'clients.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export clients data');
    } finally {
      setExportLoading({ ...exportLoading, clients: false });
    }
  };

  const totalRevenue = dailyRevenue.reduce((sum, item) => sum + item.total, 0);
  const avgDailyRevenue = dailyRevenue.length > 0 ? totalRevenue / dailyRevenue.length : 0;
  const totalOutstanding = outstanding.reduce((sum, item) => sum + (item.outstanding_amount || item.amount || 0), 0);
  const totalPaymentTypes = paymentTypes.reduce((sum, item) => sum + item.total, 0);

  return (
    <PasswordProtection pageName="Reports">
      {loading ? (
        <Box sx={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 3 }}>
          <CircularProgress sx={{ color: '#0D9488', mb: 3 }} />
          <Typography sx={{ fontWeight: 600, color: '#64748B' }}>Loading Reports Data...</Typography>
        </Box>
      ) : error ? (
        <Box sx={{ minHeight: '100vh', background: '#F8FAFC', p: 3 }}>
          <Paper sx={{ p: 4, borderRadius: '8px', maxWidth: 600, mx: 'auto', mt: 8, textAlign: 'center', border: '1px solid #E2E8F0' }}>
            <AlertCircle size={64} color="#EF4444" style={{ marginBottom: 16 }} />
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: '#1E293B' }}>Error Loading Reports</Typography>
            <Typography sx={{ color: '#DC2626', mb: 3 }}>{error}</Typography>
            <Button variant="contained" onClick={() => window.location.reload()} sx={{ background: '#0D9488', '&:hover': { background: '#0F766E' } }}>
              Reload Page
            </Button>
          </Paper>
        </Box>
      ) : (
        <Box sx={{ minHeight: '100vh', background: '#F8FAFC', p: { xs: 2, md: 4 } }}>
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontSize: '30px', fontWeight: 600, color: '#1E293B', mb: 1 }}>
                Reports & Analytics
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', fontSize: '14px' }}>
                Comprehensive business insights and data exports
              </Typography>
            </Box>

            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                startIcon={exportLoading.revenue ? <CircularProgress size={18} color="inherit" /> : <Download size={18} />}
                onClick={handleExportRevenue}
                disabled={exportLoading.revenue}
                sx={{
                  background: '#0D9488',
                  borderRadius: '6px',
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '14px',
                  '&:hover': { background: '#0F766E' }
                }}
              >
                Export Revenue
              </Button>
              <Button
                variant="contained"
                startIcon={exportLoading.clients ? <CircularProgress size={18} color="inherit" /> : <Download size={18} />}
                onClick={handleExportClients}
                disabled={exportLoading.clients}
                sx={{
                  background: '#0D9488',
                  borderRadius: '6px',
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '14px',
                  '&:hover': { background: '#0F766E' }
                }}
              >
                Export Clients
              </Button>
            </Box>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography sx={{ color: '#64748B', fontSize: '14px', fontWeight: 600 }}>Total Revenue</Typography>
                  <TrendingUp size={20} color="#10B981" />
                </Box>
                <Typography sx={{ fontSize: '24px', fontWeight: 600, color: '#1E293B' }}>
                  GHS {totalRevenue.toLocaleString()}
                </Typography>
                <Chip label="+12.5%" size="small" sx={{ mt: 1, background: '#D1FAE5', color: '#065F46', fontWeight: 600, fontSize: '12px' }} />
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography sx={{ color: '#64748B', fontSize: '14px', fontWeight: 600 }}>Avg Daily Revenue</Typography>
                  <Calendar size={20} color="#0D9488" />
                </Box>
                <Typography sx={{ fontSize: '24px', fontWeight: 600, color: '#1E293B' }}>
                  GHS {Math.round(avgDailyRevenue).toLocaleString()}
                </Typography>
                <Chip label="7 days" size="small" sx={{ mt: 1, background: '#F0FDFA', color: '#0D9488', fontWeight: 600, fontSize: '12px' }} />
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography sx={{ color: '#64748B', fontSize: '14px', fontWeight: 600 }}>Outstanding</Typography>
                  <TrendingDown size={20} color="#F59E0B" />
                </Box>
                <Typography sx={{ fontSize: '24px', fontWeight: 600, color: '#1E293B' }}>
                  GHS {totalOutstanding.toLocaleString()}
                </Typography>
                <Chip label={`${outstanding.length} clients`} size="small" sx={{ mt: 1, background: '#FEF3C7', color: '#92400E', fontWeight: 600, fontSize: '12px' }} />
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography sx={{ color: '#64748B', fontSize: '14px', fontWeight: 600 }}>Total Transactions</Typography>
                  <CheckCircle size={20} color="#10B981" />
                </Box>
                <Typography sx={{ fontSize: '24px', fontWeight: 600, color: '#1E293B' }}>
                  {totalTransactions}
                </Typography>
                <Chip label="All time" size="small" sx={{ mt: 1, background: '#D1FAE5', color: '#065F46', fontWeight: 600, fontSize: '12px' }} />
              </Paper>
            </Grid>
          </Grid>

          {/* Charts Section */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} lg={8}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: '8px', border: '1px solid #E2E8F0', height: '100%' }}>
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B' }}>Revenue Trends</Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>Daily revenue performance over the last 30 days</Typography>
                  </Box>
                </Box>
                <Box sx={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyRevenue}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0D9488" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        hide={true}
                      />
                      <YAxis
                        stroke="#64748B"
                        fontSize={11}
                        tickFormatter={(value) => `GHS ${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
                      />
                      <Tooltip
                        contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                        formatter={(value) => [`GHS ${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Area type="monotone" dataKey="total" stroke="#0D9488" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: '8px', border: '1px solid #E2E8F0', height: '100%' }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B' }}>Revenue by Type</Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Breakdown of income streams</Typography>
                </Box>
                <Box sx={{ height: 300, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentTypes} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="payment_type" type="category" stroke="#1E293B" fontSize={11} width={80} />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                      />
                      <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                        {paymentTypes.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#0D9488', '#10B981', '#F59E0B', '#8B5CF6'][index % 4]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Tables Section */}
          <Grid container spacing={3}>
            {/* Daily Revenue */}
            <Grid item xs={12} lg={8}>
              <Paper elevation={0} sx={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid #E2E8F0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B', fontSize: '20px' }}>
                    Daily Revenue Report
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Last 7 days performance</Typography>
                </Box>

                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, background: '#F8FAFC', fontSize: '14px' }}>Date</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, background: '#F8FAFC', fontSize: '14px' }}>Total Revenue (GHS)</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, background: '#F8FAFC', fontSize: '14px' }}>Trend</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dailyRevenue.map((row, index) => {
                        const prevRevenue = index > 0 ? dailyRevenue[index - 1].total : row.total;
                        const isIncreasing = row.total > prevRevenue;
                        return (
                          <TableRow key={row.date} sx={{ '&:hover': { background: '#F8FAFC' } }}>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Calendar size={18} color="#0D9488" />
                                <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                                  {new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#1E293B' }}>
                                {row.total.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {index > 0 && (
                                <Chip
                                  icon={isIncreasing ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                  label={`${Math.abs(((row.total - prevRevenue) / prevRevenue * 100)).toFixed(1)}%`}
                                  size="small"
                                  sx={{
                                    fontWeight: 600,
                                    background: isIncreasing ? '#D1FAE5' : '#FEF3C7',
                                    color: isIncreasing ? '#065F46' : '#92400E',
                                    fontSize: '12px'
                                  }}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Payment Methods */}
            <Grid item xs={12} lg={4}>
              <Paper elevation={0} sx={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0', height: '100%' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid #E2E8F0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B', fontSize: '20px' }}>
                    Payment Methods
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Last 30 days breakdown</Typography>
                </Box>

                <Box sx={{ p: 3 }}>
                  {paymentTypes.map((row, index) => {
                    const percentage = (row.total / totalPaymentTypes * 100).toFixed(1);
                    const colors = ['#0D9488', '#10B981', '#F59E0B', '#8B5CF6'];
                    const color = colors[index % colors.length];

                    return (
                      <Box key={row.payment_type} sx={{ mb: 3 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
                            <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>{row.payment_type}</Typography>
                          </Box>
                          <Typography sx={{ fontWeight: 600, color: '#1E293B', fontSize: '14px' }}>
                            GHS {row.total.toLocaleString()}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={parseFloat(percentage)}
                          sx={{
                            height: 8,
                            borderRadius: '8px',
                            background: '#E2E8F0',
                            '& .MuiLinearProgress-bar': {
                              background: color,
                              borderRadius: '8px'
                            }
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#64748B', mt: 0.5, display: 'block' }}>
                          {percentage}% of total revenue
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            </Grid>

            {/* Outstanding Payments */}
            <Grid item xs={12} lg={7}>
              <Paper elevation={0} sx={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                <Box sx={{ p: 3, background: '#FEF3C7', borderBottom: '1px solid #FCD34D' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#78350F', fontSize: '20px' }}>
                    Outstanding Payments
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#92400E' }}>
                    {outstanding.length} clients with pending payments
                  </Typography>
                </Box>

                <TableContainer sx={{ maxHeight: 350 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, background: '#F8FAFC', fontSize: '14px' }}>Client</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, background: '#F8FAFC', fontSize: '14px' }}>Outstanding (GHS)</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, background: '#F8FAFC', fontSize: '14px' }}>Paid / Expected</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, background: '#F8FAFC', fontSize: '14px' }}>Stage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {outstanding.map((row) => (
                        <TableRow key={row.client_id || row.client} sx={{ '&:hover': { background: '#FFFBEB' } }}>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>{row.client}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontWeight: 600, color: '#EF4444', fontSize: '14px' }}>
                              GHS {(row.outstanding_amount || row.amount || 0).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '12px' }}>
                              GHS {(row.total_paid || 0).toLocaleString()} / GHS {(row.total_expected || 0).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={`Stage ${row.current_stage || 'N/A'}`} size="small" sx={{ background: '#F0FDFA', color: '#0D9488', fontWeight: 600, fontSize: '12px' }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Project Completion */}
            <Grid item xs={12} lg={5}>
              <Paper elevation={0} sx={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0', height: '100%' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid #E2E8F0' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B', fontSize: '20px' }}>
                    Project Completion
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Stage-wise progress tracking</Typography>
                </Box>

                <Box sx={{ p: 3 }}>
                  {completion.map((row, index) => {
                    const maxCompleted = Math.max(...completion.map(c => c.completed));
                    const percentage = (row.completed / maxCompleted * 100).toFixed(0);

                    return (
                      <Box key={row.stage} sx={{ mb: 3 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <CheckCircle size={20} color="#10B981" />
                            <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>{row.stage}</Typography>
                          </Box>
                          <Chip label={`${row.completed} projects`} size="small" sx={{ background: '#D1FAE5', color: '#065F46', fontWeight: 600, fontSize: '12px' }} />
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={parseFloat(percentage)}
                          sx={{
                            height: 10,
                            borderRadius: '8px',
                            background: '#E2E8F0',
                            '& .MuiLinearProgress-bar': {
                              background: '#0D9488',
                              borderRadius: '8px'
                            }
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#64748B', mt: 0.5, display: 'block' }}>
                          Relative completion: {percentage}%
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}
    </PasswordProtection>
  );
}

export default Reports;