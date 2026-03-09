import time
from flask import request, jsonify
from functools import wraps

# Simple in-memory storage for rate limiting
# In production, use Redis or a similar store
login_attempts = {}

def rate_limit(limit=5, window=60):
    """
    Simple rate limiter decorator.
    limit: Number of attempts allowed
    window: Time window in seconds
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            ip = request.remote_addr
            now = time.time()
            
            if ip not in login_attempts:
                login_attempts[ip] = []
            
            # Filter attempts within the window
            login_attempts[ip] = [t for t in login_attempts[ip] if now - t < window]
            
            if len(login_attempts[ip]) >= limit:
                return jsonify({
                    'message': 'Too many attempts. Please try again later.',
                    'retry_after': int(window - (now - login_attempts[ip][0]))
                }), 429
            
            # Record this attempt
            login_attempts[ip].append(now)
            return f(*args, **kwargs)
        return decorated_function
    return decorator
