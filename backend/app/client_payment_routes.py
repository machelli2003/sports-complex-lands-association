from flask import Blueprint, request, jsonify
from app.models import Client, PaymentType, ClientPaymentType, Payment, Stage
from flask_jwt_extended import jwt_required
from app.payment_utils import get_applicable_amount, get_client_total_expected, check_stage_completion

client_payment_bp = Blueprint('client_payment_bp', __name__)

@client_payment_bp.route('/clients/<client_id>/payment-amounts', methods=['GET'])
@jwt_required()
def get_client_payment_amounts(client_id):
    """Get all payment amounts configured for a specific client"""
    client = Client.objects(id=client_id).first()
    if not client:
        return jsonify({'error': 'Client not found'}), 404

    all_payment_types = PaymentType.objects()

    result = []
    for pt in all_payment_types:
        applicable_amount = get_applicable_amount(client_id, pt.id)

        custom_payment = ClientPaymentType.objects(client=client_id, payment_type=pt.id).first()

        total_paid = sum(p.amount for p in Payment.objects(client=client_id, stage=(pt.stage.id if pt.stage else None), payment_type=pt.payment_name, status='paid')) or 0

        result.append({
            'payment_type_id': str(pt.id),
            'payment_name': pt.payment_name,
            'stage_id': str(pt.stage.id) if pt.stage else None,
            'stage_name': pt.stage.stage_name if pt.stage else 'Unknown',
            'default_amount': pt.default_amount,
            'custom_amount': custom_payment.custom_amount if custom_payment else None,
            'has_custom_amount': custom_payment is not None,
            'applied_amount': applicable_amount,
            'total_paid': float(total_paid),
            'is_paid': total_paid >= applicable_amount
        })
    
    return jsonify({
        'client_id': str(client.id),
        'client_name': client.full_name,
        'payment_types': result
    })

@client_payment_bp.route('/clients/<client_id>/payment-amounts', methods=['POST'])
@jwt_required()
def set_client_payment_amounts(client_id):
    """Set custom payment amounts for a client (bulk update)"""
    client = Client.objects(id=client_id).first()
    if not client:
        return jsonify({'error': 'Client not found'}), 404
    data = request.json
    payment_amounts = data.get('payment_amounts', [])
    
    if not payment_amounts:
        return jsonify({'error': 'payment_amounts array is required'}), 400
    
    updated_count = 0
    errors = []
    affected_stages = set()
    
    for item in payment_amounts:
        payment_type_id = item.get('payment_type_id')
        custom_amount = item.get('custom_amount')
        
        if not payment_type_id or custom_amount is None:
            errors.append(f'Invalid data: {item}')
            continue
        
        payment_type = PaymentType.objects(id=payment_type_id).first()
        if not payment_type:
            errors.append(f'Payment type {payment_type_id} not found')
            continue
        
        # Validate amount is positive
        if float(custom_amount) < 0:
            errors.append(f'Amount must be positive for {payment_type.payment_name}')
            continue
        
        # Check if custom amount already exists
        existing = ClientPaymentType.objects(client=client_id, payment_type=payment_type_id).first()

        if existing:
            existing.custom_amount = float(custom_amount)
            existing.save()
        else:
            new_custom = ClientPaymentType(
                client=client_id,
                payment_type=payment_type_id,
                custom_amount=float(custom_amount)
            )
            new_custom.save()
        
        if payment_type.stage_id:
            affected_stages.add(payment_type.stage_id)
            
        updated_count += 1
    
    # No global transaction; individual saves done above
    
    # Check stage completion for all affected stages
    for stage_id in affected_stages:
        check_stage_completion(str(client_id), stage_id)
    
    return jsonify({
        'message': f'Successfully updated {updated_count} payment amounts',
        'updated_count': updated_count,
        'errors': errors if errors else None
    }), 200

