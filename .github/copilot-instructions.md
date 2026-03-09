# Sports Complex Management System - AI Coding Guidelines

## Project Overview
This is a full-stack web application for managing sports complex client registrations, payments, and document processing. The system uses a stage-based progression model where clients advance through predefined stages upon completing required payments.

## Architecture
- **Backend**: Flask REST API with MongoEngine (MongoDB)
- **Frontend**: React with Material-UI components, Axios for API calls
- **Database**: Complex relational model with clients, stages, payments, and documents

## Key Business Logic Patterns

### Stage Advancement System
- Clients progress through numbered stages (1, 2, 3, etc.) defined in the `stages` table
- Each stage has associated payment types with expected amounts
- Payments are validated against remaining balances for each payment type
- Automatic stage advancement occurs when all required payments for a stage are completed
- Example: `check_stage_completion()` in `payment_routes.py` handles advancement logic

### Payment Validation
- Payments are capped at remaining amounts to prevent overpayment
- Duplicate receipt numbers are rejected
- Payment types are matched case-insensitively but stored with exact database casing
- See `add_payment()` route for validation patterns

### File Upload Handling
- Passport pictures and documents are stored in `instance/uploads/`
- File paths are stored in database, served via `/uploads/<filename>` route
- Form data uses `multipart/form-data` for file uploads
- Example: Client registration handles both JSON and FormData requests

## Code Patterns & Conventions

### Backend (Flask)
- **Blueprints**: All routes organized in separate blueprint files (`client_routes.py`, `payment_routes.py`, etc.)
- **Models**: MongoEngine `Document` classes in `models.py` with `ReferenceField` relationships
- **Error Handling**: Return JSON error responses with descriptive messages
- **Database Queries**: Use MongoEngine querysets; for heavy aggregations prefer MongoDB aggregation pipeline
- **File Paths**: Use `os.path.join()` for cross-platform compatibility

### Frontend (React)
- **API Calls**: Centralized in `api.js` with consistent error handling
- **State Management**: Local component state with `useState`, no global state library
- **Forms**: Controlled components with validation and auto-formatting (e.g., Ghana card uppercase)
- **Routing**: React Router with protected routes and parameter handling
- **UI Components**: Material-UI with custom styling and responsive design

### Database Schema Patterns
- **Foreign Keys**: Consistent naming (`client_id`, `stage_id`, etc.)
- **Relationships**: Use SQLAlchemy `relationship()` for navigation
- **Enums**: Status fields use string values ('active', 'completed', 'pending')
- **Timestamps**: `datetime.utcnow()` for all timestamp fields

## Development Workflow

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python create_db.py   # Initialize database
python main.py        # Run development server
```

### Frontend Setup
```bash
cd frontend
npm install
npm start  # Runs on port 3000, proxies to backend on 5000
```

### Database Management
- Use `python create_db.py` to initialize MongoDB indexes and seed data
- Legacy SQLite migration helpers exist to migrate old data into MongoDB (`migrate_sqlite_to_mongo.py`)
- Seed data in `seed_data.py` for development (now uses MongoEngine)

## Common Tasks & Patterns

### Adding New API Endpoints
1. Create route in appropriate blueprint file
2. Follow RESTful conventions
3. Include proper error handling and validation
4. Update `api.js` with corresponding frontend function
5. Test with both success and error cases

### Modifying Client Forms
- Update both backend model and frontend form
- Handle file uploads separately from JSON data
- Include client-side validation matching server-side rules
- Use Material-UI form components for consistency

### Payment Logic Changes
- Always validate against `PaymentType` records
- Check existing payments before allowing new ones
- Update stage status after payment recording
- Consider impact on client advancement

### Database Queries
- Use MongoEngine querysets and `objects()` lookups; for aggregations use MongoDB aggregation pipeline when performance matters
- Use `ReferenceField` navigation for relationships

## Key Files to Reference
- `backend/app/models.py`: Database schema and relationships
- `backend/app/payment_routes.py`: Payment validation and stage advancement
- `backend/app/client_routes.py`: Client CRUD operations
- `frontend/src/api.js`: API call patterns
- `frontend/src/pages/NewRegistration.js`: Complex form handling example
- `backend/main.py`: Application setup and blueprint registration

## Testing & Validation
- Backend routes include input validation and error responses
- Frontend forms have client-side validation
- File uploads require proper content-type handling
- Database constraints prevent invalid data states

## Deployment Notes
- SQLite suitable for development; consider PostgreSQL for production
- File uploads need proper storage configuration
- CORS enabled for cross-origin requests
- Environment variables via `python-dotenv`</content>
<parameter name="filePath">c:\Users\_MONI_\Desktop\Sports Complex\.github\copilot-instructions.md