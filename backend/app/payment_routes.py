from flask import Blueprint, request, jsonify, current_app, make_response
from app.models import Payment, Client, Stage, PaymentType, ClientStage, ClientPaymentType, User
from app.payment_utils import get_applicable_amount, get_client_total_expected, check_stage_completion
from datetime import datetime
import os
from flask_jwt_extended import jwt_required
from app.audit_utils import log_action
from app.notification_utils import notify_payment_recorded
from bson.objectid import ObjectId


def _resolve_client(identifier):
    """Resolve a client by ObjectId, file_number, or exact full_name."""
    if not identifier:
        return None, (jsonify({'error': 'client identifier is required'}), 400)

    try:
        ObjectId(str(identifier))
        client = Client.objects(id=identifier).first()
        if client:
            return client, None
    except Exception:
        client = None

    client = Client.objects(file_number=identifier).first()
    if client:
        return client, None

    matches = Client.objects(full_name=identifier)
    if matches.count() == 1:
        return matches.first(), None
    elif matches.count() > 1:
        return None, (jsonify({'error': 'Multiple clients match that name; use file_number or id'}), 400)

    return None, (jsonify({'error': 'Client not found'}), 404)


def _number_to_words(amount):
    """Convert number to words (e.g., 500 -> 'Five Hundred Ghana Cedis')."""
    try:
        from num2words import num2words
        words = num2words(amount, lang='en', to='cardinal')
        return f"{words.capitalize()} Ghana Cedis"
    except Exception:
        return f"{amount:,.2f} Ghana Cedis"


def _build_receipt_html(payment, client):
    """Build receipt HTML directly from payment + client objects."""
    receipt_number = payment.receipt_number or ''
    receipt_date = payment.payment_date or datetime.utcnow()
    formatted_date = receipt_date.strftime('%d/%m/%Y')
    amount = payment.amount or 0
    amount_in_words = _number_to_words(amount)
    payment_type = payment.payment_type or ''
    payment_amount_str = f"GHS {amount:,.2f}"
    client_name = client.full_name if client else 'Unknown'

    name_of_association = client_name
    if client and client.local_association:
        try:
            name_of_association = client.local_association.association_name
        except Exception:
            pass

    pt = payment_type.lower().strip()
    site_plan_value = payment_amount_str if pt in ['site plan', 'siteplan'] else ''
    indenture_value = payment_amount_str if pt == 'indenture' else ''
    pvlmd_value = payment_amount_str if pt in ['p.v.l.m.d.', 'pvlmd', 'p.v.l.m.d'] else ''
    dues_value = payment_amount_str if pt == 'dues' else ''
    # If no specific category matched, show in a generic row
    other_value = payment_amount_str if not any([site_plan_value, indenture_value, pvlmd_value, dues_value]) else ''

    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: Arial, sans-serif; padding: 20px; background: white; }}
        .receipt {{
            position: relative;
            padding-left: 170px;
            min-height: 600px;
            max-width: 900px;
            margin: 0 auto;
        }}
        .sidebar {{
            position: absolute;
            left: 0; top: 0;
            width: 155px;
            height: 100%;
            background: #4a5fc1;
            color: white;
            padding: 20px 15px;
            text-align: center;
        }}
        .sidebar-title {{
            font-size: 17px;
            font-weight: bold;
            line-height: 1.4;
            margin-bottom: 30px;
        }}
        .sidebar-subtitle {{
            font-size: 15px;
            font-weight: bold;
            margin-top: 20px;
        }}
        .receipt-header {{
            text-align: center;
            margin-bottom: 25px;
        }}
        .org-name {{
            color: #4a5fc1;
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 6px;
            text-transform: uppercase;
        }}
        .contact-info {{
            color: #4a5fc1;
            font-size: 13px;
            margin-bottom: 15px;
        }}
        .receipt-meta {{
            display: flex;
            justify-content: space-between;
            margin-bottom: 25px;
            font-size: 16px;
            font-weight: bold;
        }}
        .field-row {{
            margin-bottom: 16px;
            display: flex;
            align-items: baseline;
        }}
        .field-label {{
            color: #4a5fc1;
            font-weight: bold;
            font-size: 15px;
            min-width: 220px;
        }}
        .field-value {{
            flex: 1;
            border-bottom: 2px dotted #4a5fc1;
            min-height: 24px;
            padding-bottom: 2px;
            font-size: 15px;
        }}
        .signatures {{
            display: flex;
            gap: 30px;
            margin-top: 20px;
        }}
        .signatures .field-row {{
            flex: 1;
            margin-bottom: 0;
        }}
        .signatures .field-label {{
            min-width: 110px;
        }}
        @page {{ size: A4 landscape; margin: 0.5in; }}
        @media print {{
            body {{ padding: 0; }}
        }}
    </style>
