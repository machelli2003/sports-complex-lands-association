# Land Registration Management System - Backend

This is the Flask backend for the Land Registration Management System.

## Features
-- RESTful API
-- JWT Authentication
-- MongoDB (MongoEngine)
- File Upload Support

## Setup
1. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   python main.py
   ```

## Project Structure
- `app/` - Main application code
- `migrations/` - Legacy SQLAlchemy migrations (if present)
- `instance/` - Legacy SQLite database file (only used by migration scripts)
- `uploads/` - Uploaded documents

---

See the main README in the root for full-stack instructions.