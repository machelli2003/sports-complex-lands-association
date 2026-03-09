from flask import Blueprint, request, jsonify
from app.models import Stage, ClientStage, User, PaymentType
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.audit_utils import log_action

stage_bp = Blueprint('stage_bp', __name__)


@stage_bp.route('/stages', methods=['GET'])
@jwt_required()
def get_stages():
    stages = Stage.objects.order_by('stage_number')
    return jsonify([
        {
            'stage_id': str(s.id),
            'stage_number': s.stage_number,
            'stage_name': s.stage_name,
            'description': s.description
        } for s in stages
    ])


@stage_bp.route('/client-stages/<client_id>', methods=['GET'])
@jwt_required()
def get_client_stages(client_id):
    client_stages = ClientStage.objects(client=client_id)
    return jsonify([
        {
            'client_stage_id': str(cs.id),
            'stage_id': str(cs.stage.id) if cs.stage else None,
            'status': cs.status,
            'start_date': cs.start_date.isoformat() if cs.start_date else None,
            'completion_date': cs.completion_date.isoformat() if cs.completion_date else None,
            'notes': cs.notes
        } for cs in client_stages
    ])


@stage_bp.route('/client-stages', methods=['POST'])
@jwt_required()
def add_client_stage():
    data = request.json
    client_stage = ClientStage(
        client=data['client_id'],
        stage=data['stage_id'],
        status=data.get('status', 'pending'),
        start_date=datetime.utcnow(),
        notes=data.get('notes', '')
    )
    client_stage.save()
    return jsonify({'message': 'Client stage added', 'client_stage_id': str(client_stage.id)}), 201


@stage_bp.route('/stages', methods=['POST'])
@jwt_required()
def create_stage():
    current_user_id = get_jwt_identity()
    admin_user = User.objects(id=current_user_id).first()
    if not admin_user or admin_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403

    data = request.json

    existing = Stage.objects(stage_number=data['stage_number']).first()
    if existing:
        return jsonify({'error': f'Stage number {data["stage_number"]} already exists'}), 400

    stage = Stage(
        stage_number=data['stage_number'],
        stage_name=data['stage_name'],
        description=data.get('description', '')
    )
    stage.save()

    log_action(
        action="CREATE",
        module="Stages",
        target_id=str(stage.id),
        message=f"Created stage: {stage.stage_name} (Stage {stage.stage_number})",
        new_values=data
    )

    return jsonify({
        'message': 'Stage created',
        'data': {
            'stage_id': str(stage.id),
            'stage_number': stage.stage_number,
            'stage_name': stage.stage_name,
            'description': stage.description
        }
    }), 201


@stage_bp.route('/stages/<stage_id>', methods=['PUT'])
@jwt_required()
def update_stage(stage_id):
    current_user_id = get_jwt_identity()
    admin_user = User.objects(id=current_user_id).first()
    if not admin_user or admin_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403

    stage = Stage.objects(id=stage_id).first()
    if not stage:
        return jsonify({'message': 'Stage not found'}), 404

    old_values = {
        'stage_number': stage.stage_number,
        'stage_name': stage.stage_name,
        'description': stage.description
    }
    data = request.json

    if 'stage_number' in data and data['stage_number'] != stage.stage_number:
        existing = Stage.objects(stage_number=data['stage_number']).first()
        if existing:
            return jsonify({'error': f'Stage number {data["stage_number"]} already exists'}), 400

    stage.stage_number = data.get('stage_number', stage.stage_number)
    stage.stage_name = data.get('stage_name', stage.stage_name)
    stage.description = data.get('description', stage.description)

    stage.save()

    log_action(
        action="UPDATE",
        module="Stages",
        target_id=str(stage.id),
        message=f"Updated stage: {stage.stage_name}",
        old_values=old_values,
        new_values=data
    )

    return jsonify({
        'message': 'Stage updated',
        'data': {
            'stage_id': str(stage.id),
            'stage_number': stage.stage_number,
            'stage_name': stage.stage_name,
            'description': stage.description
        }
    })


@stage_bp.route('/stages/<stage_id>', methods=['DELETE'])
@jwt_required()
def delete_stage(stage_id):
    current_user_id = get_jwt_identity()
    admin_user = User.objects(id=current_user_id).first()
    if not admin_user or admin_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403

    stage = Stage.objects(id=stage_id).first()
    if not stage:
        return jsonify({'message': 'Stage not found'}), 404

    if PaymentType.objects(stage=stage.id).count() > 0:
        return jsonify({'error': 'Cannot delete stage with existing payment types. Delete payment types first.'}), 400

    if ClientStage.objects(stage=stage.id).count() > 0:
        return jsonify({'error': 'Cannot delete stage with existing client progress. Remove client stages first.'}), 400

    stage_name = stage.stage_name
    stage.delete()

    log_action(
        action="DELETE",
        module="Stages",
        target_id=stage_id,
        message=f"Deleted stage: {stage_name}"
    )

    return jsonify({'message': 'Stage deleted'}), 200