</head>
<body>
<div class="receipt">
    <div class="sidebar">
        <div class="sidebar-title">COMMITTEE<br>OFFICIAL<br>RECEIPT</div>
        <div class="sidebar-subtitle">PAYMENT FOR</div>
    </div>

    <div class="receipt-header">
        <div class="org-name">NII BOIMAN SPORT COMPLEX<br>LANDS REGULARIZATION ASSOCIATION</div>
        <div class="contact-info">P.O. Box NB 688, Abeka - Accra. Telephone 0248 684 150</div>
    </div>

    <div class="receipt-meta">
        <span>N° {receipt_number}</span>
        <span>DATE: {formatted_date}</span>
    </div>

    <div class="field-row">
        <div class="field-label">Name Of Association</div>
        <div class="field-value">{name_of_association}</div>
    </div>
    <div class="field-row">
        <div class="field-label">Received From</div>
        <div class="field-value">{client_name}</div>
    </div>
    <div class="field-row">
        <div class="field-label">Amount In Words</div>
        <div class="field-value">{amount_in_words}</div>
    </div>
    <div class="field-row">
        <div class="field-label">Site Plan</div>
        <div class="field-value">{site_plan_value}</div>
    </div>
    <div class="field-row">
        <div class="field-label">Indenture</div>
        <div class="field-value">{indenture_value}</div>
    </div>
    <div class="field-row">
        <div class="field-label">P.V.L.M.D</div>
        <div class="field-value">{pvlmd_value}</div>
    </div>
    <div class="field-row">
        <div class="field-label">Dues</div>
        <div class="field-value">{dues_value}</div>
    </div>
    {f'<div class="field-row"><div class="field-label">{payment_type}</div><div class="field-value">{other_value}</div></div>' if other_value else ''}

    <div class="signatures">
        <div class="field-row">
            <div class="field-label">Paid By</div>
            <div class="field-value">{client_name}</div>
        </div>
        <div class="field-row">
            <div class="field-label">Received By</div>
            <div class="field-value">Administrator</div>
        </div>
    </div>
