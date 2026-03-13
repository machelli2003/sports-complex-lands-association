import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPayments, fetchClient, searchClients } from '../api';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { Print, ArrowBack } from '@mui/icons-material';

function ReceiptPrint() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const [payment, setPayment] = useState(null);
  const [client, setClient] = useState(null);
  const [receiptType, setReceiptType] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        // Try to get payment data from localStorage (stored when payment is added)
        const storedPayment = localStorage.getItem(`payment_${paymentId}`);
        if (storedPayment) {
          const paymentData = JSON.parse(storedPayment);
          setPayment(paymentData);
          // Fetch client data. Some codepaths stored a client name in `client_id` which
          // the API expects to be a numeric id. Try fetchClient first, then fall back
          // to a search by name if the call fails.
          try {
            const clientResponse = await fetchClient(paymentData.client_id);
            setClient(clientResponse.data);
          } catch (clientErr) {
            console.warn('fetchClient failed, trying searchClients fallback', clientErr);
            // If client_id looks like a name or lookup string, try searching clients
            try {
              const searchRes = await searchClients(paymentData.client_id, '', '');
              const found = Array.isArray(searchRes.data) && searchRes.data.length ? searchRes.data[0] : null;
              if (found) {
                setClient(found);
              } else if (paymentData.client) {
                // As a last resort, use client data embedded in the stored payment
                setClient(paymentData.client);
              } else {
                throw clientErr;
              }
            } catch (searchErr) {
              console.error('Client lookup failed:', searchErr);
              throw searchErr;
            }
          }
          setLoading(false);
          return;
        }

        // If not in localStorage, try to fetch from API
        // We'll need to fetch all payments for clients and find the one with matching payment_id
        // For now, show error if not found in localStorage
        setError('Payment data not found. Please go back and try printing from the payment list.');
      } catch (err) {
        console.error('Error loading payment:', err);
        setError('Failed to load payment data');
      } finally {
        setLoading(false);
      }
    };

    if (paymentId) {
      loadPaymentData();
    }
  }, [paymentId]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const numberToWords = (amount) => {
    // Simple number to words converter (you can enhance this)
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (amount === 0) return 'Zero';
    if (amount < 10) return ones[amount];
    if (amount < 20) return teens[amount - 10];
    if (amount < 100) return tens[Math.floor(amount / 10)] + (amount % 10 !== 0 ? ' ' + ones[amount % 10] : '');
    if (amount < 1000) return ones[Math.floor(amount / 100)] + ' Hundred' + (amount % 100 !== 0 ? ' ' + numberToWords(amount % 100) : '');
    if (amount < 1000000) return numberToWords(Math.floor(amount / 1000)) + ' Thousand' + (amount % 1000 !== 0 ? ' ' + numberToWords(amount % 1000) : '');
    return amount.toString();
  };

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    } else {
      window.print();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !payment || !client) {
    return (
      <Box p={3}>
        <Typography color="error">{error || 'Payment data not found'}</Typography>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  const receiptNumber = payment.receipt_number || '';
  const receiptDate = payment.payment_date ? formatDate(payment.payment_date) : formatDate(new Date());
  const nameOfAssociation = client.local_association?.association_name || client.full_name;
  const receivedFrom = client.full_name;
  const amountInWords = numberToWords(payment.amount) + ' Ghana Cedis';
  const paymentType = payment.payment_type || '';
  const paymentAmount = `GHS ${payment.amount.toFixed(2)}`;
  const paidBy = client.full_name;
  const receivedBy = 'Administrator'; // You can get this from User model

  // Map payment type to receipt fields
  const sitePlanValue = paymentType.toLowerCase().includes('site plan') || paymentType.toLowerCase().includes('siteplan') ? paymentAmount : '';
  const indentureValue = paymentType.toLowerCase().includes('indenture') ? paymentAmount : '';
  const pvlmdValue = paymentType.toLowerCase().includes('pvlmd') || paymentType.toLowerCase().includes('p.v.l.m.d') ? paymentAmount : '';
  const duesValue = paymentType.toLowerCase().includes('dues') ? paymentAmount : '';

  const date = payment.payment_date ? new Date(payment.payment_date) : new Date();
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);

  return (
    <Box sx={{ '@media print': { margin: 0, padding: 0 } }}>
      {/* Print Controls - Hidden when printing */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        gap: 2, 
        justifyContent: 'center',
        '@media print': { display: 'none' }
      }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
        <Button
          variant="contained"
          startIcon={<Print />}
          onClick={handlePrint}
          sx={{
            background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
          }}
        >
          Print / Save as PDF
        </Button>
        <Box>
          <label style={{ marginRight: 10 }}>Receipt Type:</label>
          <select 
            value={receiptType} 
            onChange={(e) => setReceiptType(Number(e.target.value))}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value={1}>Type 1 - Nii Boiman Sport Complex</option>
            <option value={2}>Type 2 - Boiman Asere's Sub Stool</option>
          </select>
        </Box>
      </Box>

      {/* Receipt Content - your original HTML/CSS in an iframe so it matches the design exactly */}
      <Box sx={{ 
        background: '#f5f5f5',
        p: 2,
        '@media print': { 
          margin: 0, 
          padding: 0,
          background: 'white'
        }
      }}>
        <iframe
          key={`receipt-${receiptType}-${paymentId}`}
          ref={iframeRef}
          srcDoc={receiptType === 1 
            ? generateReceipt1(receiptNumber, receiptDate, nameOfAssociation, amountInWords, paymentType, paymentAmount, paidBy, receivedBy, sitePlanValue, indentureValue, pvlmdValue, duesValue)
            : generateReceipt2(receiptNumber, receiptDate, receivedFrom, amountInWords, paymentType, paymentAmount, paidBy, receivedBy, sitePlanValue, indentureValue, pvlmdValue, duesValue, dd, mm, yy)
          }
          title="Receipt"
          style={{
            width: '100%',
            minHeight: '720px',
            border: '1px solid #ddd',
            background: 'white',
            borderRadius: '8px',
            display: 'block',
          }}
        />
      </Box>
    </Box>
  );
}

