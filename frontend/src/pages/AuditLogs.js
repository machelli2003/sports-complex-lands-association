import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    IconButton,
    Tooltip as MuiTooltip,
    TextField,
    MenuItem,
    Pagination
} from '@mui/material';
import { History, Search, Info, User, Activity } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../api';
import PasswordProtection from '../components/PasswordProtection';

function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ module: '', action: '' });

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE}/audit-logs`, {
                params: { ...filters, page, per_page: 20 }
            });
            setLogs(response.data.logs);
            setTotalPages(response.data.pages);
        } catch (err) {
            console.error('Failed to fetch audit logs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, filters]);

    const getActionColor = (action) => {
        switch (action) {
            case 'CREATE': return { bg: '#D1FAE5', text: '#065F46' };
            case 'UPDATE': return { bg: '#DBEAFE', text: '#1E40AF' };
            case 'DELETE': return { bg: '#FEE2E2', text: '#991B1B' };
            case 'LOGIN': return { bg: '#F3E8FF', text: '#6B21A8' };
            default: return { bg: '#F1F5F9', text: '#475569' };
        }
    };

    return (
        <PasswordProtection pageName="Audit Logs">
            <Box sx={{ minHeight: '100vh', background: '#F8FAFC', p: { xs: 2, md: 4 } }}>
                <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontSize: '30px', fontWeight: 600, color: '#1E293B', mb: 1 }}>
                            System Audit Logs
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748B', fontSize: '14px' }}>
                            Track every change and action performed in the system
                        </Typography>
                    </Box>
                </Box>

                <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <TextField
                        select
                        label="Module"
                        size="small"
                        value={filters.module}
                        onChange={(e) => { setFilters({ ...filters, module: e.target.value }); setPage(1); }}
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value="">All Modules</MenuItem>
                        <MenuItem value="Clients">Clients</MenuItem>
                        <MenuItem value="Payments">Payments</MenuItem>
                        <MenuItem value="Users">Users</MenuItem>
                        <MenuItem value="Documents">Documents</MenuItem>
                    </TextField>

                    <TextField
                        select
                        label="Action"
                        size="small"
                        value={filters.action}
                        onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(1); }}
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value="">All Actions</MenuItem>
                        <MenuItem value="CREATE">Create</MenuItem>
                        <MenuItem value="UPDATE">Update</MenuItem>
                        <MenuItem value="DELETE">Delete</MenuItem>
                        <MenuItem value="LOGIN">Login</MenuItem>
                    </TextField>
                </Paper>

                <Paper elevation={0} sx={{ borderRadius: '8px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ background: '#F8FAFC' }}>
                                    <TableCell sx={{ fontWeight: 600 }}>Timestamp</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Module</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>IP Address</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                            <CircularProgress size={30} sx={{ color: '#0D9488' }} />
                                        </TableCell>
                                    </TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                            <Typography sx={{ color: '#64748B' }}>No audit logs found</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => {
                                        const colors = getActionColor(log.action);
                                        return (
                                            <TableRow key={log.log_id} sx={{ '&:hover': { background: '#F8FAFC' } }}>
                                                <TableCell sx={{ fontSize: '13px', color: '#64748B' }}>
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <User size={14} color="#64748B" />
                                                        <Typography sx={{ fontSize: '14px', fontWeight: 600 }}>{log.user}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={log.action}
                                                        size="small"
                                                        sx={{ background: colors.bg, color: colors.text, fontWeight: 700, fontSize: '11px' }}
                                                    />
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '14px', fontWeight: 600 }}>{log.module}</TableCell>
                                                <TableCell sx={{ fontSize: '14px', color: '#1E293B', maxWidth: 400 }}>
                                                    {log.message}
                                                    {log.new_values && (
                                                        <MuiTooltip title={JSON.stringify(log.new_values, null, 2)}>
                                                            <IconButton size="small" sx={{ ml: 1 }}><Info size={14} /></IconButton>
                                                        </MuiTooltip>
                                                    )}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '12px', color: '#64748B' }}>{log.ip_address}</TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', borderTop: '1px solid #E2E8F0' }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(e, v) => setPage(v)}
                            color="primary"
                            sx={{ '& .Mui-selected': { background: '#0D9488 !important' } }}
                        />
                    </Box>
                </Paper>
            </Box>
        </PasswordProtection>
    );
}

export default AuditLogs;