</div>
</body>
</html>"""


payment_bp = Blueprint('payment_bp', __name__)


@payment_bp.route('/payments', methods=['POST'])
@jwt_required()
def add_payment():
    data = request.json

    required_fields = ['payment_type', 'amount', 'receipt_number']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'{field} is required'}), 400

    client_identifier = data.get('client_identifier') or data.get('client_id')
    if not client_identifier:
        return jsonify({'error': 'client identifier (client_id or client_identifier) is required'}), 400
    client, err = _resolve_client(client_identifier)
    if err:
        return err

    stage_id = data.get('stage_id')
    if not stage_id:
        return jsonify({'error': 'stage_id is required'}), 400

    stage = Stage.objects(id=stage_id).first()
    if not stage:
        return jsonify({'error': 'Stage not found'}), 404

    existing_payment = Payment.objects(receipt_number=data['receipt_number']).first()
    if existing_payment:
        return jsonify({'error': 'Receipt number already exists'}), 400

    payment_type_obj = PaymentType.objects(stage=stage_id, payment_name=data['payment_type']).first()

    if payment_type_obj:
        total_paid_for_type = sum(
            p.amount for p in Payment.objects(
                client=client.id, stage=stage_id,
                payment_type=data['payment_type'], status='paid'
            )
        ) or 0

        applicable_amount = get_applicable_amount(client.id, payment_type_obj.id)
        new_total = total_paid_for_type + float(data['amount'])

        if total_paid_for_type >= applicable_amount:
            return jsonify({'error': f'Payment for {data["payment_type"]} already fully paid.'}), 400

        if new_total > applicable_amount:
            return jsonify({
                'error': f'Payment amount would exceed required amount. Remaining: GHS {(applicable_amount - total_paid_for_type):,.2f}'
            }), 400

    recorded_by = None
    if data.get('recorded_by_id'):
        recorded_by = User.objects(id=data.get('recorded_by_id')).first()

    payment = Payment(
        client=client,
        stage=stage,
        payment_type=data['payment_type'],
        amount=float(data['amount']),
        payment_date=datetime.utcnow(),
        receipt_number=data['receipt_number'],
        payment_method=data.get('payment_method', 'cash'),
        status='paid',
        recorded_by=recorded_by
    )
    payment.save()

    log_action(
        action="CREATE",
        module="Payments",
        target_id=str(payment.id),
        message=f"Recorded payment of GHS {payment.amount:,.2f} for {client.full_name} ({payment.payment_type})",
        new_values={
            'amount': payment.amount,
            'receipt': payment.receipt_number,
            'type': payment.payment_type
        }
    )

    try:
        if client.phone:
            notify_payment_recorded(client.full_name, client.phone, payment.amount, payment.receipt_number)
    except Exception as e:
        print(f"Notification failed: {e}")

    check_stage_completion(str(client.id), str(stage.id))

    total_all_paid = sum(p.amount for p in Payment.objects(client=client.id, status='paid')) or 0
    client_total_expected = get_client_total_expected(client.id)

    if total_all_paid >= client_total_expected:
        client.status = 'completed'
        client.completion_date = datetime.utcnow()
        client.save()

    # Store receipt_path as the API URL (no file needed — generated on demand)
    receipt_path = f"/api/receipts/{str(payment.id)}"
    payment.receipt_path = receipt_path
    payment.save()

    return jsonify({
        'message': 'Payment recorded successfully',
        'payment_id': str(payment.id),
        'amount_paid': data['amount'],
        'receipt_path': receipt_path
    }), 201


@payment_bp.route('/receipts/<payment_id>', methods=['GET'])
@jwt_required()
def get_payment_receipt_file(payment_id):
    """Generate and return receipt PDF on the fly — no disk storage needed."""
    payment = Payment.objects(id=payment_id).first()
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404

    client = payment.client
    if not client:
        return jsonify({'error': 'Client not found for this payment'}), 404

    format_type = request.args.get('format', 'pdf')

    html_content = _build_receipt_html(payment, client)

    if format_type == 'html':
        # Return HTML directly (useful for print preview in browser)
        response = make_response(html_content)
        response.headers['Content-Type'] = 'text/html; charset=utf-8'
        return response

    # Generate PDF on the fly
    try:
        from xhtml2pdf import pisa
        import io
        pdf_buffer = io.BytesIO()
        pisa_status = pisa.CreatePDF(html_content, dest=pdf_buffer)

        if pisa_status.err:
            return jsonify({'error': f'PDF generation failed: {pisa_status.err}'}), 500

        pdf_buffer.seek(0)
        filename = f"receipt_{payment.receipt_number or payment_id}.pdf"
        response = make_response(pdf_buffer.read())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'inline; filename="{filename}"'
        return response

    except ImportError:
        # xhtml2pdf not available — return HTML as fallback
        response = make_response(html_content)
        response.headers['Content-Type'] = 'text/html; charset=utf-8'
        return response


@payment_bp.route('/payments/<client_id>', methods=['GET'])
@jwt_required()
def get_client_payments(client_id):
    client, err = _resolve_client(client_id)
    if err:
        return err

    payments = Payment.objects(client=client.id).order_by('-payment_date')

    payments_data = []
    for payment in payments:
        payments_data.append({
            'payment_id': str(payment.id),
            'stage_id': str(payment.stage.id) if payment.stage else None,
            'stage_name': payment.stage.stage_name if payment.stage else 'Unknown',
            'payment_type': payment.payment_type,
            'amount': payment.amount,
            'payment_date': payment.payment_date.isoformat() if payment.payment_date else None,
            'receipt_number': payment.receipt_number,
            'payment_method': payment.payment_method,
            'status': payment.status,
            'receipt_path': f"/api/receipts/{str(payment.id)}"
        })

    return jsonify(payments_data)


@payment_bp.route('/payments/<client_id>/available-types', methods=['GET'])
def get_available_payment_types(client_id):
    client, err = _resolve_client(client_id)
    if err:
        return err

    stage = Stage.objects(stage_number=client.current_stage).first()
    if not stage:
        return jsonify({'error': 'Stage not found'}), 404

    payment_types = PaymentType.objects(stage=stage.id)

    types_data = []
    for pt in payment_types:
        total_paid = sum(p.amount for p in Payment.objects(
            client=client.id, stage=stage.id,
            payment_type=pt.payment_name, status='paid'
        )) or 0
        required_amount = get_applicable_amount(client.id, pt.id)
        remaining = required_amount - total_paid

        types_data.append({
            'payment_type': pt.payment_name,
            'required_amount': required_amount,
            'paid_amount': total_paid,
            'remaining_amount': max(0, remaining)
        })

    return jsonify({
        'stage_name': stage.stage_name,
        'stage_number': stage.stage_number,
        'available_payment_types': types_data
    })


@payment_bp.route('/payments/<client_id>/outstanding-balance', methods=['GET'])
def get_outstanding_balance(client_id):
    client, err = _resolve_client(client_id)
    if err:
        return err

    total_expected = get_client_total_expected(client.id)
    total_paid = sum(p.amount for p in Payment.objects(client=client.id, status='paid')) or 0
    outstanding_balance = total_expected - total_paid

    all_payment_types = PaymentType.objects()
    breakdown = []
    for pt in all_payment_types:
        paid_for_type = sum(p.amount for p in Payment.objects(
            client=client.id,
            stage=pt.stage.id if pt.stage else None,
            payment_type=pt.payment_name,
            status='paid'
        )) or 0
        required_amount = get_applicable_amount(client.id, pt.id)
        remaining = required_amount - paid_for_type
        breakdown.append({
            'payment_type': pt.payment_name,
            'stage_name': pt.stage.stage_name if pt.stage else 'Unknown',
            'required_amount': required_amount,
            'paid_amount': paid_for_type,
            'outstanding_amount': max(0, remaining),
            'is_complete': paid_for_type >= required_amount
        })

    return jsonify({
        'client_id': str(client.id),
        'client_name': client.full_name,
        'total_expected': total_expected,
        'total_paid': float(total_paid),
        'outstanding_balance': max(0, outstanding_balance),
        'breakdown': breakdown
    })


@payment_bp.route('/stages/<stage_id>/payment-types', methods=['GET'])
def get_payment_types_by_stage(stage_id):
    stage = Stage.objects(id=stage_id).first()
    if not stage:
        return jsonify({'error': 'Stage not found'}), 404

    payment_types = PaymentType.objects(stage=stage.id)

    types_data = [{
        'payment_type': pt.payment_name,
        'required_amount': pt.default_amount,
        'description': pt.description
    } for pt in payment_types]

    return jsonify({
        'stage_name': stage.stage_name,
        'stage_number': stage.stage_number,
        'payment_types': types_data
    })