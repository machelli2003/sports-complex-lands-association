# Sports Complex Management System

A comprehensive web application for managing sports complex operations, client registrations, payments, and document handling.

## Features

### ✅ Core Functionality
- **Client Registration**: Register new clients with personal details and association information
- **Client Search**: Advanced search with filtering by name, file number, phone, Ghana card, stage, and status
- **Payment Management**: Record payments with validation, automatic stage advancement, and receipt generation
- **Document Management**: Upload, verify, and manage client documents
- **Dashboard Analytics**: Real-time metrics including client counts, revenue trends, and recent activities
- **Reports**: Generate reports on daily revenue, outstanding payments, and completion analytics with CSV export

### ✅ Business Logic
- **Payment Validation**: Ensures payments don't exceed expected amounts based on payment types
- **Stage Advancement**: Automatically advances clients to next stages upon payment completion
- **Receipt Management**: Unique receipt numbers and payment tracking
- **Document Verification**: Mark documents as verified with timestamps

### ✅ User Experience
- **Responsive Design**: Mobile-friendly interface with collapsible sidebar
- **Form Validation**: Client-side and server-side validation with helpful error messages
- **Loading States**: Proper loading indicators throughout the application
- **Success/Error Feedback**: Clear user feedback for all operations

### Technical Features

- **RESTful API**: Well-structured Flask backend using MongoEngine (MongoDB)
- **Real-time Data**: All reports and analytics use live database data
- **Export Functionality**: CSV export for reports and client data
- **File Upload Support**: Document upload capability (backend ready)
## Technology Stack

### Backend
- **Flask**: Python web framework
- **MongoEngine**: MongoDB ODM (replaces SQLAlchemy)
- **Flask-CORS**: Cross-origin resource sharing
- **MongoDB (Atlas recommended)**: Database

### Frontend
- **React**: JavaScript library for UI
- **Material-UI**: React component library
- **Axios**: HTTP client for API calls
- **React Router**: Client-side routing

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python create_db.py
python main.py  # Runs on http://127.0.0.1:5001
```

### Frontend Setup
```bash
cd frontend
npm install
npm start  # Runs on http://localhost:3001, proxies to backend on 5001
```

### Quick Start (VS Code)
Use the "Start System" task in VS Code to run both backend and frontend simultaneously.

### Default Credentials
| Page | Default Password |
| :--- | :--- |
| **Admin Panel** | `admin2025` |
| **Reports** | `reports2025` |
| **Documents** | `docs2025` |
| **Dashboard** | `dashboard2025` |

**Admin User**: No default admin user is pre-created. Use the `create_admin.py` script or register a new user if enabled. The page passwords can be changed in the **Admin Panel > Settings** tab.

## API Endpoints

### Clients
- `GET /api/clients/dashboard` - Dashboard analytics
- `POST /api/clients` - Register new client
- `GET /api/clients/search` - Search clients with filters

### Payments
- `POST /api/payments` - Add new payment
- `GET /api/payments/:client_id` - Get client payments

### Documents
- `POST /api/documents` - Upload document
- `GET /api/documents/:client_id` - Get client documents
- `PUT /api/documents/:id/verify` - Verify document

### Reports
- `GET /api/reports/daily-revenue` - Daily revenue data
- `GET /api/reports/outstanding-payments` - Outstanding payments
- `GET /api/reports/completion-analytics` - Stage completion data
- `GET /api/reports/*/export` - Export data to CSV

## Database Schema

### Key Tables
- **clients**: Client information and current stage
- **stages**: Stage definitions and progression
- **payments**: Payment records with validation
- **payment_types**: Expected payment amounts per stage
- **documents**: Client document management
- **client_stages**: Client progress through stages

## Usage

1. **Register Clients**: Use the New Registration page to add clients
2. **Manage Payments**: Record payments in the Payments section
3. **Track Progress**: Monitor client advancement through stages
4. **Generate Reports**: View analytics and export data
5. **Handle Documents**: Upload and verify client documents

## Future Enhancements

- User authentication and role-based access
- Email/SMS notifications
- Advanced reporting with charts
- PDF receipt generation
- Document templates
- Payment reminders
- Audit logging
- Data backup/restore
- Multi-language support

## Deployment (quickstart)

1. Copy `.env.example` to `.env` and fill in production values (especially `MONGO_URI` and `JWT_SECRET_KEY`).

2. Using Docker Compose (recommended for quick deploy):

```bash
docker-compose build
docker-compose up -d
```

This will start a `mongo` service and the application. Uploaded files and receipts are persisted to `backend/instance` (mounted into the container).

3. Health check: visit `http://<host>:5001/health` to verify app and DB connectivity.

4. For production-grade deployments consider:
- Use a managed MongoDB (Atlas) with backups and monitoring.
- Terminate TLS at a reverse proxy (NGINX, Traefik) or use a cloud load balancer.
- Use a secret manager for `JWT_SECRET_KEY` and database credentials.
- Configure logging, monitoring, and automated backups.

See `docker-compose.yml` for an example local deployment stack.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.