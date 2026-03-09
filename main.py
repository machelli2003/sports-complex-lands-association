from backend.main import create_app

# Create the WSGI app used by Gunicorn: `gunicorn main:app`
# We instantiate here so `main:app` is available at import time.
app = create_app()
application = app
