from flask import Blueprint, request, jsonify
from app.models import Setting, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.backup_utils import create_backup
from app.rate_limit import rate_limit

settings_bp = Blueprint('settings', __name__)


@settings_bp.route('/settings', methods=['GET'])
@jwt_required()
def get_settings():
    settings = Setting.objects()
    # If settings don't exist yet, return defaults
    defaults = {
        'reports_password': 'reports2025',
        'admin_password': 'admin2025',
        'documents_password': 'docs2025',
        'dashboard_password': 'dashboard2025',
        'system_name': 'Sports Complex Management System'
    }
    
    result = {}
    for s in settings:
        result[s.key] = s.value
        
    # Merge defaults for missing keys
    for key, value in defaults.items():
        if key not in result:
            result[key] = value
            
    return jsonify(result), 200

@settings_bp.route('/settings', methods=['POST'])
@jwt_required()
def update_settings():
    current_user_id = get_jwt_identity()
    admin_user = User.objects(id=current_user_id).first()
    if not admin_user or admin_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403

    data = request.get_json()

    try:
        updated_settings = []
        for key, value in data.items():
            setting = Setting.objects(key=key).first()
            if setting:
                setting.value = value
                setting.save()
            else:
                setting = Setting(key=key, value=value)
                setting.save()
            updated_settings.append(key)

        return jsonify({'message': 'Settings updated successfully', 'updated': updated_settings}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@settings_bp.route('/verify-page-password', methods=['POST'])
@rate_limit(limit=10, window=60)
def verify_page_password():
    data = request.get_json()
    page = data.get('page')
    password = data.get('password')
    
    if not page or not password:
        return jsonify({'valid': False, 'message': 'Page and password are required'}), 400
        
    # Map page names to setting keys
    key_map = {
        'Reports': 'reports_password',
        'Admin Panel': 'admin_password',
        'Documents': 'documents_password',
        'Dashboard': 'dashboard_password',
        'Settings': 'admin_password', 
        'Audit Logs': 'admin_password'
    }
    
    setting_key = key_map.get(page)
    if not setting_key:
        return jsonify({'valid': False, 'message': 'Invalid page'}), 400
        
    setting = Setting.objects(key=setting_key).first()
    
    # Check against DB value or default if not set
    correct_password = setting.value if setting else {
        'reports_password': 'reports2025',
        'admin_password': 'admin2025',
        'documents_password': 'docs2025',
        'dashboard_password': 'dashboard2025'
    }.get(setting_key)
    
    if password == correct_password:
        return jsonify({'valid': True}), 200
    else:
        return jsonify({'valid': False}), 401

@settings_bp.route('/settings/backup', methods=['POST'])
@jwt_required()
def trigger_backup():
    """Manually trigger a database backup (Admin only)"""
    current_user_id = get_jwt_identity()
    admin_user = User.objects(id=current_user_id).first()
    if not admin_user or admin_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
        
    success, result = create_backup()
    if success:
        return jsonify({'message': f'Backup created successfully: {result}'}), 200
    else:
        return jsonify({'error': f'Backup failed: {result}'}), 500
