import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider
} from '@mui/material';

const PrintableRegistrationForm = ({ clientData, autoPrint = false }) => {

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const printForm = () => window.print();

  useEffect(() => {
    if (autoPrint) printForm();
  }, [autoPrint]);

  // Reusable Field Row
  const Field = ({ label, value }) => (
    <Box sx={{ mb: 2 }}>
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 0.5,
          color: '#444',
          textTransform: 'uppercase'
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 14,
          mt: 0.5,
          borderBottom: '1px solid #000',
          pb: 0.5,
          minHeight: 20
        }}
      >
        {value || 'N/A'}
      </Typography>
    </Box>
  );

  return (
    <>
      <style>
        {`
          @media print {
            nav, aside, header, footer,
            [class*="MuiDrawer"],
            [class*="MuiAppBar"],
            .no-print {
              display: none !important;
            }

            body * {
              visibility: hidden;
            }

            .print-form-container,
            .print-form-container * {
              visibility: visible !important;
            }

            .print-form-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }

            .print-form {
              box-shadow: none !important;
              border: 1px solid #000 !important;
            }

            @page {
              margin: 1cm;
              size: A4;
            }
          }
        `}
      </style>

      <Box className="print-form-container" sx={{ p: 2 }}>

        {!autoPrint && (
          <button
            onClick={printForm}
            className="no-print"
            style={{
              marginBottom: 20,
              padding: '10px 20px',
              background: '#000',
              color: '#fff',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Print Registration Form
          </button>
        )}

        <Paper
          className="print-form"
          sx={{
            p: 5,
            maxWidth: 800,
            mx: 'auto',
            bgcolor: '#fff'
          }}
        >

          {/* HEADER */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography sx={{ fontSize: 22, fontWeight: 700 }}>
              SPORTS COMPLEX
            </Typography>

            <Typography sx={{ fontSize: 16, letterSpacing: 1, mt: 1 }}>
              CLIENT REGISTRATION FORM
            </Typography>

            <Divider sx={{ mt: 2 }} />
          </Box>

          {/* PASSPORT */}
          <Grid container spacing={2} sx={{ mb: 2 }} alignItems="flex-start">
            <Grid item xs={8}>
              {/* header text left intentionally empty to keep layout */}
            </Grid>
            <Grid item xs={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{ width: 120, height: 150, border: '1px solid #000', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {clientData.passport_picture_preview ? (
                  <img
                    src={clientData.passport_picture_preview}
                    alt="Passport"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <Typography sx={{ fontSize: 10 }}>
                    PASSPORT PHOTO
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* META INFO */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={6}>
              <Field
                label="File Number"
                value={clientData.file_number}
              />
            </Grid>
            <Grid item xs={6}>
              <Field
                label="Registration Date"
                value={formatDate(clientData.registration_date)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 4 }} />

          {/* PERSONAL INFO */}
          <Typography sx={{ fontWeight: 700, mb: 3 }}>
            1. PERSONAL INFORMATION
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Field label="Full Name" value={clientData.full_name} />
            </Grid>
            <Grid item xs={6}>
              <Field
                label="Date of Birth"
                value={formatDate(clientData.date_of_birth)}
              />
            </Grid>
            <Grid item xs={6}>
              <Field
                label="Marital Status"
                value={
                  clientData.marital_status
                    ? clientData.marital_status.charAt(0).toUpperCase() +
                      clientData.marital_status.slice(1)
                    : 'N/A'
                }
              />
            </Grid>
            <Grid item xs={6}>
              <Field label="Phone Number" value={clientData.phone} />
            </Grid>
            <Grid item xs={6}>
              <Field
                label="Ghana Card Number"
                value={clientData.ghana_card_number}
              />
            </Grid>
            <Grid item xs={6}>
              <Field label="Hometown" value={clientData.hometown} />
            </Grid>
            <Grid item xs={6}>
              <Field
                label="Family Contact"
                value={clientData.family_member_number}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* ADDRESS */}
          <Typography sx={{ fontWeight: 700, mb: 3 }}>
            2. ADDRESS INFORMATION
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={6}>
              <Field label="House Number" value={clientData.house_number} />
            </Grid>
            <Grid item xs={6}>
              <Field label="Place of Stay" value={clientData.place_of_stay} />
            </Grid>
            <Grid item xs={12}>
              <Field label="GPS Address" value={clientData.gps_address} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* EMERGENCY */}
          <Typography sx={{ fontWeight: 700, mb: 3 }}>
            3. EMERGENCY CONTACT
          </Typography>

          <Field label="Next of Kin" value={clientData.next_of_kin} />

          <Divider sx={{ my: 4 }} />

          {/* ASSOCIATION */}
          <Typography sx={{ fontWeight: 700, mb: 3 }}>
            4. ASSOCIATION INFORMATION
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={6}>
              <Field
                label="Local Association ID"
                value={clientData.local_association_id}
              />
            </Grid>
            <Grid item xs={6}>
              <Field
                label="Current Stage"
                value={clientData.current_stage || '1'}
              />
            </Grid>
            <Grid item xs={6}>
              <Field
                label="Status"
                value={
                  clientData.status
                    ? clientData.status.charAt(0).toUpperCase() +
                      clientData.status.slice(1)
                    : 'Active'
                }
              />
            </Grid>
          </Grid>

          {/* FOOTER */}
          <Box sx={{ mt: 6, pt: 3, borderTop: '1px solid #000' }}>
            <Typography sx={{ fontSize: 12 }}>
              This document serves as official registration record for the Sports Complex.
            </Typography>

            <Typography sx={{ fontSize: 12, mt: 1 }}>
              Generated on:{' '}
              {new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </Typography>
          </Box>

        </Paper>
      </Box>
    </>
  );
};

export default PrintableRegistrationForm;
