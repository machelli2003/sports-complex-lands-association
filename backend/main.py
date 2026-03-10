import os
from datetime import datetime
from flask import Flask, send_from_directory, jsonify, request
from logging_config import setup_logging
import logging

# Monitoring
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

# Rate limiting
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Sentry (error monitoring)
import sentry_sdk
from flask_cors import CORS
from extensions import db
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

load_dotenv()

from config import Config
import mongoengine as me
from mongoengine import connect as me_connect
import threading
import importlib
import time
import logging
import sys

def create_app():
    # configure logging early
    try:
        setup_logging()
    except Exception:
        pass
    app = Flask(__name__)
    log = logging.getLogger(__name__)
    app.config.from_object(Config)
    
    app.config['UPLOAD_FOLDER'] = os.path.join(app.instance_path, 'uploads')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'default-dev-secret-key')
    from datetime import timedelta
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)
    jwt = JWTManager(app)

    # Initialize Sentry if provided
    sentry_dsn = os.getenv('SENTRY_DSN') or app.config.get('SENTRY_DSN')
    if sentry_dsn:
        try:
            sentry_sdk.init(dsn=sentry_dsn)
            log.info('Sentry initialized')
        except Exception as e:
            log.warning('Could not initialize Sentry: %s', e)

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    receipts_folder = os.path.join(app.instance_path, 'receipts')
    os.makedirs(receipts_folder, exist_ok=True)

    db.init_app(app)
    mongo_uri = app.config.get('MONGO_URI') or app.config.get('MONGODB_HOST')
    if mongo_uri:
        try:
            me_connect(host=mongo_uri)
            log.info('[OK] Connected to MongoDB via MongoEngine')
        except Exception as e:
            log.warning(f'[WARN] Could not connect to MongoDB: {e}')

    cors_origins = os.getenv('CORS_ORIGINS', '*')
    origins = [o.strip() for o in cors_origins.split(',')] if cors_origins and cors_origins != '*' else '*'
    CORS(app, resources={r"/api/*": {"origins": origins}})

    @app.after_request
    def _ensure_cors_headers(response):
        response.headers.setdefault('Access-Control-Allow-Origin', '*')
        response.headers.setdefault('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.setdefault('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        response.headers.setdefault('X-Content-Type-Options', 'nosniff')
        response.headers.setdefault('X-Frame-Options', 'DENY')
        response.headers.setdefault('Referrer-Policy', 'no-referrer-when-downgrade')
        csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; connect-src 'self' ws: https:;"
        response.headers.setdefault('Content-Security-Policy', csp)
        return response

    @app.errorhandler(Exception)
    def _handle_exception(e):
        import traceback, sys
        tb = traceback.format_exc()
        logging.getLogger(__name__).exception('Unhandled exception: %s', str(e))
        resp = jsonify({'error': 'Server error', 'details': str(e)})
        resp.status_code = 500
        resp.headers.setdefault('Access-Control-Allow-Origin', '*')
        resp.headers.setdefault('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        resp.headers.setdefault('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        return resp

    from app import models 

    from app.association_routes import association_bp
    app.register_blueprint(association_bp, url_prefix='/api')
    
    from app.stage_routes import stage_bp
    app.register_blueprint(stage_bp, url_prefix='/api')
    
    from app.document_routes import document_bp
    app.register_blueprint(document_bp, url_prefix='/api')
    
    from app.payment_routes import payment_bp
    app.register_blueprint(payment_bp, url_prefix='/api')
    print(f"[OK] Payment blueprint registered at /api/payments")

    from app.client_routes import client_bp
    app.register_blueprint(client_bp, url_prefix='/api')
    
    from app.report_routes import report_bp
    app.register_blueprint(report_bp, url_prefix='/api')
    
    from app.user_routes import user_bp
    app.register_blueprint(user_bp, url_prefix='/api')
    
    from app.payment_type_routes import payment_type_bp
    app.register_blueprint(payment_type_bp, url_prefix='/api')

    from app.settings_routes import settings_bp
    app.register_blueprint(settings_bp, url_prefix='/api')

    from app.client_payment_routes import client_payment_bp
    app.register_blueprint(client_payment_bp, url_prefix='/api')
    print(f"[OK] Client payment routes registered at /api/clients/<id>/payment-amounts")

    from app.audit_routes import audit_bp
    app.register_blueprint(audit_bp, url_prefix='/api')

    print("\n[INFO] Registered routes:")
    for rule in app.url_map.iter_rules():
        if 'payment' in rule.rule:
            print(f"  {rule.methods} {rule.rule}")
    print()

    app.static_folder = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build')
    app.static_url_path = '/'

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        else:
            return send_from_directory(app.static_folder, 'index.html')

    @app.route('/health')
    def health():
        result = {'status': 'ok'}
        try:
            mongo_uri = app.config.get('MONGO_URI') or app.config.get('MONGODB_HOST')
            if mongo_uri:
                try:
                    dbobj = me.connection.get_db()
                    dbobj.client.admin.command('ping')
                    result['db'] = 'ok'
                except Exception as e:
                    result['db'] = 'error'
                    result['db_error'] = str(e)
            else:
                result['db'] = 'not-configured'
        except Exception as e:
            result['status'] = 'error'
            result['error'] = str(e)
        status_code = 200 if result.get('db') in ('ok', 'not-configured') else 500
        return jsonify(result), status_code

    rate_limit = os.getenv('RATE_LIMIT') or '200 per day;50 per hour'
    limiter = Limiter(key_func=get_remote_address, default_limits=[rate_limit])
    limiter.init_app(app)

    # Ensure we don't register duplicate Prometheus timeseries when create_app()
    # is called multiple times (debug modules/imports). Reuse existing collectors
    # from the default registry when available.
    from prometheus_client import REGISTRY

    # Create metrics, but if they are already registered (ValueError), reuse
    # the existing collector from the default REGISTRY internals.
    try:
        REQUEST_COUNT = Counter('app_request_count', 'Total HTTP requests', ['method', 'endpoint', 'http_status'])
    except ValueError:
        # Try to reuse existing collector from registry internals
        REQUEST_COUNT = None
        try:
            REQUEST_COUNT = REGISTRY._names_to_collectors.get('app_request_count')
        except Exception:
            REQUEST_COUNT = None
        if REQUEST_COUNT is None:
            # Last resort: create a no-op counter wrapper
            class _Noop:
                def labels(self, *args, **kwargs):
                    class _L:
                        def inc(self, *a, **k):
                            return None
                    return _L()
            REQUEST_COUNT = _Noop()

    try:
        REQUEST_LATENCY = Histogram('app_request_latency_seconds', 'Request latency', ['endpoint'])
    except ValueError:
        REQUEST_LATENCY = None
        try:
            REQUEST_LATENCY = REGISTRY._names_to_collectors.get('app_request_latency_seconds')
        except Exception:
            REQUEST_LATENCY = None
        if REQUEST_LATENCY is None:
            class _NoopHist:
                def labels(self, *args, **kwargs):
                    class _L:
                        def observe(self, *a, **k):
                            return None
                    return _L()
            REQUEST_LATENCY = _NoopHist()

    @app.before_request
    def _before_request_metrics():
        request._start_time = datetime.utcnow()

    @app.after_request
    def _after_request_metrics(response):
        try:
            resp_time = (datetime.utcnow() - request._start_time).total_seconds()
            REQUEST_LATENCY.labels(request.path).observe(resp_time)
            REQUEST_COUNT.labels(request.method, request.path, response.status_code).inc()
        except Exception:
            pass
        return response

    @app.route('/metrics')
    def metrics():
        data = generate_latest()
        return data, 200, {'Content-Type': CONTENT_TYPE_LATEST}

    return app

# ----------------------------
# Module-level WSGI app for Gunicorn / Render
# ----------------------------
app = create_app()
application = app  # optional for some platforms

# ----------------------------
# Local development server
# ----------------------------
if __name__ == '__main__':
    print("--- Server Starting ---")
    debug_mode = os.getenv('FLASK_ENV') == 'development'
    port = int(os.getenv('PORT', 5001))
    auto_run = os.getenv('AUTO_RUN_DEBUG_SCRIPTS', '0') == '1' or debug_mode

    backend_dir = os.path.dirname(__file__)
    candidate_prefixes = ('debug_', 'test_', 'inspect_', 'check_', 'dump_', 'list_')
    blacklist_substr = (
        'create_db', 'migrate', 'seed_data', 'run_production', 'setup_', 'migrate_sqlite',
        'add_physical_planning', 'fix_payment_types', 'cleanup_payment_types'
    )

    def _discover_debug_modules():
        mods = []
        try:
            for fname in os.listdir(backend_dir):
                if not fname.endswith('.py'):
                    continue
                name = fname[:-3]
                if name == os.path.splitext(os.path.basename(__file__))[0]:
                    continue
                if not any(name.startswith(p) for p in candidate_prefixes) and name not in ('inspect_admin', 'inspect_stage_3', 'dump_users', 'list_users'):
                    continue
                if any(bs in name for bs in blacklist_substr):
                    continue
                mods.append(name)
        except Exception:
            pass
        return sorted(set(mods))

    def _run_debug_after_start(mod_names, delay=1.5):
        time.sleep(delay)
        for mod_name in mod_names:
            try:
                m = importlib.import_module(mod_name)
            except Exception as e:
                print(f"[DEBUG_RUNNER] Could not import {mod_name}: {e}")
                continue

            candidates = ('run', 'main', 'debug_login', 'test_login', 'debug', 'execute', 'check')
            func = None
            for attr in candidates:
                func = getattr(m, attr, None)
                if callable(func):
                    break
                func = None

            if callable(func):
                print(f"[DEBUG_RUNNER] Running {mod_name}.{func.__name__}()")
                try:
                    func()
                except Exception as e:
                    print(f"[DEBUG_RUNNER] Error running {mod_name}.{func.__name__}: {e}")
            else:
                print(f"[DEBUG_RUNNER] No runnable entrypoint found in {mod_name}; skipping")

    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)

    env_list = os.getenv('DEBUG_MODULES', '').strip()
    if env_list:
        requested = [m.strip() for m in env_list.split(',') if m.strip()]
        modules_to_run = [m for m in requested if m]
    else:
        modules_to_run = _discover_debug_modules()
        if 'dev_utils' in modules_to_run:
            modules_to_run.remove('dev_utils')
            modules_to_run.insert(0, 'dev_utils')

    if auto_run:
        if not modules_to_run:
            print("[DEBUG_RUNNER] Auto-run enabled but no candidate modules found to run.")
        else:
            print(f"[DEBUG_RUNNER] Auto-run enabled. Starting debug thread for modules: {modules_to_run}")
            t = threading.Thread(target=_run_debug_after_start, args=(modules_to_run, 1.5), daemon=True)
            t.start()

    app.run(debug=debug_mode, port=port, threaded=True, use_reloader=False)