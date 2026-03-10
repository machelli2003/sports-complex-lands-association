/**
 * API Service
 * Centralized API calls for the application
 */

import axios from 'axios';

const envApi = process.env.REACT_APP_API_URL || '';
// Use relative `/api` in production deployments to avoid hardcoded localhost URLs.
const API_BASE = envApi
  ? `${envApi.replace(/\/$/, '')}/api`
  : '/api';

export { API_BASE };

// Debug: show which backend base URL the frontend resolved at runtime
try {
  // eslint-disable-next-line no-console
  console.debug('API_BASE:', API_BASE);
} catch (e) {}

// Add request interceptor
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// CLIENT MANAGEMENT
// ============================================================================

/**
 * Fetch all clients
 */
export const fetchClients = () =>
  axios.get(`${API_BASE}/clients`);

/**
 * Fetch a single client by ID
 * @param {number} id - Client ID
 */
export const fetchClient = (id) =>
  axios.get(`${API_BASE}/clients/${id}`);

/**
 * Register a new client
 * @param {Object} data - Client data (supports file upload for passport picture)
 */
export const registerClient = (data) => {
  if (data.passport_picture && data.passport_picture instanceof File) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return axios.post(`${API_BASE}/clients`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  } else {
    return axios.post(`${API_BASE}/clients`, data);
  }
};

/**
 * Search clients with filters
 * @param {string} query - Search query
 * @param {string} stage - Filter by stage
 * @param {string} status - Filter by status
 */
export const searchClients = (query, stage, status) => {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (stage) params.append('stage', stage);
  if (status) params.append('status', status);
  return axios.get(`${API_BASE}/clients/search?${params.toString()}`);
};

/**
 * Get dashboard data
 */
export const getDashboardData = () =>
  axios.get(`${API_BASE}/clients/dashboard`);

/**
 * Fetch client stages
 * @param {number} clientId - Client ID
 */
export const fetchClientStages = (clientId) =>
  axios.get(`${API_BASE}/client-stages/${clientId}`);

// ============================================================================
// PAYMENT MANAGEMENT
// ============================================================================

/**
 * Add a new payment
 * @param {Object} paymentData - Payment details
 */
export const addPayment = async (paymentData) => {
  const response = await axios.post(`${API_BASE}/payments`, paymentData);
  return response.data;
};

/**
 * Fetch payments for a client
 * @param {number} clientId - Client ID
 */
export const fetchPayments = (clientId) =>
  axios.get(`${API_BASE}/payments/${clientId}`);

/**
 * Fetch a secure receipt PDF
 * @param {number} paymentId - Payment ID
 */
export const fetchReceiptFile = (paymentId) =>
  axios.get(`${API_BASE}/receipts/${paymentId}`, {
    responseType: 'blob'
  });

/**
 * Get outstanding balance for a client
 * @param {number} clientId - Client ID
 */
export const getOutstandingBalance = (clientId) =>
  axios.get(`${API_BASE}/payments/${clientId}/outstanding-balance`);

/**
 * Get configured payment amounts for a client
 * @param {number} clientId - Client ID
 */
export const getClientPaymentAmounts = (clientId) =>
  axios.get(`${API_BASE}/clients/${clientId}/payment-amounts`);

/**
 * Update payment amounts for a client
 * @param {number} clientId - Client ID
 * @param {Array} paymentAmounts - Array of { payment_type_id, custom_amount }
 */
export const updateClientPaymentAmounts = (clientId, paymentAmounts) =>
  axios.post(`${API_BASE}/clients/${clientId}/payment-amounts`, { payment_amounts: paymentAmounts });

// ============================================================================
// STAGE MANAGEMENT
// ============================================================================

/**
 * Fetch all stages
 */
export const fetchStages = () =>
  axios.get(`${API_BASE}/stages`);

/**
 * Create a new stage
 * @param {Object} data - Stage data
 */
export const createStage = (data) =>
  axios.post(`${API_BASE}/stages`, data);

/**
 * Update an existing stage
 * @param {number} stageId - Stage ID
 * @param {Object} data - Updated stage data
 */
export const updateStage = (stageId, data) =>
  axios.put(`${API_BASE}/stages/${stageId}`, data);

/**
 * Delete a stage
 * @param {number} stageId - Stage ID
 */
export const deleteStage = (stageId) =>
  axios.delete(`${API_BASE}/stages/${stageId}`);

/**
 * Fetch payment types by stage
 * @param {number} stageId - Stage ID
 */
export const fetchPaymentTypesByStage = (stageId) =>
  axios.get(`${API_BASE}/stages/${stageId}/payment-types`);

// ============================================================================
// PAYMENT TYPE MANAGEMENT
// ============================================================================

/**
 * Fetch all payment types
 */
export const fetchAllPaymentTypes = () =>
  axios.get(`${API_BASE}/payment-types`);

/**
 * Create a new payment type
 * @param {Object} data - Payment type data
 */
export const createPaymentType = (data) =>
  axios.post(`${API_BASE}/payment-types`, data);

/**
 * Update an existing payment type
 * @param {number} paymentTypeId - Payment type ID
 * @param {Object} data - Updated payment type data
 */
export const updatePaymentType = (paymentTypeId, data) =>
  axios.put(`${API_BASE}/payment-types/${paymentTypeId}`, data);

/**
 * Delete a payment type
 * @param {number} paymentTypeId - Payment type ID
 */
export const deletePaymentType = (paymentTypeId) =>
  axios.delete(`${API_BASE}/payment-types/${paymentTypeId}`);

// ============================================================================
// DOCUMENT MANAGEMENT
// ============================================================================

