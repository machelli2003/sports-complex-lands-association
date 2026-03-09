from flask import Blueprint, request, jsonify, current_app, send_from_directory
from app.models import Payment, Client, Stage, PaymentType, ClientStage, ClientPaymentType, User
from app.payment_utils import get_applicable_amount, get_client_total_expected, check_stage_completion
from datetime import datetime
import os
from flask_jwt_extended import jwt_required
from app.audit_utils import log_action
from app.notification_utils import notify_payment_recorded
# using MongoEngine for DB operations

from bson.objectid import ObjectId


def _resolve_client(identifier):
    """Resolve a client by ObjectId, file_number, or exact full_name.

    Returns tuple (client, error_response)
    """
    if not identifier:
        return None, (jsonify({'error': 'client identifier is required'}), 400)

    # Try ObjectId first
    try:
        ObjectId(str(identifier))
        client = Client.objects(id=identifier).first()
        if client:
            return client, None
    except Exception:
        # not an ObjectId, continue
        client = None

    # Try file_number
    client = Client.objects(file_number=identifier).first()
    if client:
        return client, None

    # Try exact full_name match
    matches = Client.objects(full_name=identifier)
    if matches.count() == 1:
        return matches.first(), None
    elif matches.count() > 1:
        return None, (jsonify({'error': 'Multiple clients match that name; use file_number or id'}), 400)

    return None, (jsonify({'error': 'Client not found'}), 404)

payment_bp = Blueprint('payment_bp', __name__)

@payment_bp.route('/payments', methods=['POST'])
@jwt_required()
def add_payment():
    data = request.json

    required_fields = ['payment_type', 'amount', 'receipt_number']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'{field} is required'}), 400

    # support client identifier as ObjectId, file_number, or full_name
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
        total_paid_for_type = sum(p.amount for p in Payment.objects(client=client.id, stage=stage_id, payment_type=data['payment_type'], status='paid')) or 0

        applicable_amount = get_applicable_amount(client.id, payment_type_obj.id)

        new_total = total_paid_for_type + float(data['amount'])
        if total_paid_for_type >= applicable_amount:
            return jsonify({
                'error': f'Payment for {data["payment_type"]} already fully paid.'
            }), 400

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

    response = {
        'message': 'Payment recorded successfully',
        'payment_id': str(payment.id),
        'amount_paid': data['amount']
    }

    try:
        receipt_path = generate_receipt(str(payment.id), client.full_name, payment.amount, payment.payment_type)
        payment.receipt_path = receipt_path
        payment.save()
    except Exception as e:
        print(f"Error generating receipt: {e}")
        receipt_path = None

    response['receipt_path'] = receipt_path
    return jsonify(response), 201

@payment_bp.route('/receipts/<payment_id>', methods=['GET'])
@jwt_required()
def get_payment_receipt_file(payment_id):
    payment = Payment.objects(id=payment_id).first()
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    
    if not payment.receipt_path:
        return jsonify({'error': 'No receipt found'}), 404
    
    filename = payment.receipt_path.split('/')[-1]
    receipts_dir = os.path.join(current_app.instance_path, 'receipts')
    
    if not os.path.exists(os.path.join(receipts_dir, filename)):
        return jsonify({'error': 'Receipt file not found'}), 404
    
    return send_from_directory(receipts_dir, filename)

@payment_bp.route('/payments/<client_id>', methods=['GET'])
@jwt_required()
def get_client_payments(client_id):
    # Accept either ObjectId, file_number, or full_name in the path
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
            'receipt_path': payment.receipt_path
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
        total_paid = sum(p.amount for p in Payment.objects(client=client.id, stage=stage.id, payment_type=pt.payment_name, status='paid')) or 0
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
        paid_for_type = sum(p.amount for p in Payment.objects(client=client.id, stage=pt.stage.id if pt.stage else None, payment_type=pt.payment_name, status='paid')) or 0
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

def _number_to_words(amount):
    """Convert number to words (e.g., 500 -> 'Five Hundred Ghana Cedis')."""
    try:
        from num2words import num2words
        words = num2words(amount, lang='en', to='cardinal')
        # Capitalize first letter
        words = words.capitalize()
        return f"{words} Ghana Cedis"
    except Exception as e:
        # Fallback if num2words fails
        return f"{amount:,.2f} Ghana Cedis"

