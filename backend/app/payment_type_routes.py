from flask import Blueprint, request, jsonify
from app.models import PaymentType, Stage, Payment, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.audit_utils import log_action

payment_type_bp = Blueprint('payment_type_bp', __name__)


@payment_type_bp.route('/payment-types', methods=['GET'])
@jwt_required()
def get_all_payment_types():
    """Get all payment types with stage information"""
    payment_types = list(PaymentType.objects())
    # sort by stage_number then payment_name
    payment_types.sort(key=lambda pt: ((pt.stage.stage_number if pt.stage else 0), pt.payment_name))
    return jsonify({
        'data': [
            {
                'payment_type_id': str(pt.id),
                'stage_id': str(pt.stage.id) if pt.stage else None,
                'stage_name': pt.stage.stage_name if pt.stage else None,
                'stage_number': pt.stage.stage_number if pt.stage else None,
                'payment_name': pt.payment_name,
                'default_amount': pt.default_amount,
                'description': pt.description
            } for pt in payment_types
        ]
    })


@payment_type_bp.route('/payment-types', methods=['POST'])
@jwt_required()
def create_payment_type():
    current_user_id = get_jwt_identity()
    admin_user = User.objects(id=current_user_id).first()
    if not admin_user or admin_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403

    data = request.json
    stage = Stage.objects(id=data['stage_id']).first()
    if not stage:
        return jsonify({'error': 'Stage not found'}), 404

    existing = PaymentType.objects(stage=stage.id, payment_name=data['payment_name']).first()
    if existing:
        return jsonify({'error': f'Payment type "{data["payment_name"]}" already exists for this stage'}), 400

    payment_type = PaymentType(
        stage=stage,
        payment_name=data['payment_name'],
        default_amount=float(data['default_amount']),
        description=data.get('description', '')
    )
    payment_type.save()

    log_action(
        action="CREATE",
        module="PaymentTypes",
        target_id=str(payment_type.id),
        message=f"Created payment type: {payment_type.payment_name} for Stage {stage.stage_number}",
        new_values=data
    )

    return jsonify({
        'message': 'Payment type created',
        'data': {
            'payment_type_id': str(payment_type.id),
            'stage_id': str(payment_type.stage.id) if payment_type.stage else None,
            'payment_name': payment_type.payment_name,
            'default_amount': payment_type.default_amount,
            'description': payment_type.description
        }
    }), 201


@payment_type_bp.route('/payment-types/<payment_type_id>', methods=['PUT'])
@jwt_required()
def update_payment_type(payment_type_id):
    current_user_id = get_jwt_identity()
    admin_user = User.objects(id=current_user_id).first()
    if not admin_user or admin_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403

    payment_type = PaymentType.objects(id=payment_type_id).first()
    if not payment_type:
        return jsonify({'message': 'Payment type not found'}), 404

    old_values = {
        'stage_id': str(payment_type.stage.id) if payment_type.stage else None,
        'payment_name': payment_type.payment_name,
        'default_amount': payment_type.default_amount,
        'description': payment_type.description
    }
    data = request.json

    if 'stage_id' in data:
        stage = Stage.objects(id=data['stage_id']).first()
        if not stage:
            return jsonify({'error': 'Stage not found'}), 404

    new_stage = Stage.objects(id=data.get('stage_id', (payment_type.stage.id if payment_type.stage else None))).first()
    new_payment_name = data.get('payment_name', payment_type.payment_name)

    if (new_payment_name != payment_type.payment_name) or (new_stage and payment_type.stage and new_stage.id != payment_type.stage.id):
        existing = PaymentType.objects(stage=new_stage.id if new_stage else None, payment_name=new_payment_name).first()
        if existing and str(existing.id) != str(payment_type_id):
            return jsonify({'error': f'Payment type "{new_payment_name}" already exists for this stage'}), 400

    if 'stage_id' in data:
        payment_type.stage = new_stage
    payment_type.payment_name = data.get('payment_name', payment_type.payment_name)
    payment_type.default_amount = float(data.get('default_amount', payment_type.default_amount))
    payment_type.description = data.get('description', payment_type.description)

    payment_type.save()

    log_action(
        action="UPDATE",
        module="PaymentTypes",
        target_id=str(payment_type.id),
        message=f"Updated payment type: {payment_type.payment_name}",
        old_values=old_values,
        new_values=data
    )

    return jsonify({
        'message': 'Payment type updated',
        'data': {
            'payment_type_id': str(payment_type.id),
            'stage_id': str(payment_type.stage.id) if payment_type.stage else None,
            'payment_name': payment_type.payment_name,
            'default_amount': payment_type.default_amount,
            'description': payment_type.description
        }
    })


@payment_type_bp.route('/payment-types/<payment_type_id>', methods=['DELETE'])
@jwt_required()
def delete_payment_type(payment_type_id):
    current_user_id = get_jwt_identity()
    admin_user = User.objects(id=current_user_id).first()
    if not admin_user or admin_user.role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403

    payment_type = PaymentType.objects(id=payment_type_id).first()
    if not payment_type:
        return jsonify({'message': 'Payment type not found'}), 404

    # Check if payments exist with this type name (string match as per existing logic)
    payments_count = Payment.objects(payment_type=payment_type.payment_name).count()
    if payments_count > 0:
        return jsonify({
            'error': f'Cannot delete payment type with {payments_count} existing payment(s). Remove payments first.'
        }), 400

    pt_name = payment_type.payment_name
    payment_type.delete()

    log_action(
        action="DELETE",
        module="PaymentTypes",
        target_id=payment_type_id,
        message=f"Deleted payment type: {pt_name}"
    )

    return jsonify({'message': 'Payment type deleted'}), 200