/**
 * Fetch documents for a client
 * @param {number} clientId - Client ID
 */
export const fetchDocuments = (clientId) =>
  axios.get(`${API_BASE}/documents/${clientId}`);

/**
 * Add a new document
 * @param {Object} data - Document data (FormData for file upload)
 */
export const addDocument = (data) =>
  axios.post(`${API_BASE}/documents`, data);

/**
 * Verify a document
 * @param {number} documentId - Document ID
 */
export const verifyDocument = (documentId) =>
  axios.put(`${API_BASE}/documents/${documentId}/verify`);

/**
 * Download a document
 * @param {number} documentId - Document ID
 */
export const downloadDocument = (documentId) =>
  axios.get(`${API_BASE}/documents/${documentId}/download`, {
    responseType: 'blob'
  });

/**
 * Fetch a document's secure file URL
 * @param {number} documentId - Document ID
 */
export const fetchDocumentFile = (documentId) =>
  axios.get(`${API_BASE}/documents/${documentId}/file`, {
    responseType: 'blob'
  });

// ============================================================================
// TEMPLATE MANAGEMENT
// ============================================================================

/**
 * Fetch all templates
 */
export const fetchTemplates = () =>
  axios.get(`${API_BASE}/templates`);

/**
 * Add a new template
 * @param {Object} data - Template data
 */
export const addTemplate = (data) =>
  axios.post(`${API_BASE}/templates`, data);

/**
 * Update an existing template
 * @param {number} id - Template ID
 * @param {Object} data - Updated template data
 */
export const updateTemplate = (id, data) =>
  axios.put(`${API_BASE}/templates/${id}`, data);

/**
 * Delete a template
 * @param {number} id - Template ID
 */
export const deleteTemplate = (id) =>
  axios.delete(`${API_BASE}/templates/${id}`);

// ============================================================================
// ASSOCIATION MANAGEMENT
// ============================================================================

/**
 * Fetch all associations
 */
export const fetchAssociations = () =>
  axios.get(`${API_BASE}/associations`);

/**
 * Create a new association
 * @param {Object} data - Association data
 */
export const createAssociation = (data) =>
  axios.post(`${API_BASE}/associations`, data);

/**
 * Update an existing association
 * @param {number} associationId - Association ID
 * @param {Object} data - Updated association data
 */
export const updateAssociation = (associationId, data) =>
  axios.put(`${API_BASE}/associations/${associationId}`, data);

/**
 * Delete an association
 * @param {number} associationId - Association ID
 */
export const deleteAssociation = (associationId) =>
  axios.delete(`${API_BASE}/associations/${associationId}`);

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * Login user
 * @param {string} username 
 * @param {string} password 
 */
export const login = (username, password) =>
  axios.post(`${API_BASE}/login`, { username, password });

/**
 * Fetch all users (legacy)
 */
export const fetchUsers = () =>
  axios.get(`${API_BASE}/users`);

/**
 * Get all users
 */
export const getUsers = () =>
  axios.get(`${API_BASE}/users`);

/**
 * Create a new user
 * @param {Object} userData - User data
 */
export const createUser = (userData) =>
  axios.post(`${API_BASE}/users`, userData);

/**
 * Update an existing user
 * @param {number} userId - User ID
 * @param {Object} userData - Updated user data
 */
export const updateUser = (userId, userData) =>
  axios.put(`${API_BASE}/users/${userId}`, userData);

/**
 * Delete a user
 * @param {number} userId - User ID
 */
export const deleteUser = (userId) =>
  axios.delete(`${API_BASE}/users/${userId}`);

// ============================================================================
// REPORTS & ANALYTICS
// ============================================================================

/**
 * Get daily revenue report
 */
export const getDailyRevenue = () =>
  axios.get(`${API_BASE}/reports/daily-revenue`);

/**
 * Get payment types summary
 */
export const getPaymentTypesSummary = () =>
  axios.get(`${API_BASE}/reports/payment-types`);

/**
 * Get total transactions count
 */
export const getTotalTransactions = () =>
  axios.get(`${API_BASE}/reports/total-transactions`);

/**
 * Get outstanding payments report
 */
export const getOutstandingPayments = () =>
  axios.get(`${API_BASE}/reports/outstanding-payments`);

/**
 * Get completion analytics
 */
export const getCompletionAnalytics = () =>
  axios.get(`${API_BASE}/reports/completion-analytics`);

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Export daily revenue to CSV
 */
export const exportDailyRevenue = () =>
  axios.get(`${API_BASE}/reports/daily-revenue/export`, {
    responseType: 'blob'
  });

/**
 * Export clients to CSV
 */
/**
 * Export clients to CSV
 */
export const exportClients = () =>
  axios.get(`${API_BASE}/reports/clients/export`, {
    responseType: 'blob'
  });

// ============================================================================
// SETTINGS MANAGEMENT
// ============================================================================

/**
 * Fetch all system settings
 */
export const getSettings = () =>
  axios.get(`${API_BASE}/settings`);

/**
 * Update system settings
 * @param {Object} settings - Settings object { key: value }
 */
export const updateSettings = (settings) =>
  axios.post(`${API_BASE}/settings`, settings);

/**
 * Trigger a manual database backup
 */
export const createBackup = () =>
  axios.post(`${API_BASE}/settings/backup`);

/**
 * Verify page password
 * @param {string} page - Page name (Reports, Admin Panel, Documents)
 * @param {string} password - Password to verify
 */
export const verifyPagePassword = (page, password) =>
  axios.post(`${API_BASE}/verify-page-password`, { page, password });