@client_payment_bp.route('/clients/<client_id>/payment-amounts/<payment_type_id>', methods=['PUT'])
@jwt_required()
def update_single_payment_amount(client_id, payment_type_id):
    """Update a single payment amount for a client"""
    client = Client.objects(id=client_id).first()
    if not client:
        return jsonify({'error': 'Client not found'}), 404

    payment_type = PaymentType.objects(id=payment_type_id).first()
    if not payment_type:
        return jsonify({'error': 'Payment type not found'}), 404
    
    data = request.json
    custom_amount = data.get('custom_amount')
    
    if custom_amount is None:
        return jsonify({'error': 'custom_amount is required'}), 400
    
    if float(custom_amount) < 0:
        return jsonify({'error': 'Amount must be positive'}), 400
    
    # Check if custom amount already exists
    existing = ClientPaymentType.objects(client=client_id, payment_type=payment_type_id).first()

    if existing:
        existing.custom_amount = float(custom_amount)
        existing.save()
    else:
        new_custom = ClientPaymentType(
            client=client_id,
            payment_type=payment_type_id,
            custom_amount=float(custom_amount)
        )
        new_custom.save()
    
    # Check stage completion
    if payment_type.stage:
        check_stage_completion(str(client_id), payment_type.stage.id)
    
    return jsonify({
        'message': f'Payment amount updated for {payment_type.payment_name}',
        'payment_type': payment_type.payment_name,
        'custom_amount': float(custom_amount)
    }), 200

@client_payment_bp.route('/clients/<client_id>/payment-amounts/<payment_type_id>', methods=['DELETE'])
@jwt_required()
def delete_custom_payment_amount(client_id, payment_type_id):
    """Remove custom amount and revert to default"""
    client = Client.objects(id=client_id).first()
    if not client:
        return jsonify({'error': 'Client not found'}), 404

    existing = ClientPaymentType.objects(client=client_id, payment_type=payment_type_id).first()

    if not existing:
        return jsonify({'error': 'No custom amount set for this payment type'}), 404

    payment_type = PaymentType.objects(id=payment_type_id).first()

    existing.delete()

    # Check stage completion
    if payment_type and payment_type.stage:
        check_stage_completion(str(client_id), payment_type.stage.id)
    
    return jsonify({
        'message': 'Custom amount removed, reverted to default',
        'payment_type': payment_type.payment_name if payment_type else 'Unknown',
        'default_amount': payment_type.default_amount if payment_type else None
    }), 200

@client_payment_bp.route('/clients/<client_id>/total-amount', methods=['GET'])
@jwt_required()
def get_client_total_amount(client_id):
    """Calculate total amount a client needs to pay based on custom amounts (or defaults)"""
    client = Client.objects(id=client_id).first()
    if not client:
        return jsonify({'error': 'Client not found'}), 404

    total_expected = get_client_total_expected(client_id)

    all_payment_types = PaymentType.objects()
    breakdown = []

    for pt in all_payment_types:
        applied_amount = get_applicable_amount(client_id, pt.id)

        total_paid = sum(p.amount for p in Payment.objects(client=client_id, stage=(pt.stage.id if pt.stage else None), payment_type=pt.payment_name, status='paid')) or 0

        has_custom = ClientPaymentType.objects(client=client_id, payment_type=pt.id).first() is not None

        breakdown.append({
            'payment_name': pt.payment_name,
            'stage_name': pt.stage.stage_name if pt.stage else 'Unknown',
            'expected_amount': applied_amount,
            'is_custom': has_custom,
            'total_paid': float(total_paid),
            'remaining': max(0, applied_amount - total_paid)
        })

    total_paid_all = sum(p.amount for p in Payment.objects(client=client_id, status='paid')) or 0

    return jsonify({
        'client_id': str(client.id),
        'client_name': client.full_name,
        'total_expected': total_expected,
        'total_paid': float(total_paid_all),
        'outstanding_balance': max(0, total_expected - total_paid_all),
        'breakdown': breakdown
    })
