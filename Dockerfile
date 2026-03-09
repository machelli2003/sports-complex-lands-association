# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Final Image
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy frontend build from Stage 1 to the location Flask expects
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Set environment variables
ENV FLASK_ENV=production
ENV PORT=5001
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 5001

# Command to run the application
CMD ["python", "backend/run_production.py"]
