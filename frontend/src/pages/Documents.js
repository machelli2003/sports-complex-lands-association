import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Chip, CircularProgress, Tabs, Tab, Grid, InputAdornment } from '@mui/material';
import { Upload as UploadIcon, Download as DownloadIcon, CheckCircle as CheckCircleIcon, Description as FileText, Article as Template, Visibility as Eye, Edit, Search, CloudUpload, InsertDriveFile } from '@mui/icons-material';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { fetchClients, fetchDocuments, addDocument, verifyDocument, downloadDocument, searchClients } from '../api';
import PasswordProtection from '../components/PasswordProtection';

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState('');
  const [uploadDialog, setUploadDialog] = useState(false);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [printDialog, setPrintDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [printTemplate, setPrintTemplate] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  const [documentForm, setDocumentForm] = useState({
    client_id: '',
    document_type: '',
    notes: ''
  });

  const [templateForm, setTemplateForm] = useState({
    name: '',
    content: '',
    category: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const savedTemplates = localStorage.getItem('letterTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }

    const loadClients = async () => {
      try {
        const response = await fetchClients();
        setClients(response.data || []);
      } catch (err) {
        console.error('Failed to load clients:', err);
      }
    };
    loadClients();
  }, []);

  useEffect(() => {
    localStorage.setItem('letterTemplates', JSON.stringify(templates));
  }, [templates]);

  const documentTypes = [
    'Ghana Card',
    'Indenture',
    'Physical Planning',
    'Payment Receipts',
    'Signed Leaseholds',
    'Site Plan',
    'Filled forms',
    'Authority Letter',
    'Other'
  ];

  const templateCategories = [
    'Authority Letter',
    'Payment Reminder',
    'Signed Leasehold Letter',
    'Physical Planning Letter',
    'Notice Letter',
    'Submission of Documents Letter',
    'Bank Statement Request Letter',
    'Chief Summon Letter',
    'Other'
  ];

  const handleFetchDocuments = async () => {
    if (!clientId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetchDocuments(clientId);
      setDocuments(res.data);
    } catch (err) {
      // Try resolving by client name (fallback)
      try {
        const searchRes = await searchClients(clientId, '', '');
        const hits = searchRes.data?.data || searchRes.data || [];
        if (Array.isArray(hits) && hits.length === 1) {
          const resolvedId = hits[0].client_id || hits[0].id;
          const res2 = await fetchDocuments(resolvedId);
          setDocuments(res2.data);
        } else if (Array.isArray(hits) && hits.length > 1) {
          setError('Multiple clients found; please refine the query or enter the client ID.');
          setDocuments([]);
        } else {
          setError('Failed to fetch documents. Please check the client ID or name.');
          setDocuments([]);
        }
      } catch (e2) {
        setError('Failed to fetch documents. Please check the client ID or name.');
        setDocuments([]);
      }
    }
    setLoading(false);
  };

  const handleUploadDocument = async () => {
    if (!documentForm.client_id || !documentForm.document_type) {
      setError('Client ID or name and document type are required');
      return;
    }
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setError('');
    try {
      // Resolve client id if a name was provided
      let clientIdToUse = documentForm.client_id;
      if (isNaN(Number(clientIdToUse))) {
        // try local clients cache first
        const matches = clients.filter(c => ((c.full_name || c.client_name || c.client || '') + '').toLowerCase().includes(clientIdToUse.toLowerCase()));
        if (matches.length === 1) {
          clientIdToUse = matches[0].client_id || matches[0].id;
        } else {
          // fallback to search API
          const sr = await searchClients(clientIdToUse, '', '');
          const hits = sr.data?.data || sr.data || [];
          if (Array.isArray(hits) && hits.length === 1) {
            clientIdToUse = hits[0].client_id || hits[0].id;
          } else {
            setError('Could not resolve client; please enter exact client ID or full name');
            return;
          }
        }
      }

      const formData = new FormData();
      formData.append('client_id', clientIdToUse);
      formData.append('document_type', documentForm.document_type);
      formData.append('notes', documentForm.notes || '');
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await addDocument(formData);
      setSuccess('Document uploaded successfully!');
      setUploadDialog(false);
      setDocumentForm({ client_id: '', document_type: '', notes: '' });
      setSelectedFile(null);

      if (clientId === documentForm.client_id) {
        handleFetchDocuments();
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to upload document. Please try again.');
    }
  };

  const handleDownload = async (documentId) => {
    try {
      const response = await downloadDocument(documentId);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = `document_${documentId}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('Document downloaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to download document. Please try again.');
    }
  };

  const handleVerify = async (documentId) => {
    try {
      await verifyDocument(documentId);
      setSuccess('Document verified successfully!');
      if (clientId) {
        handleFetchDocuments();
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to verify document');
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name || !templateForm.content) {
      setError('Template name and content are required');
      return;
    }

    setError('');
    try {
      const newTemplate = {
        id: Date.now(),
        ...templateForm,
        created_at: new Date().toISOString()
      };

      setTemplates([...templates, newTemplate]);
      setSuccess('Template created successfully!');
      setTemplateDialog(false);
      setTemplateForm({ name: '', content: '', category: '' });

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to create template. Please try again.');
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      content: template.content,
      category: template.category
    });
    setEditDialog(true);
  };

  const handleUpdateTemplate = () => {
    if (!templateForm.name || !templateForm.content) {
      setError('Template name and content are required');
      return;
    }

    setError('');
    try {
      const updatedTemplates = templates.map(t =>
        t.id === editingTemplate.id
          ? { ...t, ...templateForm, updated_at: new Date().toISOString() }
          : t
      );

      setTemplates(updatedTemplates);
      setSuccess('Template updated successfully!');
      setEditDialog(false);
      setEditingTemplate(null);
      setTemplateForm({ name: '', content: '', category: '' });

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update template. Please try again.');
    }
  };

  const handlePreviewTemplate = (template) => {
    setPreviewTemplate(template);
    setPreviewDialog(true);
  };

  const handlePrintTemplate = (template) => {
    setPrintTemplate(template);
    setPrintDialog(true);
  };

  const replaceTemplateVariables = (content, client = null) => {
    if (!content) return '';

    let replaced = content;
    const today = new Date();

    replaced = replaced.replace(/{date}/g, today.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    replaced = replaced.replace(/{current_date}/g, today.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    replaced = replaced.replace(/{today}/g, today.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    replaced = replaced.replace(/{full_date}/g, today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

    if (client) {
      replaced = replaced.replace(/{client_name}/g, client.full_name || 'N/A');
      replaced = replaced.replace(/{client_full_name}/g, client.full_name || 'N/A');
      replaced = replaced.replace(/{file_number}/g, client.file_number || 'N/A');
      replaced = replaced.replace(/{client_id}/g, client.client_id || 'N/A');
      replaced = replaced.replace(/{phone}/g, client.phone || 'N/A');
      replaced = replaced.replace(/{ghana_card}/g, client.ghana_card_number || 'N/A');
      replaced = replaced.replace(/{house_number}/g, client.house_number || 'N/A');
      replaced = replaced.replace(/{gps_address}/g, client.gps_address || 'N/A');
      replaced = replaced.replace(/{hometown}/g, client.hometown || 'N/A');
      replaced = replaced.replace(/{place_of_stay}/g, client.place_of_stay || 'N/A');
      replaced = replaced.replace(/{next_of_kin}/g, client.next_of_kin || 'N/A');
      replaced = replaced.replace(/{current_stage}/g, client.current_stage || 'N/A');
    } else {
      replaced = replaced.replace(/{client_name}/g, '[Client Name]');
      replaced = replaced.replace(/{client_full_name}/g, '[Client Full Name]');
      replaced = replaced.replace(/{file_number}/g, '[File Number]');
      replaced = replaced.replace(/{client_id}/g, '[Client ID]');
      replaced = replaced.replace(/{phone}/g, '[Phone Number]');
      replaced = replaced.replace(/{ghana_card}/g, '[Ghana Card Number]');
      replaced = replaced.replace(/{house_number}/g, '[House Number]');
      replaced = replaced.replace(/{gps_address}/g, '[GPS Address]');
      replaced = replaced.replace(/{hometown}/g, '[Hometown]');
      replaced = replaced.replace(/{place_of_stay}/g, '[Place of Stay]');
      replaced = replaced.replace(/{next_of_kin}/g, '[Next of Kin]');
      replaced = replaced.replace(/{current_stage}/g, '[Current Stage]');
    }

    return replaced;
  };

  const handleExportToWord = async () => {
    if (!printTemplate) return;

    const content = replaceTemplateVariables(printTemplate.content, selectedClient || null);
    const lines = content.split(/\n/);

    const paragraphs = lines.map((line) =>
      new Paragraph({
        children: [new TextRun({ text: line || ' ', size: 24 })],
        spacing: { after: 120 }
      })
    );

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: printTemplate.name, bold: true, size: 28 })],
            spacing: { after: 240 }
          }),
          ...paragraphs
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const clientPart = selectedClient ? `_${(selectedClient.full_name || 'client').replace(/[^a-z0-9]/gi, '_')}` : '';
    const filename = `${(printTemplate.name || 'Letter').replace(/[^a-z0-9]/gi, '_')}${clientPart}.docx`;

    saveAs(blob, filename);

    setSuccess('Word document downloaded. Open in Word to edit or print.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handlePrint = () => {
    if (!selectedClient || !printTemplate) {
      setError('Please select a client to print the template');
      return;
    }

    const content = replaceTemplateVariables(printTemplate.content, selectedClient);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${printTemplate.name}</title>
          <style>
            @media print {
              @page {
                margin: 2cm;
              }
            }
            body {
              font-family: 'Times New Roman', serif;
              font-size: 12pt;
              line-height: 1.6;
              max-width: 21cm;
              margin: 0 auto;
              padding: 2cm;
              color: #000;
            }
            .header {
              text-align: center;
              margin-bottom: 2cm;
              border-bottom: 2px solid #000;
              padding-bottom: 1cm;
            }
            .content {
              white-space: pre-wrap;
              text-align: justify;
            }
            .footer {
              margin-top: 2cm;
              text-align: right;
              font-size: 10pt;
            }
          </style>
        </head>
        <body>
          <div class="content">${content.replace(/\n/g, '<br>')}</div>
        </body>
      </html>
    `);

    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <PasswordProtection pageName="Documents">
      <Box sx={{ minHeight: '100vh', background: '#F8FAFC', p: { xs: 2, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontSize: '30px', fontWeight: 600, color: '#1E293B', mb: 1 }}>
            Document Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', fontSize: '14px' }}>
            Manage client documents and letter templates
          </Typography>
        </Box>

        {/* Success/Error Messages */}
        {success && (
          <Paper sx={{ mb: 3, p: 2, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px' }}>
            <Box display="flex" alignItems="center" gap={1}>
              <CheckCircleIcon sx={{ color: '#10B981' }} />
              <Typography sx={{ fontWeight: 600, color: '#166534', fontSize: '14px' }}>{success}</Typography>
            </Box>
          </Paper>
        )}

        {error && !uploadDialog && !templateDialog && (
          <Paper sx={{ mb: 3, p: 2, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px' }}>
            <Typography sx={{ fontWeight: 600, color: '#DC2626', fontSize: '14px' }}>{error}</Typography>
          </Paper>
        )}

        {/* Main Content */}
        <Paper sx={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: '#E2E8F0',
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '14px',
                textTransform: 'none',
                minHeight: 64
              },
              '& .Mui-selected': {
                color: '#0D9488'
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#0D9488',
                height: 2
              }
            }}
          >
            <Tab icon={<FileText />} label="Client Documents" iconPosition="start" />
            <Tab icon={<Template />} label="Letter Templates" iconPosition="start" />
          </Tabs>

          <Box sx={{ p: { xs: 2, md: 4 } }}>
            {tabValue === 0 && (
              <Box>
                {/* Search Section */}
                <Paper sx={{ p: 3, mb: 3, borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1E293B', fontSize: '20px' }}>
                    Search Client Documents
                  </Typography>
                  <Box display="flex" gap={2} flexWrap="wrap">
                    <TextField
                      label="Client ID or Name"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      size="medium"
                      sx={{ flex: 1, minWidth: '200px' }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search sx={{ color: '#64748B' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleFetchDocuments}
                      disabled={!clientId || loading}
                      sx={{
                        borderRadius: '6px',
                        px: 4,
                        py: 1.5,
                        background: '#0D9488',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '14px',
                        '&:hover': { background: '#0F766E' }
                      }}
                    >
                      {loading ? 'Searching...' : 'Search'}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CloudUpload />}
                      onClick={() => setUploadDialog(true)}
                      sx={{
                        borderRadius: '6px',
                        px: 4,
                        py: 1.5,
                        borderColor: '#0D9488',
                        color: '#0D9488',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '14px',
                        '&:hover': { borderColor: '#0F766E', background: '#F0FDFA' }
                      }}
                    >
                      Upload Document
                    </Button>
                  </Box>
                </Paper>

                {/* Documents Table */}
                {loading && (
                  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8}>
                    <CircularProgress sx={{ color: '#0D9488', mb: 2 }} />
                    <Typography sx={{ color: '#64748B', fontWeight: 500 }}>Loading documents...</Typography>
                  </Box>
                )}

                {documents.length > 0 && !loading && (
                  <Paper sx={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                    <TableContainer>
                      <Table>
                        <TableHead sx={{ background: '#F8FAFC' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>Type</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>Submission Date</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>Notes</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '14px' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {documents.map((doc) => (
                            <TableRow key={doc.document_id} sx={{ '&:hover': { background: '#F8FAFC' } }}>
                              <TableCell sx={{ fontSize: '14px' }}>{doc.document_type}</TableCell>
                              <TableCell sx={{ fontSize: '14px', color: '#64748B' }}>
                                {new Date(doc.submission_date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={doc.verified ? 'Verified' : 'Pending'}
                                  size="small"
                                  sx={{
                                    background: doc.verified ? '#D1FAE5' : '#FEF3C7',
                                    color: doc.verified ? '#065F46' : '#92400E',
                                    fontWeight: 600,
                                    fontSize: '12px'
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontSize: '14px', color: '#64748B' }}>{doc.notes || '-'}</TableCell>
                              <TableCell>
                                <Box display="flex" gap={1}>
                                  {doc.file_path && (
                                    <IconButton size="small" onClick={() => handleDownload(doc.document_id)} sx={{ color: '#0D9488' }}>
                                      <DownloadIcon />
                                    </IconButton>
                                  )}
                                  {!doc.verified && (
                                    <IconButton size="small" onClick={() => handleVerify(doc.document_id)} sx={{ color: '#10B981' }}>
                                      <CheckCircleIcon />
                                    </IconButton>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}

                {documents.length === 0 && !loading && clientId && (
                  <Box textAlign="center" py={8}>
                    <InsertDriveFile sx={{ fontSize: 64, color: '#CBD5E1', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#64748B', fontWeight: 600 }}>No documents found</Typography>
                  </Box>
                )}
              </Box>
            )}

            {tabValue === 1 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1E293B', fontSize: '20px' }}>
                    Letter Templates
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Template />}
                    onClick={() => setTemplateDialog(true)}
                    sx={{
                      borderRadius: '6px',
                      px: 4,
                      py: 1.5,
                      background: '#0D9488',
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: '14px',
                      '&:hover': { background: '#0F766E' }
                    }}
                  >
                    Create Template
                  </Button>
                </Box>

                {templates.length > 0 ? (
                  <Grid container spacing={3}>
                    {templates.map((template) => (
                      <Grid item xs={12} sm={6} md={4} key={template.id}>
                        <Paper sx={{ p: 3, borderRadius: '8px', border: '1px solid #E2E8F0', height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: '16px' }}>{template.name}</Typography>
                          <Chip label={template.category} size="small" sx={{ mb: 2, width: 'fit-content', fontSize: '12px' }} />
                          <Typography variant="body2" sx={{ color: '#64748B', mb: 2, flex: 1, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                            {template.content}
                          </Typography>
                          <Box display="flex" gap={1} mt="auto">
                            <Button size="small" startIcon={<Eye />} onClick={() => handlePreviewTemplate(template)} sx={{ textTransform: 'none', fontSize: '12px' }}>Preview</Button>
                            <Button size="small" startIcon={<Edit />} onClick={() => handleEditTemplate(template)} sx={{ textTransform: 'none', fontSize: '12px' }}>Edit</Button>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box textAlign="center" py={8}>
                    <Template sx={{ fontSize: 64, color: '#CBD5E1', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#64748B', fontWeight: 600 }}>No templates yet</Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Paper>

        {/* Upload Dialog */}
        <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 600, fontSize: '20px' }}>Upload Document</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <TextField
                label="Client ID or Name"
                value={documentForm.client_id}
                onChange={(e) => setDocumentForm({ ...documentForm, client_id: e.target.value })}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={documentForm.document_type}
                  onChange={(e) => setDocumentForm({ ...documentForm, document_type: e.target.value })}
                  label="Document Type"
                >
                  {documentTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Notes"
                value={documentForm.notes}
                onChange={(e) => setDocumentForm({ ...documentForm, notes: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
              <Box
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                sx={{
                  border: '2px dashed',
                  borderColor: dragActive ? '#0D9488' : '#CBD5E1',
                  borderRadius: '8px',
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragActive ? '#F0FDFA' : 'transparent'
                }}
              >
                <input type="file" id="file-upload" hidden onChange={handleFileSelect} />
                <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                  <CloudUpload sx={{ fontSize: 40, color: '#0D9488', mb: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedFile ? selectedFile.name : 'Drag and drop your file here'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B' }}>or click to browse</Typography>
                </label>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
            <Button onClick={handleUploadDocument} variant="contained" sx={{ background: '#0D9488', '&:hover': { background: '#0F766E' } }}>Upload</Button>
          </DialogActions>
        </Dialog>

        {/* Template Dialog */}
        <Dialog open={templateDialog} onClose={() => setTemplateDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 600, fontSize: '20px' }}>Create Letter Template</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <TextField
                label="Template Name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                  label="Category"
                >
                  {templateCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Template Content"
                value={templateForm.content}
                onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                fullWidth
                multiline
                rows={8}
                placeholder="Enter template content... Use {client_name}, {date}, {file_number}, etc."
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setTemplateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateTemplate} variant="contained" sx={{ background: '#0D9488', '&:hover': { background: '#0F766E' } }}>Create</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 600, fontSize: '20px' }}>Edit Letter Template</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <TextField
                label="Template Name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                  label="Category"
                >
                  {templateCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Template Content"
                value={templateForm.content}
                onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                fullWidth
                multiline
                rows={8}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateTemplate} variant="contained" sx={{ background: '#0D9488', '&:hover': { background: '#0F766E' } }}>Update</Button>
          </DialogActions>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 600, fontSize: '20px' }}>Preview: {previewTemplate?.name}</DialogTitle>
          <DialogContent>
            <Box sx={{ p: 3, background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', minHeight: '400px', fontFamily: 'Times New Roman, serif', fontSize: '12pt', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {previewTemplate && replaceTemplateVariables(previewTemplate.content)}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setPreviewDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Print Dialog */}
        <Dialog open={printDialog} onClose={() => setPrintDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 600, fontSize: '20px' }}>Print: {printTemplate?.name}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Select Client</InputLabel>
                <Select
                  value={selectedClientId}
                  onChange={(e) => {
                    const clientId = e.target.value;
                    setSelectedClientId(clientId);
                    const client = clients.find(c => c.client_id === parseInt(clientId));
                    setSelectedClient(client);
                  }}
                  label="Select Client"
                >
                  <MenuItem value=""><em>Select a client</em></MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client.client_id} value={client.client_id}>
                      {client.full_name} (ID: {client.client_id})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {selectedClient && printTemplate && (
                <Box sx={{ p: 3, background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', maxHeight: '400px', overflow: 'auto' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#64748B' }}>Preview:</Typography>
                  <Box sx={{ fontFamily: 'Times New Roman, serif', fontSize: '12pt', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: 'white', p: 2, borderRadius: '6px' }}>
                    {replaceTemplateVariables(printTemplate.content, selectedClient)}
                  </Box>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setPrintDialog(false)}>Cancel</Button>
            <Button onClick={handleExportToWord} variant="outlined" startIcon={<FileText />} sx={{ borderColor: '#0D9488', color: '#0D9488' }}>Export to Word</Button>
            <Button onClick={handlePrint} variant="contained" disabled={!selectedClient} sx={{ background: '#10B981', '&:hover': { background: '#059669' } }}>Print</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </PasswordProtection >
  );
}

export default Documents;