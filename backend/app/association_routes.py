from flask import Blueprint, request, jsonify
from app.models import LocalAssociation, Client, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.audit_utils import log_action

association_bp = Blueprint('association_bp', __name__)


@association_bp.route('/associations', methods=['GET'])
@jwt_required()
def get_associations():
    associations = LocalAssociation.objects()
    return jsonify({
        'data': [
            {
                'association_id': str(a.id),
                'association_name': a.association_name,
                'location': a.location,
                'contact_person': a.contact_person,
                'phone': a.phone
            } for a in associations
        ]
    })


@association_bp.route('/associations', methods=['POST'])
@jwt_required()
def add_association():
    current_user_id = get_jwt_identity()
    admin_user = User.objects(id=current_user_id).first() or User.objects(username=current_user_id).first()
    if not admin_user or admin_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403

    data = request.json
    association = LocalAssociation(
        association_name=data['association_name'],
        location=data.get('location'),
        contact_person=data.get('contact_person'),
        phone=data.get('phone')
    )
    association.save()

    log_action(
        action="CREATE",
        module="Associations",
        target_id=str(association.id),
        message=f"Created association: {association.association_name}",
        new_values=data
    )

    return jsonify({
        'message': 'Association added', 
        'association_id': str(association.id),
        'data': {
            'association_id': str(association.id),
            'association_name': association.association_name,
            'location': association.location,
            'contact_person': association.contact_person,
            'phone': association.phone
        }
    }), 201


@association_bp.route('/associations/<association_id>', methods=['PUT'])
@jwt_required()
def update_association(association_id):
    current_user_id = get_jwt_identity()
    admin_user = User.objects(id=current_user_id).first() or User.objects(username=current_user_id).first()
    if not admin_user or admin_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403

    association = LocalAssociation.objects(id=association_id).first()
    if not association:
        return jsonify({'message': 'Association not found'}), 404

    old_values = {
        'association_name': association.association_name,
        'location': association.location,
        'contact_person': association.contact_person,
        'phone': association.phone
    }
    data = request.json

    association.association_name = data.get('association_name', association.association_name)
    association.location = data.get('location', association.location)
    association.contact_person = data.get('contact_person', association.contact_person)
    association.phone = data.get('phone', association.phone)

    association.save()

    log_action(
        action="UPDATE",
        module="Associations",
        target_id=str(association.id),
        message=f"Updated association: {association.association_name}",
        old_values=old_values,
        new_values=data
    )

    return jsonify({
        'message': 'Association updated',
        'data': {
            'association_id': str(association.id),
            'association_name': association.association_name,
            'location': association.location,
            'contact_person': association.contact_person,
            'phone': association.phone
        }
    })


@association_bp.route('/associations/<association_id>', methods=['DELETE'])
@jwt_required()
def delete_association(association_id):
    current_user_id = get_jwt_identity()
    admin_user = User.objects(id=current_user_id).first() or User.objects(username=current_user_id).first()
    if not admin_user or admin_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403

    association = LocalAssociation.objects(id=association_id).first()
    if not association:
        return jsonify({'message': 'Association not found'}), 404

    # Check if any clients are assigned to this association
    if Client.objects(local_association=association.id).count() > 0:
        return jsonify({'error': 'Cannot delete association with existing clients'}), 400

    assoc_name = association.association_name
    association.delete()

    log_action(
        action="DELETE",
        module="Associations",
        target_id=association_id,
        message=f"Deleted association: {assoc_name}"
    )

    return jsonify({'message': 'Association deleted'}), 200
