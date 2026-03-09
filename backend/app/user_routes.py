from flask import Blueprint, request, jsonify
from app.models import User, LocalAssociation
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.audit_utils import log_action
from werkzeug.security import generate_password_hash, check_password_hash
import hashlib
import base64
from app.rate_limit import rate_limit

user_bp = Blueprint('user_bp', __name__)


def _resolve_user_by_identity(identity):
    """Resolve a JWT identity to a User instance using MongoEngine."""
    if identity is None:
        return None
    # identity may be an ObjectId string or username
    try:
        return User.objects(id=identity).first() or User.objects(username=identity).first()
    except Exception:
        return User.objects(username=identity).first()

@user_bp.route('/register', methods=['POST'])
def register_user():
    data = request.json
    if User.objects(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400

    user = User(
        username=data['username'],
        full_name=data['full_name'],
        role=data.get('role', 'staff')
    )
    if data.get('association_id'):
        user.association = data['association_id']

    user.password_hash = generate_password_hash(data['password'], method='pbkdf2:sha256')
    user.save()
    return jsonify({'message': 'User registered'}), 201

@user_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json(silent=True) or {}
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({'message': 'Bad request: username and password required'}), 400

        print(f"DEBUG: Login attempt for username: {data.get('username')}")
        user = User.objects(username=data['username']).first()

        if user:
            print(f"DEBUG: User found in DB. Checking password...")
            is_correct = False
            try:
                if user.password_hash and user.password_hash.startswith('scrypt:'):
                    parts = user.password_hash.split('$')
                    params = parts[0].split(':')
                    _, N, r, p = params
                    salt_b64 = parts[1]
                    hash_hex = parts[2]
                    salt = base64.b64decode(salt_b64)
                    dklen = len(hash_hex) // 2
                    try:
                        derived = hashlib.scrypt(
                            data['password'].encode('utf-8'),
                            salt=salt,
                            n=int(N),
                            r=int(r),
                            p=int(p),
                            dklen=dklen
                        )
                        is_correct = (derived.hex() == hash_hex)
                    except (MemoryError, ValueError, OSError) as s_err:
                        print('DEBUG: scrypt verify memory/error', s_err)
                        return jsonify({'message': 'Server error verifying scrypt password. Please reset password or contact administrator.'}), 500
                else:
                    is_correct = check_password_hash(user.password_hash, data['password'])
            except Exception as e:
                print('DEBUG: password verify error', e)
            print(f"DEBUG: Password match: {is_correct}")
            if is_correct:
                access_token = create_access_token(identity=str(user.id))
                return jsonify({'access_token': access_token, 'user_id': str(user.id), 'role': user.role})
        else:
            print(f"DEBUG: User NOT found in DB.")

        return jsonify({'message': 'Invalid credentials'}), 401
    except Exception as e:
        print('DEBUG: login handler error', e)
        return jsonify({'message': 'Server error', 'details': str(e)}), 500

@user_bp.route('/users/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = _resolve_user_by_identity(current_user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    return jsonify({
        'user_id': str(user.id),
        'username': user.username,
        'full_name': user.full_name,
        'role': user.role,
        'association_id': str(user.association.id) if user.association else None
    }), 200

@user_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    current_user_id = get_jwt_identity()
    admin_user = _resolve_user_by_identity(current_user_id)
    if not admin_user or admin_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403

    users = User.objects()
    return jsonify([
        {
            'user_id': str(u.id),
            'username': u.username,
            'full_name': u.full_name,
            'role': u.role,
            'association_id': str(u.association.id) if u.association else None
        } for u in users
    ])

@user_bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    current_user_id = get_jwt_identity()
    admin_user = _resolve_user_by_identity(current_user_id)
    if not admin_user or admin_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403

    data = request.json
    if not data.get('password'):
        return jsonify({'message': 'Password is required'}), 400
        
    if User.objects(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400

    new_user = User(
        username=data['username'],
        full_name=data['full_name'],
        role=data.get('role', 'staff')
    )
    if data.get('association_id'):
        assoc = LocalAssociation.objects(id=data['association_id']).first()
        if assoc:
            new_user.association = assoc

    new_user.password_hash = generate_password_hash(data['password'], method='pbkdf2:sha256')

    try:
        new_user.save()

        log_action(
            action="CREATE",
            module="Users",
            target_id=str(new_user.id),
            message=f"Created new user account: {new_user.username} ({new_user.role})"
        )

        return jsonify({'message': 'User created successfully', 'user_id': str(new_user.id)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user_id = get_jwt_identity()
    admin_user = _resolve_user_by_identity(current_user_id)
    if not admin_user or admin_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403

    try:
        user = User.objects(id=user_id).first()
    except Exception:
        user = User.objects(username=user_id).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    data = request.json
    original_username = user.username
    changes = []

    if 'username' in data and data['username'] != user.username:
        if User.objects(username=data['username']).first():
            return jsonify({'message': 'Username already exists'}), 400
        changes.append(f"username from '{user.username}' to '{data['username']}'")
        user.username = data['username']
        
    if 'full_name' in data and data['full_name'] != user.full_name:
        changes.append(f"full_name from '{user.full_name}' to '{data['full_name']}'")
        user.full_name = data['full_name']
        
    if 'role' in data and data['role'] != user.role:
        changes.append(f"role from '{user.role}' to '{data['role']}'")
        user.role = data['role']
        
    if 'association_id' in data:
        if data['association_id']:
            assoc = LocalAssociation.objects(id=data['association_id']).first()
            user.association = assoc
        else:
            user.association = None
        
    if 'password' in data and data['password']:
        changes.append("password (changed)")
        user.password_hash = generate_password_hash(data['password'], method='pbkdf2:sha256')
        
    try:
        user.save()
        if changes:
            log_action(
                action="UPDATE",
                module="Users",
                target_id=str(user.id),
                message=f"Updated user account '{original_username}': {', '.join(changes)}"
            )
        return jsonify({'message': 'User updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@user_bp.route('/users/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()
    admin_user = _resolve_user_by_identity(current_user_id)
    if not admin_user or admin_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403

    try:
        user = User.objects(id=user_id).first()
    except Exception:
        user = User.objects(username=user_id).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404

    try:
        username = user.username
        user.delete()

        log_action(
            action="DELETE",
            module="Users",
            target_id=user_id,
            message=f"Deleted user account: {username}"
        )

        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
