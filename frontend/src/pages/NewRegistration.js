import React, { useState, useEffect } from 'react';
import { registerClient, fetchAssociations } from '../api';
import { Box, Typography, TextField, Button, Paper, Alert, Select, MenuItem, FormControl, InputLabel, Grid, InputAdornment, Stepper, Step, StepLabel } from '@mui/material';
import { UserPlus, FileText, Phone, CreditCard, Home, MapPin, Heart, Calendar, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import PrintableRegistrationForm from '../components/PrintableRegistrationForm';

function NewRegistration() {
  const [form, setForm] = useState({
    file_number: '',
    full_name: '',
    phone: '',
    ghana_card_number: '',
    local_association_id: '',
    house_number: '',
    gps_address: '',
    next_of_kin: '',
    passport_picture: null,
    marital_status: '',
    date_of_birth: '',
    hometown: '',
    place_of_stay: '',
    family_member_number: ''
  });

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPrintableForm, setShowPrintableForm] = useState(false);
  const [registeredClient, setRegisteredClient] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [associations, setAssociations] = useState([]);
  const [loadingAssociations, setLoadingAssociations] = useState(true);
  const [associationError, setAssociationError] = useState('');
  const [receiptPath, setReceiptPath] = useState(null);

  useEffect(() => {
    const loadAssociations = async () => {
      setLoadingAssociations(true);
      setAssociationError('');
      try {
        const response = await fetchAssociations();
        const associationsData = response.data?.data || response.data || [];
        if (associationsData.length > 0) {
          setAssociations(associationsData);
        } else {
          setAssociationError('No associations found. Please add associations in the admin panel.');
        }
      } catch (err) {
        console.error('Failed to load associations:', err);
        setAssociationError('Failed to load associations. Please refresh the page.');
      } finally {
        setLoadingAssociations(false);
      }
    };
    loadAssociations();
  }, []);

  const steps = ['Basic Information', 'Contact Details', 'Additional Information'];

  const handleChange = e => {
    let value = e.target.value;

    if (e.target.name === 'ghana_card_number') {
      value = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (value.startsWith('GHA')) {
        let numbers = value.replace('GHA', '').replace(/-/g, '').replace(/[^0-9]/g, '');
        if (numbers.length > 10) numbers = numbers.slice(0, 10);
        if (numbers.length > 0) {
          if (numbers.length <= 9) {
            value = `GHA-${numbers}`;
          } else {
            value = `GHA-${numbers.slice(0, 9)}-${numbers.slice(9)}`;
          }
        } else {
          value = 'GHA-';
        }
      } else if (value.length > 0 && !value.startsWith('GHA')) {
        let numbers = value.replace(/[^0-9]/g, '');
        if (numbers.length > 0) {
          if (numbers.length <= 9) {
            value = `GHA-${numbers}`;
          } else {
            value = `GHA-${numbers.slice(0, 9)}-${numbers.slice(9)}`;
          }
        } else {
          value = 'GHA-';
        }
      }
      if (value.length > 15) value = value.slice(0, 15);
    }

    if (e.target.name === 'phone' || e.target.name === 'family_member_number') {
      value = value.replace(/[^0-9+\s]/g, '');
    }

    setForm({ ...form, [e.target.name]: value });
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, passport_picture: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackToForm = () => {
    setShowPrintableForm(false);
    setRegisteredClient(null);
    setError('');
    setActiveStep(0);
  };

  const handleSubmit = async e => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Ensure every text input across all steps is filled
    const isFormComplete = () => {
      const requiredKeys = [
        'file_number', 'full_name', 'phone', 'ghana_card_number', 'local_association_id',
        'house_number', 'gps_address', 'next_of_kin', 'marital_status', 'date_of_birth',
        'hometown', 'place_of_stay', 'family_member_number'
      ];
      return requiredKeys.every(k => {
        const v = form[k];
        return v !== null && v !== undefined && String(v).trim() !== '';
      });
    };

    if (!isFormComplete()) {
      setError('Please fill all fields in Basic Information, Contact Details, and Additional Information before registering.');
      setLoading(false);
      return;
    }

    if (!form.file_number.trim()) {
      setError('File number is required');
      setLoading(false);
      return;
    }

    if (!form.full_name.trim()) {
      setError('Full name is required');
      setLoading(false);
      return;
    }

    if (!form.local_association_id) {
      setError('Local association ID is required');
      setLoading(false);
      return;
    }

    if (form.phone && !/^(\+233|0)[0-9]{9}$/.test(form.phone.replace(/\s/g, ''))) {
      setError('Please enter a valid Ghana phone number');
      setLoading(false);
      return;
    }

    if (form.ghana_card_number && !/^GHA-[0-9]{9}-[0-9]$/.test(form.ghana_card_number.toUpperCase())) {
      setError('Please enter a valid Ghana Card number (e.g., GHA-123456789-0)');
      setLoading(false);
      return;
    }

    try {
      const response = await registerClient(form);
      const clientData = {
        ...form,
        client_id: response.data.client_id,
        registration_date: new Date().toISOString(),
        current_stage: 1,
        status: 'active',
        passport_picture: response.data.passport_picture || (previewUrl ? 'preview' : null),
        passport_picture_preview: previewUrl
      };

      setRegisteredClient(clientData);
      setShowPrintableForm(true);
      setSuccess('Client registered successfully!');

      setForm({
        file_number: '',
        full_name: '',
        phone: '',
        ghana_card_number: '',
        local_association_id: '',
        house_number: '',
        gps_address: '',
        next_of_kin: '',
        passport_picture: null,
        marital_status: '',
        date_of_birth: '',
        hometown: '',
        place_of_stay: '',
        family_member_number: ''
      });
      setPreviewUrl(null);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(errorMessage);
    }
    setLoading(false);
  };

  const validateStep = (step) => {
    // Step 0 validations
    if (step === 0) {
      if (!form.file_number.trim()) {
        setError('File number is required');
        return false;
      }
      if (!form.full_name.trim()) {
        setError('Full name is required');
        return false;
      }
      if (!form.local_association_id) {
        setError('Local association is required');
        return false;
      }
    }

    // Step 1 validations (optional fields but validate formats if present)
    if (step === 1) {
      if (form.phone && !/^(\\+233|0)[0-9]{9}$/.test(form.phone.replace(/\s/g, ''))) {
        setError('Please enter a valid Ghana phone number');
        return false;
      }
      if (form.ghana_card_number && !/^GHA-[0-9]{9}-[0-9]$/.test(form.ghana_card_number.toUpperCase())) {
        setError('Please enter a valid Ghana Card number (e.g., GHA-123456789-0)');
        return false;
      }
    }

    // Step 2 has no required fields by default
    setError('');
    return true;
  };

  const isFormValid = () => {
    // Global required fields
    if (!form.file_number.trim() || !form.full_name.trim() || !form.local_association_id) return false;
    if (form.phone && !/^(\\+233|0)[0-9]{9}$/.test(form.phone.replace(/\s/g, ''))) return false;
    if (form.ghana_card_number && !/^GHA-[0-9]{9}-[0-9]$/.test(form.ghana_card_number.toUpperCase())) return false;
    return true;
  }

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="File Number"
                name="file_number"
                fullWidth
                value={form.file_number}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FileText size={20} color="#64748B" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Full Name"
                name="full_name"
                fullWidth
                value={form.full_name}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <UserPlus size={20} color="#64748B" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required disabled={loadingAssociations}>
                <InputLabel>Local Association</InputLabel>
                <Select
                  name="local_association_id"
                  value={form.local_association_id}
                  onChange={handleChange}
                  label="Local Association"
                >
                  <MenuItem value="">
                    <em>{loadingAssociations ? 'Loading associations...' : 'Select Association'}</em>
                  </MenuItem>
                  {associations.length === 0 && !loadingAssociations && (
                    <MenuItem value="" disabled>
                      <em>{associationError || 'No associations available'}</em>
                    </MenuItem>
                  )}
                  {associations.map((assoc) => (
                    <MenuItem key={assoc.association_id} value={assoc.association_id}>
                      {assoc.association_name} {assoc.location ? `- ${assoc.location}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Phone Number"
                name="phone"
                fullWidth
                value={form.phone}
                onChange={handleChange}
                placeholder="+233 XX XXX XXXX"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone size={20} color="#64748B" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Ghana Card Number"
                name="ghana_card_number"
                fullWidth
                value={form.ghana_card_number}
                onChange={handleChange}
                placeholder="GHA-123456789-0"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CreditCard size={20} color="#64748B" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="House Number"
                name="house_number"
                fullWidth
                value={form.house_number}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Home size={20} color="#64748B" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="GPS Address"
                name="gps_address"
                fullWidth
                value={form.gps_address}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MapPin size={20} color="#64748B" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Next of Kin"
                name="next_of_kin"
                fullWidth
                value={form.next_of_kin}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Heart size={20} color="#64748B" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Family Member Contact"
                name="family_member_number"
                fullWidth
                value={form.family_member_number}
                onChange={handleChange}
                placeholder="+233 XX XXX XXXX"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone size={20} color="#64748B" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Marital Status</InputLabel>
                <Select
                  name="marital_status"
                  value={form.marital_status}
                  onChange={handleChange}
                  label="Marital Status"
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  <MenuItem value="single">Single</MenuItem>
                  <MenuItem value="married">Married</MenuItem>
                  <MenuItem value="divorced">Divorced</MenuItem>
                  <MenuItem value="widowed">Widowed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                fullWidth
                value={form.date_of_birth}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Calendar size={20} color="#64748B" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Hometown"
                name="hometown"
                fullWidth
                value={form.hometown}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Home size={20} color="#64748B" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Place of Stay"
                name="place_of_stay"
                fullWidth
                value={form.place_of_stay}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MapPin size={20} color="#64748B" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '8px',
                  border: '2px dashed #CBD5E1',
                  background: '#F8FAFC',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '160px',
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: '#94A3B8'
                  }
                }}
              >
                <input
                  accept="image/*"
                  type="file"
                  id="passport-input"
                  hidden
                  onChange={handleFileChange}
                />
                <label htmlFor="passport-input" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '140px', objectFit: 'contain', borderRadius: '8px' }} />
                  ) : (
                    <Box>
                      <Upload size={40} style={{ color: '#94A3B8', marginBottom: '8px' }} />
                      <Typography sx={{ color: '#475569', fontWeight: 500, fontSize: '14px' }}>
                        Click to upload passport picture
                      </Typography>
                    </Box>
                  )}
                </label>
              </Paper>
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return showPrintableForm ? (
    <PrintableRegistrationForm
      clientData={registeredClient}
      onBackToForm={handleBackToForm}
      receiptPath={receiptPath}
    />
  ) : (
    <Box sx={{ minHeight: '100vh', background: '#F8FAFC', p: { xs: 2, md: 4 } }}>
      <Box mb={4}>
        <Typography variant="h4" sx={{ fontSize: '30px', fontWeight: 600, color: '#1E293B', mb: 1 }}>
          New Client Registration
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', fontSize: '14px' }}>
          Register a new client with their complete information
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: '8px',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0'
        }}
      >
        <Stepper
          activeStep={activeStep}
          sx={{
            mb: 4,
            '& .MuiStepLabel-root .Mui-completed': {
              color: '#10B981'
            },
            '& .MuiStepLabel-root .Mui-active': {
              color: '#0D9488'
            }
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

                <form onSubmit={(e) => {
          // prevent default form submit; submission handled by button click
          e.preventDefault();
        }} onKeyDown={(e) => {
          if (e.key === 'Enter') {
            // Prevent Enter from submitting the form in all cases
            e.preventDefault();
            // If not on final step, validate and advance
            if (activeStep < steps.length - 1) {
              const ok = validateStep(activeStep);
              if (ok) setActiveStep(prev => prev + 1);
            }
          }
        }}>
          {getStepContent(activeStep)}

          {error && (
            <Alert
              severity="error"
              icon={<AlertCircle size={20} />}
              sx={{ mt: 3, borderRadius: '8px' }}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert
              severity="success"
              icon={<CheckCircle size={20} />}
              sx={{ mt: 3, borderRadius: '8px' }}
            >
              {success}
            </Alert>
          )}

          <Box display="flex" justifyContent="space-between" mt={4} gap={2}>
            <Button
              onClick={() => setActiveStep(prev => prev - 1)}
              disabled={activeStep === 0}
              sx={{
                borderRadius: '6px',
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                color: '#64748B',
                fontSize: '14px'
              }}
            >
              Back
            </Button>

            <Box display="flex" gap={2}>
              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={() => {
                    const ok = validateStep(activeStep);
                    if (ok) setActiveStep(prev => prev + 1);
                  }}
                  sx={{
                    background: '#0D9488',
                    borderRadius: '6px',
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '14px',
                    '&:hover': {
                      background: '#0F766E'
                    }
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? null : <CheckCircle size={20} />}
                  sx={{
                    background: '#10B981',
                    borderRadius: '6px',
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '14px',
                    '&:hover': {
                      background: '#059669'
                    },
                    '&:disabled': {
                      background: '#CBD5E1'
                    }
                  }}
                >
                  {loading ? 'Registering...' : 'Register Client'}
                </Button>
              )}
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}

export default NewRegistration;