def _get_receipt_html_template(receipt_type, data):
    """Generate HTML for receipt based on type (1 or 2)."""
    
    receipt_number = data.get('receipt_number', '')
    receipt_date = data.get('receipt_date', '')
    name_of_association = data.get('name_of_association', '')
    received_from = data.get('received_from', '')
    amount_in_words = data.get('amount_in_words', '')
    payment_type = data.get('payment_type', '')
    payment_amount = data.get('payment_amount', '')
    paid_by = data.get('paid_by', '')
    received_by = data.get('received_by', '')
    
    # Map payment type to receipt fields
    site_plan_value = payment_amount if payment_type.lower() in ['site plan', 'siteplan'] else ''
    indenture_value = payment_amount if payment_type.lower() == 'indenture' else ''
    pvlmd_value = payment_amount if payment_type.lower() in ['p.v.l.m.d.', 'pvlmd'] else ''
    dues_value = payment_amount if payment_type.lower() == 'dues' else ''
    
    if receipt_type == 1:
        # Receipt Type 1 - Nii Boiman Sport Complex
        formatted_date = receipt_date.strftime('%d/%m/%Y') if receipt_date else '.............................'
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                body {{ font-family: Arial, sans-serif; padding: 20px; }}
                .receipt-type-1 {{
                    position: relative;
                    padding-left: 160px;
                    min-height: 650px;
                }}
                .receipt-type-1 .sidebar {{
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 150px;
                    height: 100%;
                    background: linear-gradient(180deg, #4a5fc1 0%, #3d4db7 100%);
                    border: 3px solid #2a3a9f;
                    color: white;
                    padding: 20px 15px;
                    text-align: center;
                }}
                .receipt-type-1 .sidebar-title {{
                    font-size: 18px;
                    font-weight: bold;
                    line-height: 1.3;
                    margin-bottom: 40px;
                }}
                .receipt-type-1 .sidebar-subtitle {{
                    font-size: 16px;
                    font-weight: bold;
                    margin-top: 30px;
                }}
                .receipt-type-1 .receipt-header {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .receipt-type-1 .org-name {{
                    color: #4a5fc1;
                    font-size: 26px;
                    font-weight: bold;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                }}
                .receipt-type-1 .contact-info {{
                    color: #4a5fc1;
                    font-size: 15px;
                    margin-bottom: 20px;
                }}
                .receipt-type-1 .receipt-number {{
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                    font-size: 18px;
                }}
                .receipt-type-1 .receipt-number span {{
                    font-weight: bold;
                }}
                .receipt-type-1 .field-row {{
                    margin-bottom: 18px;
                    display: flex;
                    align-items: baseline;
                }}
                .receipt-type-1 .field-label {{
                    color: #4a5fc1;
                    font-weight: bold;
                    font-size: 18px;
                    min-width: 240px;
                }}
                .receipt-type-1 .field-value {{
                    flex: 1;
                    border-bottom: 3px dotted #4a5fc1;
                    min-height: 28px;
                    padding-bottom: 3px;
                    font-size: 17px;
                }}
                @page {{ size: A4 landscape; margin: 0.5in; }}
            </style>
        </head>
        <body>
            <div class="receipt-type-1">
                <div class="sidebar">
                    <div class="sidebar-title">COMMITTEE<br>OFFICIAL<br>RECEIPT</div>
                    <div class="sidebar-subtitle">PAYMENT FOR</div>
                </div>
                
                <div class="receipt-header">
                    <div class="org-name">NII BOIMAN SPORT COMPLEX<br>LANDS REGULARIZATION ASSOCAITION</div>
                    <div class="contact-info">P.O. Box NB 688, Abeka -Accra. Telephone 0248 684 150</div>
                </div>

                <div class="receipt-number">
                    <span>N° {receipt_number}</span>
                    <span>DATE: {formatted_date}</span>
                </div>

                <div class="field-row">
                    <div class="field-label">Name Of Association</div>
                    <div class="field-value">{name_of_association}</div>
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

                <div style="display: flex; gap: 30px; margin-top: 20px;">
                    <div class="field-row" style="flex: 1; margin-bottom: 0;">
                        <div class="field-label" style="min-width: 100px;">Paid By</div>
                        <div class="field-value">{paid_by}</div>
                    </div>
                    <div class="field-row" style="flex: 1; margin-bottom: 0;">
                        <div class="field-label" style="min-width: 120px;">Received By</div>
                        <div class="field-value">{received_by}</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
    else:
        # Receipt Type 2 - Boiman Asere's Sub Stool
        date = receipt_date if receipt_date else datetime.utcnow()
        dd = str(date.day).zfill(2)
        mm = str(date.month).zfill(2)
        yy = str(date.year)[-2:]
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                body {{ font-family: Arial, sans-serif; padding: 20px; }}
                .receipt-type-2 {{
                    position: relative;
                    padding-left: 110px;
                    min-height: 650px;
                }}
                .receipt-type-2 .eagle-logo {{
                    position: absolute;
                    left: 15px;
                    top: 15px;
                    width: 80px;
                    height: 80px;
                }}
                .receipt-type-2 .receipt-header {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .receipt-type-2 .org-name {{
                    font-size: 28px;
                    font-weight: bold;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }}
                .receipt-type-2 .subtitle {{
                    font-size: 16px;
                    margin-bottom: 5px;
                }}
                .receipt-type-2 .contact-info {{
                    font-size: 14px;
                    margin-bottom: 20px;
                }}
                .receipt-type-2 .receipt-title-section {{
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    padding: 12px;
                    border: 3px solid black;
                }}
                .receipt-type-2 .receipt-title {{
                    font-size: 22px;
                    font-weight: bold;
                }}
                .receipt-type-2 .receipt-number {{
                    font-size: 18px;
                }}
                .receipt-type-2 .date-box {{
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    justify-content: flex-end;
                    margin-bottom: 20px;
                }}
                .receipt-type-2 .date-field {{
                    width: 40px;
                    height: 35px;
                    border: 3px solid black;
                    text-align: center;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }}
                .receipt-type-2 .date-label {{
                    font-size: 14px;
                    font-weight: bold;
                }}
                .receipt-type-2 .field-row {{
                    margin-bottom: 20px;
                    display: flex;
                    align-items: baseline;
                }}
                .receipt-type-2 .field-label {{
                    font-weight: bold;
                    font-size: 18px;
                    min-width: 200px;
                }}
                .receipt-type-2 .field-value {{
                    flex: 1;
                    border-bottom: 3px solid black;
                    min-height: 28px;
                    padding-bottom: 3px;
                    font-size: 17px;
                }}
                .receipt-type-2 .dual-field {{
                    display: flex;
                    gap: 30px;
                }}
                .receipt-type-2 .dual-field .field-row {{
                    flex: 1;
                }}
                @page {{ size: A4 landscape; margin: 0.5in; }}
            </style>
        </head>
        <body>
            <div class="receipt-type-2">
                <div class="eagle-logo">
                    <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                        <path d="M50 10 L35 30 L25 25 L30 40 L20 45 L30 55 L25 70 L40 65 L50 80 L60 65 L75 70 L70 55 L80 45 L70 40 L75 25 L65 30 L50 10 Z M45 30 L50 20 L55 30 L50 40 Z M30 50 L40 45 L45 55 L35 60 Z M55 55 L60 45 L70 50 L65 60 Z M50 65 L45 70 L40 75 L50 85 L60 75 L55 70 Z" fill="black" stroke="black" stroke-width="1"/>
                    </svg>
                </div>
                
                <div class="receipt-header">
                    <div class="org-name">BOIMAN ASERE'S SUB STOOL</div>
                    <div class="subtitle">ASERE DIVISIONAL COUNCIL (KOTOPON GA STATE)</div>
                    <div class="contact-info">P.O. Box NB 688, Nii Boiman Accra<br>Tel: 0244 937 313 / 0201 919 669 / 0277 077 571</div>
                </div>

                <div class="receipt-title-section">
                    <div class="receipt-title">Official Receipt</div>
                    <div class="receipt-number">N° {receipt_number}</div>
                </div>

                <div class="date-box">
                    <div class="date-field">{dd[0] if len(dd) > 0 else ''}</div>
                    <div class="date-field">{dd[1] if len(dd) > 1 else ''}</div>
                    <div class="date-label">DD</div>
                    <div class="date-field">{mm[0] if len(mm) > 0 else ''}</div>
                    <div class="date-field">{mm[1] if len(mm) > 1 else ''}</div>
                    <div class="date-label">MM</div>
                    <div class="date-field">{yy[0] if len(yy) > 0 else ''}</div>
                    <div class="date-field">{yy[1] if len(yy) > 1 else ''}</div>
                    <div class="date-label">YY</div>
                </div>

                <div class="field-row">
                    <div class="field-label">Received from:</div>
                    <div class="field-value">{received_from}</div>
                </div>

                <div class="field-row">
                    <div class="field-label">Amount in Words:</div>
                    <div class="field-value">{amount_in_words}</div>
                </div>

                <div class="field-row">
                    <div class="field-label">Site Plan:</div>
                    <div class="field-value">{site_plan_value}</div>
                </div>

                <div class="field-row">
                    <div class="field-label">Indenture:</div>
                    <div class="field-value">{indenture_value}</div>
                </div>

                <div class="field-row">
                    <div class="field-label">P.V.L.M.D.:</div>
                    <div class="field-value">{pvlmd_value}</div>
                </div>

                <div class="field-row">
                    <div class="field-label">Dues:</div>
                    <div class="field-value">{dues_value}</div>
                </div>

                <div class="dual-field">
                    <div class="field-row">
                        <div class="field-label">Paid By:</div>
                        <div class="field-value">{paid_by}</div>
                    </div>
                    <div class="field-row">
                        <div class="field-label">Received By:</div>
                        <div class="field-value">{received_by}</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

def generate_receipt(payment_id, client_name, amount, payment_type):
    """Generate receipt PDF using HTML templates."""
    from xhtml2pdf import pisa

    payment = Payment.objects(id=payment_id).first()
    if not payment:
        raise ValueError(f"Payment with ID {payment_id} not found")

    client = payment.client if payment.client else Client.objects(id=getattr(payment, 'client', None)).first()

    receipt_type = 1
    receipt_date = payment.payment_date or datetime.utcnow()
    amount_in_words = _number_to_words(amount)

    name_of_association = client_name
    if client and client.local_association:
        name_of_association = client.local_association.association_name

    received_by = "Administrator"

    receipt_data = {
        'receipt_number': payment.receipt_number or '',
        'receipt_date': receipt_date,
        'name_of_association': name_of_association,
        'received_from': client_name,
        'amount_in_words': amount_in_words,
        'payment_type': payment_type or '',
        'payment_amount': f"GHS {amount:,.2f}",
        'paid_by': client_name,
        'received_by': received_by
    }

    html_content = _get_receipt_html_template(receipt_type, receipt_data)

    receipts_dir = os.path.join(current_app.instance_path, 'receipts')
    os.makedirs(receipts_dir, exist_ok=True)
    filename = f"receipt_{payment_id}.pdf"
    filepath = os.path.join(receipts_dir, filename)

    with open(filepath, 'wb') as pdf_file:
        pisa_status = pisa.CreatePDF(html_content, dest=pdf_file)

    if pisa_status.err:
        raise Exception(f"Error creating PDF: {pisa_status.err}")

    return f"/api/receipts/{payment_id}"




def _number_to_words(amount):
    """Convert number to words (e.g., 500 -> 'Five Hundred Ghana Cedis')."""
    try:
        from num2words import num2words
        words = num2words(amount, lang='en', to='cardinal')
        # Capitalize first letter
        words = words.capitalize()
        return f"{words} Ghana Cedis"
    except Exception as e:
        # Fallback if num2words fails
        return f"{amount:,.2f} Ghana Cedis"


def _get_receipt_html_template(receipt_type, data):
    """Generate HTML for receipt based on type (1 or 2)."""
    
    receipt_number = data.get('receipt_number', '')
    receipt_date = data.get('receipt_date', '')
    name_of_association = data.get('name_of_association', '')
    received_from = data.get('received_from', '')
    amount_in_words = data.get('amount_in_words', '')
    payment_type = data.get('payment_type', '')
    payment_amount = data.get('payment_amount', '')
    paid_by = data.get('paid_by', '')
    received_by = data.get('received_by', '')
    
    # Map payment type to receipt fields
    site_plan_value = payment_amount if payment_type.lower() in ['site plan', 'siteplan'] else ''
    indenture_value = payment_amount if payment_type.lower() == 'indenture' else ''
    pvlmd_value = payment_amount if payment_type.lower() in ['p.v.l.m.d.', 'pvlmd'] else ''
    dues_value = payment_amount if payment_type.lower() == 'dues' else ''
    
    if receipt_type == 1:
        # Receipt Type 1 - Nii Boiman Sport Complex
        formatted_date = receipt_date.strftime('%d/%m/%Y') if receipt_date else '.............................'
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                body {{ font-family: Arial, sans-serif; padding: 20px; }}
                .receipt-type-1 {{
                    position: relative;
                    padding-left: 160px;
                    min-height: 650px;
                }}
                .receipt-type-1 .sidebar {{
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 150px;
                    height: 100%;
                    background: linear-gradient(180deg, #4a5fc1 0%, #3d4db7 100%);
                    border: 3px solid #2a3a9f;
                    color: white;
                    padding: 20px 15px;
                    text-align: center;
                }}
                .receipt-type-1 .sidebar-title {{
                    font-size: 18px;
                    font-weight: bold;
                    line-height: 1.3;
                    margin-bottom: 40px;
                }}
                .receipt-type-1 .sidebar-subtitle {{
                    font-size: 16px;
                    font-weight: bold;
                    margin-top: 30px;
                }}
                .receipt-type-1 .receipt-header {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .receipt-type-1 .org-name {{
                    color: #4a5fc1;
                    font-size: 26px;
                    font-weight: bold;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                }}
                .receipt-type-1 .contact-info {{
                    color: #4a5fc1;
                    font-size: 15px;
                    margin-bottom: 20px;
                }}
                .receipt-type-1 .receipt-number {{
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                    font-size: 18px;
                }}
                .receipt-type-1 .receipt-number span {{
                    font-weight: bold;
                }}
                .receipt-type-1 .field-row {{
                    margin-bottom: 18px;
                    display: flex;
                    align-items: baseline;
                }}
                .receipt-type-1 .field-label {{
                    color: #4a5fc1;
                    font-weight: bold;
                    font-size: 18px;
                    min-width: 240px;
                }}
                .receipt-type-1 .field-value {{
                    flex: 1;
                    border-bottom: 3px dotted #4a5fc1;
                    min-height: 28px;
                    padding-bottom: 3px;
                    font-size: 17px;
                }}
                @page {{ size: A4 landscape; margin: 0.5in; }}
            </style>
        </head>
        <body>
            <div class="receipt-type-1">
                <div class="sidebar">
                    <div class="sidebar-title">COMMITTEE<br>OFFICIAL<br>RECEIPT</div>
                    <div class="sidebar-subtitle">PAYMENT FOR</div>
                </div>
                
                <div class="receipt-header">
                    <div class="org-name">NII BOIMAN SPORT COMPLEX<br>LANDS REGULARIZATION ASSOCAITION</div>
                    <div class="contact-info">P.O. Box NB 688, Abeka -Accra. Telephone 0248 684 150</div>
                </div>

                <div class="receipt-number">
                    <span>N° {receipt_number}</span>
                    <span>DATE: {formatted_date}</span>
                </div>

                <div class="field-row">
                    <div class="field-label">Name Of Association</div>
                    <div class="field-value">{name_of_association}</div>
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

                <div style="display: flex; gap: 30px; margin-top: 20px;">
                    <div class="field-row" style="flex: 1; margin-bottom: 0;">
                        <div class="field-label" style="min-width: 100px;">Paid By</div>
                        <div class="field-value">{paid_by}</div>
                    </div>
                    <div class="field-row" style="flex: 1; margin-bottom: 0;">
                        <div class="field-label" style="min-width: 120px;">Received By</div>
                        <div class="field-value">{received_by}</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
    else:
        # Receipt Type 2 - Boiman Asere's Sub Stool
        date = receipt_date if receipt_date else datetime.utcnow()
        dd = str(date.day).zfill(2) if hasattr(date, 'day') else ''
        mm = str(date.month).zfill(2) if hasattr(date, 'month') else ''
        yy = str(date.year)[-2:] if hasattr(date, 'year') else ''
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                body {{ font-family: Arial, sans-serif; padding: 20px; }}
                .receipt-type-2 {{
                    position: relative;
                    padding-left: 110px;
                    min-height: 650px;
                }}
                .receipt-type-2 .eagle-logo {{
                    position: absolute;
                    left: 15px;
                    top: 15px;
                    width: 80px;
                    height: 80px;
                }}
                .receipt-type-2 .receipt-header {{
                    text-align: center;
                    margin-bottom: 30px;
                }}
                .receipt-type-2 .org-name {{
                    font-size: 28px;
                    font-weight: bold;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }}
                .receipt-type-2 .subtitle {{
                    font-size: 16px;
                    margin-bottom: 5px;
                }}
                .receipt-type-2 .contact-info {{
                    font-size: 14px;
                    margin-bottom: 20px;
                }}
                .receipt-type-2 .receipt-title-section {{
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    padding: 12px;
                    border: 3px solid black;
                }}
                .receipt-type-2 .receipt-title {{
                    font-size: 22px;
                    font-weight: bold;
                }}
                .receipt-type-2 .receipt-number {{
                    font-size: 18px;
                }}
                .receipt-type-2 .date-box {{
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    justify-content: flex-end;
                    margin-bottom: 20px;
                }}
                .receipt-type-2 .date-field {{
                    width: 40px;
                    height: 35px;
                    border: 3px solid black;
                    text-align: center;
                    font-size: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }}
                .receipt-type-2 .date-label {{
                    font-size: 14px;
                    font-weight: bold;
                }}
                .receipt-type-2 .field-row {{
                    margin-bottom: 20px;
                    display: flex;
                    align-items: baseline;
                }}
                .receipt-type-2 .field-label {{
                    font-weight: bold;
                    font-size: 18px;
                    min-width: 200px;
                }}
                .receipt-type-2 .field-value {{
                    flex: 1;
                    border-bottom: 3px solid black;
                    min-height: 28px;
                    padding-bottom: 3px;
                    font-size: 17px;
                }}
                .receipt-type-2 .dual-field {{
                    display: flex;
                    gap: 30px;
                }}
                .receipt-type-2 .dual-field .field-row {{
                    flex: 1;
                }}
                @page {{ size: A4 landscape; margin: 0.5in; }}
            </style>
        </head>
        <body>
            <div class="receipt-type-2">
                <div class="eagle-logo">
                    <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                        <path d="M50 10 L35 30 L25 25 L30 40 L20 45 L30 55 L25 70 L40 65 L50 80 L60 65 L75 70 L70 55 L80 45 L70 40 L75 25 L65 30 L50 10 Z M45 30 L50 20 L55 30 L50 40 Z M30 50 L40 45 L45 55 L35 60 Z M55 55 L60 45 L70 50 L65 60 Z M50 65 L45 70 L40 75 L50 85 L60 75 L55 70 Z" fill="black" stroke="black" stroke-width="1"/>
                    </svg>
                </div>
                
                <div class="receipt-header">
                    <div class="org-name">BOIMAN ASERE'S SUB STOOL</div>
                    <div class="subtitle">ASERE DIVISIONAL COUNCIL (KOTOPON GA STATE)</div>
                    <div class="contact-info">P.O. Box NB 688, Nii Boiman Accra<br>Tel: 0244 937 313 / 0201 919 669 / 0277 077 571</div>
                </div>

                <div class="receipt-title-section">
                    <div class="receipt-title">Official Receipt</div>
                    <div class="receipt-number">N° {receipt_number}</div>
                </div>

                <div class="date-box">
                    <div class="date-field">{dd[0] if len(dd) > 0 else ''}</div>
                    <div class="date-field">{dd[1] if len(dd) > 1 else ''}</div>
                    <div class="date-label">DD</div>
                    <div class="date-field">{mm[0] if len(mm) > 0 else ''}</div>
                    <div class="date-field">{mm[1] if len(mm) > 1 else ''}</div>
                    <div class="date-label">MM</div>
                    <div class="date-field">{yy[0] if len(yy) > 0 else ''}</div>
                    <div class="date-field">{yy[1] if len(yy) > 1 else ''}</div>
                    <div class="date-label">YY</div>
                </div>

                <div class="field-row">
                    <div class="field-label">Received from:</div>
                    <div class="field-value">{received_from}</div>
                </div>

                <div class="field-row">
                    <div class="field-label">Amount in Words:</div>
                    <div class="field-value">{amount_in_words}</div>
                </div>

                <div class="field-row">
                    <div class="field-label">Site Plan:</div>
                    <div class="field-value">{site_plan_value}</div>
                </div>

                <div class="field-row">
                    <div class="field-label">Indenture:</div>
                    <div class="field-value">{indenture_value}</div>
                </div>

                <div class="field-row">
                    <div class="field-label">P.V.L.M.D.:</div>
                    <div class="field-value">{pvlmd_value}</div>
                </div>

                <div class="field-row">
                    <div class="field-label">Dues:</div>
                    <div class="field-value">{dues_value}</div>
                </div>

                <div class="dual-field">
                    <div class="field-row">
                        <div class="field-label">Paid By:</div>
                        <div class="field-value">{paid_by}</div>
                    </div>
                    <div class="field-row">
                        <div class="field-label">Received By:</div>
                        <div class="field-value">{received_by}</div>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """


