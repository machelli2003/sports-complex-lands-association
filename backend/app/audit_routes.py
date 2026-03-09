from flask import Blueprint, jsonify, request
from app.models import AuditLog, User
from flask_jwt_extended import jwt_required, get_jwt_identity

audit_bp = Blueprint('audit_bp', __name__)


@audit_bp.route('/audit-logs', methods=['GET'])
@jwt_required()
def get_audit_logs():
    current_user_id = get_jwt_identity()
    user = None
    if current_user_id:
        user = User.objects(id=current_user_id).first() or User.objects(username=current_user_id).first()

    if not user or user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403

    # Optional filtering
    module = request.args.get('module')
    action = request.args.get('action')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)

    query = AuditLog.objects
    if module:
        query = query.filter(module=module)
    if action:
        query = query.filter(action=action)

    query = query.order_by('-timestamp')
    total = query.count()

    # Pagination
    start = (page - 1) * per_page
    end = start + per_page
    logs_subset = query[start:end]

    total_pages = (total + per_page - 1) // per_page

    return jsonify({
        'logs': [{
            'log_id': str(log.id),
            'user': log.user.username if log.user else 'System',
            'action': log.action,
            'module': log.module,
            'target_id': log.target_id,
            'message': log.message,
            'old_values': log.old_values,
            'new_values': log.new_values,
            'ip_address': log.ip_address,
            'timestamp': log.timestamp.isoformat() if log.timestamp else None
        } for log in logs_subset],
        'total': total,
        'pages': total_pages,
        'current_page': page
    })
