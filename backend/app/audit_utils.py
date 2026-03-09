from app.models import AuditLog, User
from flask import request
from flask_jwt_extended import get_jwt_identity


def log_action(action, module, target_id=None, message=None, old_values=None, new_values=None):
    """Create an audit log entry for a user action using MongoEngine."""
    try:
        current_user_id = get_jwt_identity()

        user_obj = None
        if current_user_id:
            # try by id then by username
            user_obj = User.objects(id=current_user_id).first() or User.objects(username=current_user_id).first()

        log = AuditLog(
            user=user_obj,
            action=action,
            module=module,
            target_id=str(target_id) if target_id else None,
            message=message,
            old_values=old_values,
            new_values=new_values,
            ip_address=request.remote_addr
        )
        log.save()
    except Exception as e:
        print(f"Audit log failed: {e}")