function ReceiptType1({ receiptNumber, receiptDate, nameOfAssociation, amountInWords, sitePlanValue, indentureValue, pvlmdValue, duesValue, paidBy, receivedBy }) {
  return (
    <Box sx={{
      position: 'relative',
      paddingLeft: '160px',
      minHeight: '650px',
      '@media print': {
        paddingLeft: '160px',
        minHeight: '650px'
      }
    }}>
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.5in;
          }
        }
      `}</style>
      
      {/* Sidebar */}
      <Box sx={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '150px',
        height: '100%',
        background: 'linear-gradient(180deg, #4a5fc1 0%, #3d4db7 100%)',
        border: '3px solid #2a3a9f',
        color: 'white',
        padding: '20px 15px',
        textAlign: 'center'
      }}>
        <Box sx={{ fontSize: '18px', fontWeight: 'bold', lineHeight: 1.3, marginBottom: '40px' }}>
          COMMITTEE<br/>OFFICIAL<br/>RECEIPT
        </Box>
        <Box sx={{ fontSize: '16px', fontWeight: 'bold', marginTop: '30px' }}>
          PAYMENT FOR
        </Box>
      </Box>
      
      {/* Main Content */}
      <Box>
        <Box sx={{ textAlign: 'center', marginBottom: '30px' }}>
          <Box sx={{ color: '#4a5fc1', fontSize: '26px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>
            NII BOIMAN SPORT COMPLEX<br/>LANDS REGULARIZATION ASSOCAITION
          </Box>
          <Box sx={{ color: '#4a5fc1', fontSize: '15px', marginBottom: '20px' }}>
            P.O. Box NB 688, Abeka -Accra. Telephone 0248 684 150
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '18px' }}>
          <Box component="span" sx={{ fontWeight: 'bold' }}>N° {receiptNumber || '_____________'}</Box>
          <Box component="span" sx={{ fontWeight: 'bold' }}>DATE: {receiptDate || '.............................'}</Box>
        </Box>

        <ReceiptField label="Name Of Association" value={nameOfAssociation} />
        <ReceiptField label="Amount In Words" value={amountInWords} />
        <ReceiptField label="Site Plan" value={sitePlanValue} />
        <ReceiptField label="Indenture" value={indentureValue} />
        <ReceiptField label="P.V.L.M.D" value={pvlmdValue} />
        <ReceiptField label="Dues" value={duesValue} />

        <Box sx={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
          <ReceiptField label="Paid By" value={paidBy} style={{ flex: 1, marginBottom: 0 }} labelStyle={{ minWidth: '100px' }} />
          <ReceiptField label="Received By" value={receivedBy} style={{ flex: 1, marginBottom: 0 }} labelStyle={{ minWidth: '120px' }} />
        </Box>
      </Box>
    </Box>
  );
}

function ReceiptField({ label, value, style = {}, labelStyle = {} }) {
  return (
    <Box sx={{ marginBottom: '18px', display: 'flex', alignItems: 'baseline', ...style }}>
      <Box sx={{ color: '#4a5fc1', fontWeight: 'bold', fontSize: '18px', minWidth: '240px', ...labelStyle }}>
        {label}
      </Box>
      <Box sx={{ flex: 1, borderBottom: '3px dotted #4a5fc1', minHeight: '28px', paddingBottom: '3px', fontSize: '17px' }}>
        {value || ''}
      </Box>
    </Box>
  );
}

function ReceiptType2({ receiptNumber, dd, mm, yy, receivedFrom, amountInWords, sitePlanValue, indentureValue, pvlmdValue, duesValue, paidBy, receivedBy }) {
  return (
    <Box sx={{
      position: 'relative',
      paddingLeft: '110px',
      minHeight: '650px',
      '@media print': {
        paddingLeft: '110px',
        minHeight: '650px'
      }
    }}>
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.5in;
          }
        }
      `}</style>
      
      {/* Eagle Logo */}
      <Box sx={{ position: 'absolute', left: '15px', top: '15px', width: '80px', height: '80px' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
          <path d="M50 10 L35 30 L25 25 L30 40 L20 45 L30 55 L25 70 L40 65 L50 80 L60 65 L75 70 L70 55 L80 45 L70 40 L75 25 L65 30 L50 10 Z M45 30 L50 20 L55 30 L50 40 Z M30 50 L40 45 L45 55 L35 60 Z M55 55 L60 45 L70 50 L65 60 Z M50 65 L45 70 L40 75 L50 85 L60 75 L55 70 Z" fill="black" stroke="black" strokeWidth="1"/>
        </svg>
      </Box>
      
      {/* Header */}
      <Box sx={{ textAlign: 'center', marginBottom: '30px' }}>
        <Box sx={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          BOIMAN ASERE'S SUB STOOL
        </Box>
        <Box sx={{ fontSize: '16px', marginBottom: '5px' }}>
          ASERE DIVISIONAL COUNCIL (KOTOPON GA STATE)
        </Box>
        <Box sx={{ fontSize: '14px', marginBottom: '20px' }}>
          P.O. Box NB 688, Nii Boiman Accra<br/>Tel: 0244 937 313 / 0201 919 669 / 0277 077 571
        </Box>
      </Box>

      {/* Receipt Title Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '12px', border: '3px solid black' }}>
        <Box sx={{ fontSize: '22px', fontWeight: 'bold' }}>Official Receipt</Box>
        <Box sx={{ fontSize: '18px' }}>N° {receiptNumber || '______'}</Box>
      </Box>

      {/* Date Box */}
      <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <DateField value={dd ? dd[0] : ''} />
        <DateField value={dd ? dd[1] : ''} />
        <Box sx={{ fontSize: '14px', fontWeight: 'bold' }}>DD</Box>
        <DateField value={mm ? mm[0] : ''} />
        <DateField value={mm ? mm[1] : ''} />
        <Box sx={{ fontSize: '14px', fontWeight: 'bold' }}>MM</Box>
        <DateField value={yy ? yy[0] : ''} />
        <DateField value={yy ? yy[1] : ''} />
        <Box sx={{ fontSize: '14px', fontWeight: 'bold' }}>YY</Box>
      </Box>

      <ReceiptField2 label="Received from:" value={receivedFrom} />
      <ReceiptField2 label="Amount in Words:" value={amountInWords} />
      <ReceiptField2 label="Site Plan:" value={sitePlanValue} />
      <ReceiptField2 label="Indenture:" value={indentureValue} />
      <ReceiptField2 label="P.V.L.M.D.:" value={pvlmdValue} />
      <ReceiptField2 label="Dues:" value={duesValue} />

      <Box sx={{ display: 'flex', gap: '30px' }}>
        <ReceiptField2 label="Paid By:" value={paidBy} style={{ flex: 1 }} />
        <ReceiptField2 label="Received By:" value={receivedBy} style={{ flex: 1 }} />
      </Box>
    </Box>
  );
}

function DateField({ value }) {
  return (
    <Box sx={{
      width: '40px',
      height: '35px',
      border: '3px solid black',
      textAlign: 'center',
      fontSize: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {value}
    </Box>
  );
}

function ReceiptField2({ label, value, style = {} }) {
  return (
    <Box sx={{ marginBottom: '20px', display: 'flex', alignItems: 'baseline', ...style }}>
      <Box sx={{ fontWeight: 'bold', fontSize: '18px', minWidth: '200px' }}>
        {label}
      </Box>
      <Box sx={{ flex: 1, borderBottom: '3px solid black', minHeight: '28px', paddingBottom: '3px', fontSize: '17px' }}>
        {value || ''}
      </Box>
    </Box>
  );
}

function generateReceipt1(receiptNumber, receiptDate, nameOfAssociation, amountInWords, paymentType, paymentAmount, paidBy, receivedBy, sitePlanValue, indentureValue, pvlmdValue, duesValue) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Official Receipt</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: Arial, sans-serif;
                background: white;
                padding: 20px;
            }

            .receipt-type-1 {
                position: relative;
                padding-left: 160px;
                min-height: 650px;
            }

            .receipt-type-1 .sidebar {
                position: absolute;
                left: 0;
                top: 0;
                width: 150px;
                height: 100%;
                background: linear-gradient(180deg, #4a5fc1 0%, #3d4db7 100%);
                border: 3px solid #2a3a9f;
                color: white;
                padding: 20px 15px;
                text-align: center;
            }

            .receipt-type-1 .sidebar-title {
                font-size: 18px;
                font-weight: bold;
                line-height: 1.3;
                margin-bottom: 40px;
            }

            .receipt-type-1 .sidebar-subtitle {
                font-size: 16px;
                font-weight: bold;
                margin-top: 30px;
            }

            .receipt-type-1 .receipt-header {
                text-align: center;
                margin-bottom: 30px;
            }

            .receipt-type-1 .org-name {
                color: #4a5fc1;
                font-size: 26px;
                font-weight: bold;
                margin-bottom: 8px;
                text-transform: uppercase;
            }

            .receipt-type-1 .contact-info {
                color: #4a5fc1;
                font-size: 15px;
                margin-bottom: 20px;
            }

            .receipt-type-1 .receipt-number {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                font-size: 18px;
            }

            .receipt-type-1 .receipt-number span {
                font-weight: bold;
            }

            .receipt-type-1 .field-row {
                margin-bottom: 18px;
                display: flex;
                align-items: baseline;
            }

            .receipt-type-1 .field-label {
                color: #4a5fc1;
                font-weight: bold;
                font-size: 18px;
                min-width: 240px;
            }

            .receipt-type-1 .field-value {
                flex: 1;
                border-bottom: 3px dotted #4a5fc1;
                min-height: 28px;
                padding-bottom: 3px;
                font-size: 17px;
            }

            @media print {
                @page {
                    size: landscape;
                    margin: 0.5in;
                }

                body {
                    background: white;
                    padding: 0;
                }
            }
        </style>
    </head>
    <body>
        <div class="receipt-type-1">
            <div class="sidebar">
                <div class="sidebar-title">COMMITTEE<br>OFFICIAL<br>RECEIPT</div>
                <div class="sidebar-subtitle">PAYMENT FOR</div>
            </div>
            
            <div class="receipt-header">
                <div class="org-name">NII BOIMAN SPORT COMPLEX<br>LANDS REGULARIZATION ASSOCAITION</div>
                <div class="contact-info">P.O. Box NB 688, Abeka -Accra. Telephone 0248 684 150</div>
            </div>

            <div class="receipt-number">
                <span>N° ${receiptNumber || '_____________'}</span>
                <span>DATE: ${receiptDate || '.............................'}</span>
            </div>

            <div class="field-row">
                <div class="field-label">Name Of Association</div>
                <div class="field-value">${nameOfAssociation || ''}</div>
            </div>

            <div class="field-row">
                <div class="field-label">Amount In Words</div>
                <div class="field-value">${amountInWords || ''}</div>
            </div>

            <div class="field-row">
                <div class="field-label">Site Plan</div>
                <div class="field-value">${sitePlanValue || ''}</div>
            </div>

            <div class="field-row">
                <div class="field-label">Indenture</div>
                <div class="field-value">${indentureValue || ''}</div>
            </div>

            <div class="field-row">
                <div class="field-label">P.V.L.M.D</div>
                <div class="field-value">${pvlmdValue || ''}</div>
            </div>

            <div class="field-row">
                <div class="field-label">Dues</div>
                <div class="field-value">${duesValue || ''}</div>
            </div>

            <div style="display: flex; gap: 30px; margin-top: 20px;">
                <div class="field-row" style="flex: 1; margin-bottom: 0;">
                    <div class="field-label" style="min-width: 100px;">Paid By</div>
                    <div class="field-value">${paidBy || ''}</div>
                </div>
                <div class="field-row" style="flex: 1; margin-bottom: 0;">
                    <div class="field-label" style="min-width: 120px;">Received By</div>
                    <div class="field-value">${receivedBy || ''}</div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generateReceipt2(receiptNumber, receiptDate, receivedFrom, amountInWords, paymentType, paymentAmount, paidBy, receivedBy, sitePlanValue, indentureValue, pvlmdValue, duesValue, dd, mm, yy) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Official Receipt</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: Arial, sans-serif;
                background: white;
                padding: 20px;
            }

            .receipt-type-2 {
                position: relative;
                padding-left: 110px;
                min-height: 650px;
            }

            .receipt-type-2 .eagle-logo {
                position: absolute;
                left: 15px;
                top: 15px;
                width: 80px;
                height: 80px;
            }

            .receipt-type-2 .receipt-header {
                text-align: center;
                margin-bottom: 30px;
            }

            .receipt-type-2 .org-name {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .receipt-type-2 .subtitle {
                font-size: 16px;
                margin-bottom: 5px;
            }

            .receipt-type-2 .contact-info {
                font-size: 14px;
                margin-bottom: 20px;
            }

            .receipt-type-2 .receipt-title-section {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 20px;
                padding: 12px;
                border: 3px solid black;
            }

            .receipt-type-2 .receipt-title {
                font-size: 22px;
                font-weight: bold;
            }

            .receipt-type-2 .receipt-number {
                font-size: 18px;
            }

            .receipt-type-2 .date-box {
                display: flex;
                gap: 8px;
                align-items: center;
                justify-content: flex-end;
                margin-bottom: 20px;
            }

            .receipt-type-2 .date-field {
                width: 40px;
                height: 35px;
                border: 3px solid black;
                text-align: center;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .receipt-type-2 .date-label {
                font-size: 14px;
                font-weight: bold;
            }

            .receipt-type-2 .field-row {
                margin-bottom: 20px;
                display: flex;
                align-items: baseline;
            }

            .receipt-type-2 .field-label {
                font-weight: bold;
                font-size: 18px;
                min-width: 200px;
            }

            .receipt-type-2 .field-value {
                flex: 1;
                border-bottom: 3px solid black;
                min-height: 28px;
                padding-bottom: 3px;
                font-size: 17px;
            }

            .receipt-type-2 .dual-field {
                display: flex;
                gap: 30px;
            }

            .receipt-type-2 .dual-field .field-row {
                flex: 1;
            }

            @media print {
                @page {
                    size: landscape;
                    margin: 0.5in;
                }

                body {
                    background: white;
                    padding: 0;
                }
            }
        </style>
    </head>
    <body>
        <div class="receipt-type-2">
            <div class="eagle-logo">
                <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                    <path d="M50 10 L35 30 L25 25 L30 40 L20 45 L30 55 L25 70 L40 65 L50 80 L60 65 L75 70 L70 55 L80 45 L70 40 L75 25 L65 30 L50 10 Z M45 30 L50 20 L55 30 L50 40 Z M30 50 L40 45 L45 55 L35 60 Z M55 55 L60 45 L70 50 L65 60 Z M50 65 L45 70 L40 75 L50 85 L60 75 L55 70 Z" fill="black" stroke="black" stroke-width="1"/>
                </svg>
            </div>
            
            <div class="receipt-header">
                <div class="org-name">BOIMAN ASERE'S SUB STOOL</div>
                <div class="subtitle">ASERE DIVISIONAL COUNCIL (KOTOPON GA STATE)</div>
                <div class="contact-info">P.O. Box NB 688, Nii Boiman Accra<br>Tel: 0244 937 313 / 0201 919 669 / 0277 077 571</div>
            </div>

            <div class="receipt-title-section">
                <div class="receipt-title">Official Receipt</div>
                <div class="receipt-number">N° ${receiptNumber || '______'}</div>
            </div>

            <div class="date-box">
                <div class="date-field">${dd ? dd[0] : ''}</div>
                <div class="date-field">${dd ? dd[1] : ''}</div>
                <div class="date-label">DD</div>
                <div class="date-field">${mm ? mm[0] : ''}</div>
                <div class="date-field">${mm ? mm[1] : ''}</div>
                <div class="date-label">MM</div>
                <div class="date-field">${yy ? yy[0] : ''}</div>
                <div class="date-field">${yy ? yy[1] : ''}</div>
                <div class="date-label">YY</div>
            </div>

            <div class="field-row">
                <div class="field-label">Received from:</div>
                <div class="field-value">${receivedFrom || ''}</div>
            </div>

            <div class="field-row">
                <div class="field-label">Amount in Words:</div>
                <div class="field-value">${amountInWords || ''}</div>
            </div>

            <div class="field-row">
                <div class="field-label">Site Plan:</div>
                <div class="field-value">${sitePlanValue || ''}</div>
            </div>

            <div class="field-row">
                <div class="field-label">Indenture:</div>
                <div class="field-value">${indentureValue || ''}</div>
            </div>

            <div class="field-row">
                <div class="field-label">P.V.L.M.D.:</div>
                <div class="field-value">${pvlmdValue || ''}</div>
            </div>

            <div class="field-row">
                <div class="field-label">Dues:</div>
                <div class="field-value">${duesValue || ''}</div>
            </div>

            <div class="dual-field">
                <div class="field-row">
                    <div class="field-label">Paid By:</div>
                    <div class="field-value">${paidBy || ''}</div>
                </div>
                <div class="field-row">
                    <div class="field-label">Received By:</div>
                    <div class="field-value">${receivedBy || ''}</div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

export default ReceiptPrint;