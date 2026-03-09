import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Alert, CircularProgress, Chip, Divider } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import { Settings, Users, DollarSign, Layers, AlertCircle, CheckCircle } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser, fetchAssociations, createAssociation, updateAssociation, deleteAssociation, fetchStages, createStage, updateStage, deleteStage, fetchAllPaymentTypes, createPaymentType, updatePaymentType, deletePaymentType, getSettings, updateSettings, createBackup } from '../api';
import PasswordProtection from '../components/PasswordProtection';

function AdminPanel() {
  const [tab, setTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [associations, setAssociations] = useState([]);
  const [stages, setStages] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAssociations, setLoadingAssociations] = useState(false);
  const [loadingStages, setLoadingStages] = useState(false);
  const [loadingPaymentTypes, setLoadingPaymentTypes] = useState(false);
  const [userDialog, setUserDialog] = useState(false);
  const [associationDialog, setAssociationDialog] = useState(false);
  const [stageDialog, setStageDialog] = useState(false);
  const [paymentTypeDialog, setPaymentTypeDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingAssociation, setEditingAssociation] = useState(null);
  const [editingStage, setEditingStage] = useState(null);
  const [editingPaymentType, setEditingPaymentType] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userForm, setUserForm] = useState({
    username: '',
    full_name: '',
    role: 'staff',
    association_id: '',
    password: ''
  });
  const [associationForm, setAssociationForm] = useState({
    association_name: '',
    location: '',
    contact_person: '',
    phone: ''
  });
  const [stageForm, setStageForm] = useState({
    stage_number: '',
    stage_name: '',
    description: ''
  });
  const [paymentTypeForm, setPaymentTypeForm] = useState({
    stage_id: '',
    payment_name: '',
    default_amount: '',
    description: ''
  });
  const [settings, setSettings] = useState({
    system_name: '',
    reports_password: '',
    admin_password: '',
    documents_password: ''
  });
  const [loadingSettings, setLoadingSettings] = useState(false);

  useEffect(() => {
    if (tab === 0) {
      loadPaymentTypes();
      loadStages();
    } else if (tab === 1) {
      loadAssociations();
    } else if (tab === 2) {
      loadUsers();
    } else if (tab === 3) {
      loadSettings();
    }
  }, [tab]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users');
    }
    setLoading(false);
  };

  const loadSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await getSettings();
      setSettings(res.data);
    } catch (err) {
      console.error('Failed to load settings');
      setError('Failed to load settings');
    }
    setLoadingSettings(false);
  };

  const handleSaveSettings = async () => {
    setLoadingSettings(true);
    setError('');
    setSuccess('');
    try {
      await updateSettings(settings);
      setSuccess('Settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update settings');
      console.error('Failed to update settings');
    }
    setLoadingSettings(false);
  };

  const handleSaveUser = async () => {
    if (!editingUser && !userForm.password) {
      setError('Password is required for new users');
      return;
    }
    try {
      if (editingUser) {
        await updateUser(editingUser.user_id, userForm);
        setSuccess('User updated successfully!');
      } else {
        await createUser(userForm);
        setSuccess('User created successfully!');
      }
      setUserDialog(false);
      setUserForm({ username: '', full_name: '', role: 'staff', association_id: '', password: '' });
      setEditingUser(null);
      loadUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save user');
      console.error('Failed to save user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        setSuccess('User deleted successfully!');
        loadUsers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete user');
        console.error('Failed to delete user');
      }
    }
  };

  const loadAssociations = async () => {
    setLoadingAssociations(true);
    setError('');
    try {
      const res = await fetchAssociations();
      const associationsData = res.data?.data || res.data || [];
      setAssociations(associationsData);
    } catch (err) {
      setError('Failed to load associations');
      console.error('Failed to load associations:', err);
    }
    setLoadingAssociations(false);
  };

  const handleSaveAssociation = async () => {
    if (!associationForm.association_name.trim()) {
      setError('Association name is required');
      return;
    }
    setError('');
    setSuccess('');
    try {
      if (editingAssociation) {
        await updateAssociation(editingAssociation.association_id, associationForm);
        setSuccess('Association updated successfully!');
      } else {
        await createAssociation(associationForm);
        setSuccess('Association created successfully!');
      }
      setAssociationDialog(false);
      setAssociationForm({ association_name: '', location: '', contact_person: '', phone: '' });
      setEditingAssociation(null);
      loadAssociations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to save association';
      setError(errorMsg);
      console.error('Failed to save association:', err);
    }
  };

  const handleDeleteAssociation = async (associationId) => {
    if (window.confirm('Are you sure you want to delete this association? This action cannot be undone if it has clients.')) {
      try {
        await deleteAssociation(associationId);
        setSuccess('Association deleted successfully!');
        loadAssociations();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        const errorMsg = err.response?.data?.error || 'Failed to delete association';
        setError(errorMsg);
        console.error('Failed to delete association:', err);
      }
    }
  };

  const openAssociationDialog = (association = null) => {
    if (association) {
      setEditingAssociation(association);
      setAssociationForm({
        association_name: association.association_name || '',
        location: association.location || '',
        contact_person: association.contact_person || '',
        phone: association.phone || ''
      });
    } else {
      setEditingAssociation(null);
      setAssociationForm({ association_name: '', location: '', contact_person: '', phone: '' });
    }
    setError('');
    setSuccess('');
    setAssociationDialog(true);
  };

  const loadStages = async () => {
    setLoadingStages(true);
    setError('');
    try {
      const res = await fetchStages();
      setStages(res.data || []);
    } catch (err) {
      setError('Failed to load stages');
      console.error('Failed to load stages:', err);
    }
    setLoadingStages(false);
  };

  const loadPaymentTypes = async () => {
    setLoadingPaymentTypes(true);
    setError('');
    try {
      const res = await fetchAllPaymentTypes();
      const paymentTypesData = res.data?.data || res.data || [];
      setPaymentTypes(paymentTypesData);
    } catch (err) {
      setError('Failed to load payment types');
      console.error('Failed to load payment types:', err);
    }
    setLoadingPaymentTypes(false);
  };

  const handleSaveStage = async () => {
    if (!stageForm.stage_number || !stageForm.stage_name.trim()) {
      setError('Stage number and name are required');
      return;
    }
    setError('');
    setSuccess('');
    try {
      if (editingStage) {
        await updateStage(editingStage.stage_id, stageForm);
        setSuccess('Stage updated successfully!');
      } else {
        await createStage({
          ...stageForm,
          stage_number: parseInt(stageForm.stage_number)
        });
        setSuccess('Stage created successfully!');
      }
      setStageDialog(false);
      setStageForm({ stage_number: '', stage_name: '', description: '' });
      setEditingStage(null);
      loadStages();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to save stage';
      setError(errorMsg);
      console.error('Failed to save stage:', err);
    }
  };

  const handleDeleteStage = async (stageId) => {
    if (window.confirm('Are you sure you want to delete this stage? This will also delete associated payment types if any exist.')) {
      try {
        await deleteStage(stageId);
        setSuccess('Stage deleted successfully!');
        loadStages();
        loadPaymentTypes();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        const errorMsg = err.response?.data?.error || 'Failed to delete stage';
        setError(errorMsg);
        console.error('Failed to delete stage:', err);
      }
    }
  };

  const handleSavePaymentType = async () => {
    if (!paymentTypeForm.stage_id || !paymentTypeForm.payment_name.trim() || !paymentTypeForm.default_amount) {
      setError('Stage, payment name, and amount are required');
      return;
    }
    setError('');
    setSuccess('');
    try {
      if (editingPaymentType) {
        await updatePaymentType(editingPaymentType.payment_type_id, {
          ...paymentTypeForm,
          default_amount: parseFloat(paymentTypeForm.default_amount)
        });
        setSuccess('Payment type updated successfully!');
      } else {
        await createPaymentType({
          ...paymentTypeForm,
          default_amount: parseFloat(paymentTypeForm.default_amount)
        });
        setSuccess('Payment type created successfully!');
      }
      setPaymentTypeDialog(false);
      setPaymentTypeForm({ stage_id: '', payment_name: '', default_amount: '', description: '' });
      setEditingPaymentType(null);
      loadPaymentTypes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to save payment type';
      setError(errorMsg);
      console.error('Failed to save payment type:', err);
    }
  };

  const handleDeletePaymentType = async (paymentTypeId) => {
    if (window.confirm('Are you sure you want to delete this payment type? This cannot be undone if there are existing payments.')) {
      try {
        await deletePaymentType(paymentTypeId);
        setSuccess('Payment type deleted successfully!');
        loadPaymentTypes();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        const errorMsg = err.response?.data?.error || 'Failed to delete payment type';
        setError(errorMsg);
        console.error('Failed to delete payment type:', err);
      }
    }
  };

  const openStageDialog = (stage = null) => {
    if (stage) {
      setEditingStage(stage);
      setStageForm({
        stage_number: stage.stage_number?.toString() || '',
        stage_name: stage.stage_name || '',
        description: stage.description || ''
      });
    } else {
      setEditingStage(null);
      setStageForm({ stage_number: '', stage_name: '', description: '' });
    }
    setError('');
    setSuccess('');
    setStageDialog(true);
  };

  const openPaymentTypeDialog = (paymentType = null) => {
    if (paymentType) {
      setEditingPaymentType(paymentType);
      setPaymentTypeForm({
        stage_id: paymentType.stage_id?.toString() || '',
        payment_name: paymentType.payment_name || '',
        default_amount: paymentType.default_amount?.toString() || '',
        description: paymentType.description || ''
      });
    } else {
      setEditingPaymentType(null);
      setPaymentTypeForm({ stage_id: '', payment_name: '', default_amount: '', description: '' });
    }
    setError('');
    setSuccess('');
    setPaymentTypeDialog(true);
  };

  const openUserDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        association_id: user.association_id || '',
        password: ''
      });
    } else {
      setEditingUser(null);
      setUserForm({ username: '', full_name: '', role: 'staff', association_id: '', password: '' });
    }
    setUserDialog(true);
  };

  return (
    <PasswordProtection pageName="Admin Panel">
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
              <Settings size={20} color="white" />
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: { xs: '24px', md: '30px' },
                  fontWeight: 600,
                  color: '#1E293B'
                }}
              >
                Admin Panel
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#64748B',
                  fontSize: '14px'
                }}
              >
                Manage system settings and configurations
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ px: { xs: 2, md: 4 }, pb: 4 }}>
          {/* TABS */}
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden'
            }}
          >
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{
                borderBottom: '1px solid #E2E8F0',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#64748B',
                  minHeight: 56,
                  '&.Mui-selected': {
                    color: '#0D9488'
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#0D9488',
                  height: 3
                }
              }}
            >
              <Tab label="Payment Types" icon={<DollarSign size={18} />} iconPosition="start" />
              <Tab label="Associations" icon={<Users size={18} />} iconPosition="start" />
              <Tab label="Users" icon={<Users size={18} />} iconPosition="start" />
              <Tab label="Settings" icon={<Settings size={18} />} iconPosition="start" />
            </Tabs>
          </Paper>

          {/* ALERTS */}
          {success && (
            <Paper
              sx={{
                p: 3,
                mb: 3,
                bgcolor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px'
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <CheckCircle size={20} color="#10B981" />
                <Typography sx={{ fontWeight: 600, color: '#065F46', fontSize: '14px' }}>
                  {success}
                </Typography>
              </Box>
            </Paper>
          )}

          {error && (
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
          )}

          {/* TAB CONTENT */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '8px',
              border: '1px solid #E2E8F0'
            }}
          >
            {/* PAYMENT TYPES TAB */}
            {tab === 0 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#1E293B',
                        mb: 0.5
                      }}
                    >
                      Payment Types Management
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Configure payment types for different stages
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => openPaymentTypeDialog()}
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
                      }
                    }}
                  >
                    Add Payment Type
                  </Button>
                </Box>

                {loadingPaymentTypes ? (
                  <Box display="flex" justifyContent="center" alignItems="center" p={8}>
                    <CircularProgress sx={{ color: '#0D9488' }} />
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Payment Type</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Stage</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Default Amount (GHS)</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Description</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paymentTypes.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                              <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                                <DollarSign size={48} color="#CBD5E1" />
                                <Typography variant="h6" sx={{ color: '#64748B', fontWeight: 600 }}>
                                  No payment types found
                                </Typography>
                                <Typography sx={{ color: '#94A3B8', mb: 2, fontSize: '14px' }}>
                                  Click "Add Payment Type" to create your first payment type.
                                </Typography>
                                <Button
                                  variant="contained"
                                  startIcon={<AddIcon />}
                                  onClick={() => openPaymentTypeDialog()}
                                  sx={{
                                    background: '#0D9488',
                                    px: 4,
                                    py: 1.5,
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    borderRadius: '6px',
                                    '&:hover': {
                                      background: '#0F766E'
                                    }
                                  }}
                                >
                                  Add Your First Payment Type
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ) : (
                          paymentTypes.map((pt) => (
                            <TableRow key={pt.payment_type_id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                              <TableCell>
                                <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#1E293B' }}>
                                  {pt.payment_name}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={`Stage ${pt.stage_number}: ${pt.stage_name}`}
                                  size="small"
                                  sx={{
                                    background: '#F0FDFA',
                                    color: '#0D9488',
                                    fontWeight: 600,
                                    fontSize: '12px'
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#10B981' }}>
                                  GHS {pt.default_amount?.toLocaleString() || '0'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontSize: '14px', color: '#64748B' }}>
                                  {pt.description || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  onClick={() => openPaymentTypeDialog(pt)}
                                  size="small"
                                  sx={{ color: '#0D9488', mr: 1 }}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  onClick={() => handleDeletePaymentType(pt.payment_type_id)}
                                  size="small"
                                  sx={{ color: '#EF4444' }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {/* STAGES SECTION */}
                <Divider sx={{ my: 4 }} />

                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: '20px',
                          fontWeight: 600,
                          color: '#1E293B',
                          mb: 0.5
                        }}
                      >
                        Stages Management
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Configure workflow stages for client processing
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => openStageDialog()}
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
                        }
                      }}
                    >
                      Add Stage
                    </Button>
                  </Box>

                  {loadingStages ? (
                    <Box display="flex" justifyContent="center" alignItems="center" p={8}>
                      <CircularProgress sx={{ color: '#0D9488' }} />
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Stage Number</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Stage Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {stages.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                                  <Layers size={48} color="#CBD5E1" />
                                  <Typography sx={{ color: '#64748B', fontWeight: 600 }}>
                                    No stages found. Click "Add Stage" to create one.
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ) : (
                            stages.map((stage) => (
                              <TableRow key={stage.stage_id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                                <TableCell>
                                  <Chip
                                    label={stage.stage_number}
                                    size="small"
                                    sx={{
                                      background: '#F0FDFA',
                                      color: '#0D9488',
                                      fontWeight: 600,
                                      fontSize: '12px'
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#1E293B' }}>
                                    {stage.stage_name}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography sx={{ fontSize: '14px', color: '#64748B' }}>
                                    {stage.description || '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <IconButton
                                    onClick={() => openStageDialog(stage)}
                                    size="small"
                                    sx={{ color: '#0D9488', mr: 1 }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton
                                    onClick={() => handleDeleteStage(stage.stage_id)}
                                    size="small"
                                    sx={{ color: '#EF4444' }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </Box>
            )}

            {/* ASSOCIATIONS TAB */}
            {tab === 1 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#1E293B',
                        mb: 0.5
                      }}
                    >
                      Association Management
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Manage local associations and their details
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => openAssociationDialog()}
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
                      }
                    }}
                  >
                    Add Association
                  </Button>
                </Box>

                {loadingAssociations ? (
                  <Box display="flex" justifyContent="center" alignItems="center" p={8}>
                    <CircularProgress sx={{ color: '#0D9488' }} />
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Association Name</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Location</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Contact Person</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Phone</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {associations.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                              <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                                <Users size={48} color="#CBD5E1" />
                                <Typography variant="h6" sx={{ color: '#64748B', fontWeight: 600 }}>
                                  No associations found
                                </Typography>
                                <Typography sx={{ color: '#94A3B8', mb: 2, fontSize: '14px' }}>
                                  Click "Add Association" to create your first association.
                                </Typography>
                                <Button
                                  variant="contained"
                                  startIcon={<AddIcon />}
                                  onClick={() => openAssociationDialog()}
                                  sx={{
                                    background: '#0D9488',
                                    px: 4,
                                    py: 1.5,
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    borderRadius: '6px',
                                    '&:hover': {
                                      background: '#0F766E'
                                    }
                                  }}
                                >
                                  Add Your First Association
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ) : (
                          associations.map((assoc) => (
                            <TableRow key={assoc.association_id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                              <TableCell>
                                <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#1E293B' }}>
                                  {assoc.association_name}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontSize: '14px', color: '#64748B' }}>
                                  {assoc.location || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontSize: '14px', color: '#64748B' }}>
                                  {assoc.contact_person || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontSize: '14px', color: '#64748B' }}>
                                  {assoc.phone || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  onClick={() => openAssociationDialog(assoc)}
                                  size="small"
                                  sx={{ color: '#0D9488', mr: 1 }}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  onClick={() => handleDeleteAssociation(assoc.association_id)}
                                  size="small"
                                  sx={{ color: '#EF4444' }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {/* USERS TAB */}
            {tab === 2 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#1E293B',
                        mb: 0.5
                      }}
                    >
                      User Management
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Manage system users and their roles
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => openUserDialog()}
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
                      }
                    }}
                  >
                    Add User
                  </Button>
                </Box>

                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" p={8}>
                    <CircularProgress sx={{ color: '#0D9488' }} />
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Username</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Full Name</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Role</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '14px', color: '#64748B', background: '#F8FAFC' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                              <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                                <Users size={48} color="#CBD5E1" />
                                <Typography sx={{ color: '#64748B', fontWeight: 600 }}>
                                  No users found
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ) : (
                          users.map((user) => (
                            <TableRow key={user.user_id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                              <TableCell>
                                <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#1E293B' }}>
                                  {user.username}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontSize: '14px', color: '#64748B' }}>
                                  {user.full_name}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={user.role}
                                  size="small"
                                  sx={{
                                    background: user.role === 'admin' ? '#FEF3C7' : '#F0FDFA',
                                    color: user.role === 'admin' ? '#92400E' : '#0D9488',
                                    fontWeight: 600,
                                    fontSize: '12px',
                                    textTransform: 'capitalize'
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  onClick={() => openUserDialog(user)}
                                  size="small"
                                  sx={{ color: '#0D9488', mr: 1 }}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  onClick={() => handleDeleteUser(user.user_id)}
                                  size="small"
                                  sx={{ color: '#EF4444' }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            )}

            {/* SETTINGS TAB */}
            {tab === 3 && (
              <Box>
                <Box mb={3}>
                  <Typography
                    sx={{
                      fontSize: '20px',
                      fontWeight: 600,
                      color: '#1E293B',
                      mb: 0.5
                    }}
                  >
                    System Settings
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    Configure system-wide settings and security passwords
                  </Typography>
                </Box>

                {loadingSettings ? (
                  <Box display="flex" justifyContent="center" alignItems="center" p={8}>
                    <CircularProgress sx={{ color: '#0D9488' }} />
                  </Box>
                ) : (
                  <Box sx={{ maxWidth: 600 }}>
                    <TextField
                      fullWidth
                      label="System Name"
                      value={settings.system_name || ''}
                      onChange={(e) => setSettings({ ...settings, system_name: e.target.value })}
                      margin="normal"
                      sx={{ mb: 3 }}
                    />

                    <Divider sx={{ my: 3 }}>
                      <Chip label="Security Settings" size="small" />
                    </Divider>

                    <Typography variant="subtitle2" sx={{ mb: 2, color: '#64748B' }}>
                      Page Access Passwords
                    </Typography>

                    <TextField
                      fullWidth
                      type="password"
                      label="Dashboard Page Password"
                      value={settings.dashboard_password || ''}
                      onChange={(e) => setSettings({ ...settings, dashboard_password: e.target.value })}
                      margin="normal"
                      helperText="Password required to access the Dashboard"
                    />

                    <TextField
                      fullWidth
                      type="password"
                      label="Reports Page Password"
                      value={settings.reports_password || ''}
                      onChange={(e) => setSettings({ ...settings, reports_password: e.target.value })}
                      margin="normal"
                      helperText="Password required to access the Reports page"
                    />

                    <TextField
                      fullWidth
                      type="password"
                      label="Admin Panel Password"
                      value={settings.admin_password || ''}
                      onChange={(e) => setSettings({ ...settings, admin_password: e.target.value })}
                      margin="normal"
                      helperText="Password required to access the Admin Panel"
                    />

                    <TextField
                      fullWidth
                      type="password"
                      label="Documents Page Password"
                      value={settings.documents_password || ''}
                      onChange={(e) => setSettings({ ...settings, documents_password: e.target.value })}
                      margin="normal"
                      helperText="Password required to access the Documents page"
                    />

                    <Box mt={4}>
                      <Button
                        variant="contained"
                        onClick={handleSaveSettings}
                        size="large"
                        sx={{
                          background: '#0D9488',
                          px: 4,
                          fontWeight: 600,
                          textTransform: 'none',
                          '&:hover': {
                            background: '#0F766E'
                          }
                        }}
                      >
                        Save Settings
                      </Button>
                    </Box>

                    <Divider sx={{ my: 4 }}>
                      <Chip label="System Maintenance" size="small" color="error" variant="outlined" />
                    </Divider>

                    <Box sx={{ p: 3, border: '1px solid #FECACA', borderRadius: '8px', bgcolor: '#FEF2F2' }}>
                      <Typography variant="h6" sx={{ color: '#991B1B', mb: 1, fontSize: '16px', fontWeight: 600 }}>
                        Database Management
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#7F1D1D', mb: 3 }}>
                        Create a snapshot of the current database. Backups are stored on the server and can be used for recovery in case of data loss.
                      </Typography>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={async () => {
                          if (window.confirm('Trigger a manual database backup now?')) {
                            try {
                              setLoadingSettings(true);
                              const res = await createBackup();
                              setSuccess(res.data.message);
                              setTimeout(() => setSuccess(''), 5000);
                            } catch (err) {
                              setError('Failed to create backup');
                            } finally {
                              setLoadingSettings(false);
                            }
                          }
                        }}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: '6px'
                        }}
                      >
                        Create Manual Backup
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Box>
      </Box >


      {/* USER DIALOG */}
      < Dialog
        open={userDialog}
        onClose={() => setUserDialog(false)
        }
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>
          {editingUser ? 'Edit User' : 'Add User'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Username"
            value={userForm.username}
            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
            margin="normal"
            disabled={!!editingUser}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#0D9488'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0D9488'
              }
            }}
          />
          <TextField
            fullWidth
            label="Full Name"
            value={userForm.full_name}
            onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#0D9488'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0D9488'
              }
            }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel
              sx={{
                '&.Mui-focused': {
                  color: '#0D9488'
                }
              }}
            >
              Role
            </InputLabel>
            <Select
              value={userForm.role}
              label="Role"
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              sx={{
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#0D9488'
                }
              }}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="staff">Staff</MenuItem>
              <MenuItem value="viewer">Viewer</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Association ID (Optional)"
            value={userForm.association_id}
            onChange={(e) => setUserForm({ ...userForm, association_id: e.target.value })}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#0D9488'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0D9488'
              }
            }}
          />
          <TextField
            fullWidth
            label={editingUser ? "New Password (Optional)" : "Password"}
            type="password"
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            margin="normal"
            helperText={editingUser ? "Leave blank to keep current password" : "Required for new users"}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#0D9488'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0D9488'
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #E2E8F0' }}>
          <Button
            onClick={() => setUserDialog(false)}
            sx={{
              color: '#64748B',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveUser}
            variant="contained"
            sx={{
              background: '#0D9488',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                background: '#0F766E'
              }
            }}
          >
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog >

      {/* ASSOCIATION DIALOG */}
      < Dialog
        open={associationDialog}
        onClose={() => setAssociationDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>
          {editingAssociation ? 'Edit Association' : 'Add Association'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Association Name"
            value={associationForm.association_name}
            onChange={(e) => setAssociationForm({ ...associationForm, association_name: e.target.value })}
            margin="normal"
            required
            error={!associationForm.association_name.trim() && associationDialog}
            helperText={!associationForm.association_name.trim() && associationDialog ? 'Association name is required' : ''}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#0D9488'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0D9488'
              }
            }}
          />
          <TextField
            fullWidth
            label="Location"
            value={associationForm.location}
            onChange={(e) => setAssociationForm({ ...associationForm, location: e.target.value })}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#0D9488'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0D9488'
              }
            }}
          />
          <TextField
            fullWidth
            label="Contact Person"
            value={associationForm.contact_person}
            onChange={(e) => setAssociationForm({ ...associationForm, contact_person: e.target.value })}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#0D9488'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0D9488'
              }
            }}
          />
          <TextField
            fullWidth
            label="Phone"
            value={associationForm.phone}
            onChange={(e) => setAssociationForm({ ...associationForm, phone: e.target.value })}
            margin="normal"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#0D9488'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0D9488'
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #E2E8F0' }}>
          <Button
            onClick={() => setAssociationDialog(false)}
            sx={{
              color: '#64748B',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveAssociation}
            variant="contained"
            disabled={!associationForm.association_name.trim()}
            sx={{
              background: '#0D9488',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                background: '#0F766E'
              },
              '&:disabled': {
                background: '#E2E8F0',
                color: '#94A3B8'
              }
            }}
          >
            {editingAssociation ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog >

      {/* STAGE DIALOG */}
      < Dialog
        open={stageDialog}
        onClose={() => setStageDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>
          {editingStage ? 'Edit Stage' : 'Add Stage'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Stage Number"
            type="number"
            value={stageForm.stage_number}
            onChange={(e) => setStageForm({ ...stageForm, stage_number: e.target.value })}
            margin="normal"
            required
            helperText="The stage order/number (e.g., 1, 2, 3...)"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#0D9488'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0D9488'
              }
            }}
          />
          <TextField
            fullWidth
            label="Stage Name"
            value={stageForm.stage_name}
            onChange={(e) => setStageForm({ ...stageForm, stage_name: e.target.value })}
            margin="normal"
            required
            error={!stageForm.stage_name.trim() && stageDialog}
            helperText={!stageForm.stage_name.trim() && stageDialog ? 'Stage name is required' : ''}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#0D9488'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0D9488'
              }
            }}
          />
          <TextField
            fullWidth
            label="Description"
            value={stageForm.description}
            onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#0D9488'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0D9488'
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #E2E8F0' }}>
          <Button
            onClick={() => setStageDialog(false)}
            sx={{
              color: '#64748B',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveStage}
            variant="contained"
            disabled={!stageForm.stage_number || !stageForm.stage_name.trim()}
            sx={{
              background: '#0D9488',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                background: '#0F766E'
              },
              '&:disabled': {
                background: '#E2E8F0',
                color: '#94A3B8'
              }
            }}
          >
            {editingStage ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog >

      {/* PAYMENT TYPE DIALOG */}
      < Dialog
        open={paymentTypeDialog}
        onClose={() => setPaymentTypeDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#1E293B', borderBottom: '1px solid #E2E8F0' }}>
          {editingPaymentType ? 'Edit Payment Type' : 'Add Payment Type'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <FormControl
            fullWidth
            margin="normal"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#0D9488'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0D9488'
              }
            }}
          >
            <InputLabel>Stage</InputLabel>
            <Select
              value={paymentTypeForm.stage_id}
              onChange={(e) => setPaymentTypeForm({ ...paymentTypeForm, stage_id: e.target.value })}
              label="Stage"
            >
              <MenuItem value="">
                <em>Select Stage</em>
              </MenuItem>
              {stages.map((stage) => (
                <MenuItem key={stage.stage_id} value={stage.stage_id}>
                  Stage {stage.stage_number}: {stage.stage_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Payment Type Name"
            value={paymentTypeForm.payment_name}
            onChange={(e) => setPaymentTypeForm({ ...paymentTypeForm, payment_name: e.target.value })}
            margin="normal"
            required
            error={!paymentTypeForm.payment_name.trim() && paymentTypeDialog}
            helperText={!paymentTypeForm.payment_name.trim() && paymentTypeDialog ? 'Payment name is required' : 'e.g., Registration fee, Site plan, etc.'}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#0D9488'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0D9488'
              }
            }}
          />
          <TextField
            fullWidth
            label="Default Amount (GHS)"
            type="number"
            value={paymentTypeForm.default_amount}
            onChange={(e) => setPaymentTypeForm({ ...paymentTypeForm, default_amount: e.target.value })}
            margin="normal"
            required
            inputProps={{ step: '0.01', min: '0' }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#0D9488'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0D9488'
              }
            }}
          />
          <TextField
            fullWidth
            label="Description"
            value={paymentTypeForm.description}
            onChange={(e) => setPaymentTypeForm({ ...paymentTypeForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#0D9488'
                }
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#0D9488'
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #E2E8F0' }}>
          <Button
            onClick={() => setPaymentTypeDialog(false)}
            sx={{
              color: '#64748B',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSavePaymentType}
            variant="contained"
            disabled={!paymentTypeForm.stage_id || !paymentTypeForm.payment_name.trim() || !paymentTypeForm.default_amount}
            sx={{
              background: '#0D9488',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                background: '#0F766E'
              },
              '&:disabled': {
                background: '#E2E8F0',
                color: '#94A3B8'
              }
            }}
          >
            {editingPaymentType ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog >
    </PasswordProtection >
  );
}

export default AdminPanel;