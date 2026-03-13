import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    InputAdornment,
    Alert,
    IconButton,
    Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import { getClientPaymentAmounts, updateClientPaymentAmounts } from '../api';

function ClientPaymentSettings({ clientId, onUpdate }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [paymentAmounts, setPaymentAmounts] = useState([]);
    const [editedAmounts, setEditedAmounts] = useState({});
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleOpen = () => {
        setOpen(true);
        fetchAmounts();
    };

    const handleClose = () => {
        setOpen(false);
        setEditedAmounts({});
        setError(null);
        setSuccess(null);
    };

    const fetchAmounts = async () => {
        setLoading(true);
        try {
            const response = await getClientPaymentAmounts(clientId);
            setPaymentAmounts(response.data.payment_types);

            // Initialize edited amounts with current values
            const initialEdited = {};
            response.data.payment_types.forEach(pt => {
                initialEdited[pt.payment_type_id] = pt.applied_amount;
            });
            setEditedAmounts(initialEdited);
        } catch (err) {
            console.error('Error fetching payment amounts:', err);
            setError('Failed to load payment settings');
        } finally {
            setLoading(false);
        }
    };

    const handleAmountChange = (paymentTypeId, value) => {
        setEditedAmounts(prev => ({
            ...prev,
            [paymentTypeId]: value
        }));
    };

    const handleReset = (paymentTypeId, defaultAmount) => {
        setEditedAmounts(prev => ({
            ...prev,
            [paymentTypeId]: defaultAmount
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Validate and prepare data for API
            const updates = [];
            for (const [typeId, amountRaw] of Object.entries(editedAmounts)) {
                const amount = parseFloat(amountRaw);
                if (Number.isNaN(amount)) {
                    setError('Please enter valid numeric amounts for all payment types');
                    setLoading(false);
                    return;
                }
                if (amount < 0) {
                    setError('Amounts must be zero or positive');
                    setLoading(false);
                    return;
                }
                // keep payment_type_id as string (backend expects the id string)
                updates.push({ payment_type_id: String(typeId), custom_amount: amount });
            }

            await updateClientPaymentAmounts(clientId, updates);
            setSuccess('Payment amounts updated successfully');

            // Refresh data
            await fetchAmounts();

            // Notify parent component to refresh its data
            if (onUpdate) onUpdate();

            // Close after short delay
            setTimeout(() => {
                handleClose();
            }, 1500);

        } catch (err) {
            console.error('Error updating payment amounts:', err);
            setError('Failed to save changes. Please check your inputs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleOpen}
                sx={{ mt: 2 }}
            >
                Manage Payment Amounts
            </Button>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Client Payment Configuration</Typography>
                        <IconButton onClick={fetchAmounts} disabled={loading}>
                            <RefreshIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent dividers>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                    <Typography variant="body2" color="text.secondary" paragraph>
                        Adjust the required payment amounts for this specific client.
                        Default amounts are shown for reference.
                    </Typography>

                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell><strong>Payment Type</strong></TableCell>
                                    <TableCell><strong>Stage</strong></TableCell>
                                    <TableCell align="right"><strong>Default Amount</strong></TableCell>
                                    <TableCell align="right"><strong>Client Amount</strong></TableCell>
                                    <TableCell align="center"><strong>Actions</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paymentAmounts.map((pt) => (
                                    <TableRow key={pt.payment_type_id} hover>
                                        <TableCell>{pt.payment_name}</TableCell>
                                        <TableCell>{pt.stage_name}</TableCell>
                                        <TableCell align="right">
                                            GHS {pt.default_amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell align="right" sx={{ width: 180 }}>
                                            <TextField
                                                type="number"
                                                size="small"
                                                value={editedAmounts[pt.payment_type_id] || ''}
                                                onChange={(e) => handleAmountChange(pt.payment_type_id, e.target.value)}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start">GHS</InputAdornment>,
                                                }}
                                                sx={{
                                                    width: 150,
                                                    '& input': { textAlign: 'right' }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            {parseFloat(editedAmounts[pt.payment_type_id]) !== pt.default_amount && (
                                                <Tooltip title="Reset to Default">
                                                    <IconButton
                                                        size="small"
                                                        color="info"
                                                        onClick={() => handleReset(pt.payment_type_id, pt.default_amount)}
                                                    >
                                                        <RestoreIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>

                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={handleClose} color="inherit">Cancel</Button>
                    <Button
                        onClick={handleSave}
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default ClientPaymentSettings;
