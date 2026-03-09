import os
import json
from datetime import datetime
from flask import current_app
from app.models import Client, Payment, User, LocalAssociation, Stage, PaymentType, AuditLog

def create_backup():
    """
    Creates a JSON export of key collections as a basic backup.
    For production, use mongodump or cloud provider backups (e.g., MongoDB Atlas).
    """
    try:
        instance_path = current_app.instance_path
        backups_dir = os.path.join(instance_path, 'backups')
        os.makedirs(backups_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f"mongodb_export_{timestamp}.json"
        backup_path = os.path.join(backups_dir, backup_filename)
        
        # Simple export of all data to a single JSON file
        data = {
            'clients': [json.loads(c.to_json()) for c in Client.objects.all()],
            'payments': [json.loads(p.to_json()) for p in Payment.objects.all()],
            'users': [json.loads(u.to_json()) for u in User.objects.all()],
            'associations': [json.loads(a.to_json()) for a in LocalAssociation.objects.all()],
            'stages': [json.loads(s.to_json()) for s in Stage.objects.all()],
            'payment_types': [json.loads(pt.to_json()) for pt in PaymentType.objects.all()],
            'audit_logs': [json.loads(al.to_json()) for al in AuditLog.objects.all()[:1000]] # Limit logs for size
        }
        
        with open(backup_path, 'w') as f:
            json.dump(data, f, indent=4)
        
        # Keep only last 5 backups
        backups = sorted([f for f in os.listdir(backups_dir) if f.endswith('.json')])
        if len(backups) > 5:
            for old_backup in backups[:-5]:
                os.remove(os.path.join(backups_dir, old_backup))
                
        return True, backup_filename
    except Exception as e:
        return False, str(e)
