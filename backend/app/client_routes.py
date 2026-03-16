import os
import logging
from app.file_utils import validate_file
from flask import Blueprint, request, jsonify
from app.models import Client, LocalAssociation, Stage, ClientStage, Payment, PaymentType, ClientDocument, User, ClientPaymentType
from datetime import datetime, timedelta
from flask_jwt_extended import jwt_required
from app.payment_utils import get_client_total_expected
from app.audit_utils import log_action
from mongoengine.queryset.visitor import Q

client_bp = Blueprint('client_bp', __name__)


def _build_payment_lookups():
    """
    Build two dicts in bulk (no lazy dereferencing) so callers avoid N+1 queries:
      paid_map   : { str(client_id) -> total_paid }
      expected_map: { str(client_id) -> total_expected }

    Uses __raw__ aggregation and .scalar() / pk access to avoid ANY lazy
    ReferenceField dereferencing that would cause a per-document round-trip.
    """
    # 1. All payment types + defaults (one query)
    all_pts = list(PaymentType.objects().only('id', 'default_amount'))
    pt_defaults = {str(pt.id): (pt.default_amount or 0) for pt in all_pts}

    # 2. All custom client-payment-type overrides — use pk to avoid lazy load
    all_customs = list(ClientPaymentType.objects().only('client', 'payment_type', 'custom_amount'))
    custom_map = {}  # { str(client_id) -> { str(pt_id) -> amount } }
    for c in all_customs:
        try:
            # Access the raw pk (DBRef id) without triggering a fetch
            cid = str(c.client.pk) if c.client else None
            ptid = str(c.payment_type.pk) if c.payment_type else None
            if cid and ptid:
                custom_map.setdefault(cid, {})[ptid] = c.custom_amount
        except Exception:
            continue

    # 3. All paid payments — use .pk to avoid lazy ReferenceField load
    all_paid = list(Payment.objects(status='paid').only('client', 'amount'))
    paid_map = {}  # { str(client_id) -> total_paid }
    for p in all_paid:
        try:
            cid = str(p.client.pk) if p.client else None
            if cid:
                paid_map[cid] = paid_map.get(cid, 0) + (p.amount or 0)
        except Exception:
            continue

    # 4. Compute expected per client (one query for all client ids)
    all_client_ids = [str(c.id) for c in Client.objects().only('id')]
    expected_map = {}
    for cid in all_client_ids:
        client_customs = custom_map.get(cid, {})
        total = 0
        for ptid, default in pt_defaults.items():
            total += client_customs.get(ptid, default)
        expected_map[cid] = total

    return paid_map, expected_map


@client_bp.route('/clients', methods=['POST'])
@jwt_required()
def register_client():
    if 'passport_picture' in request.files:
        file = request.files['passport_picture']
        passport_picture_path = None

        if file and file.filename:
            is_valid, error = validate_file(file)
            if not is_valid:
                return jsonify({'error': f'Passport picture: {error}'}), 400

            filename = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
            file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'uploads', filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            file.save(file_path)
            passport_picture_path = filename

        client = Client(
            file_number=request.form['file_number'],
            full_name=request.form['full_name'],
            phone=request.form.get('phone'),
            ghana_card_number=request.form.get('ghana_card_number'),
            current_stage=1,
            registration_date=datetime.utcnow(),
            status='active',
            house_number=request.form.get('house_number'),
            gps_address=request.form.get('gps_address'),
            next_of_kin=request.form.get('next_of_kin'),
            passport_picture=passport_picture_path,
            marital_status=request.form.get('marital_status'),
            hometown=request.form.get('hometown'),
            place_of_stay=request.form.get('place_of_stay'),
            family_member_number=request.form.get('family_member_number')
        )
        if request.form.get('local_association_id'):
            assoc = LocalAssociation.objects(id=request.form['local_association_id']).first()
            if assoc:
                client.local_association = assoc

        if request.form.get('date_of_birth') and str(request.form.get('date_of_birth')).strip():
            client.date_of_birth = datetime.strptime(request.form['date_of_birth'], '%Y-%m-%d')
    else:
        data = request.json
        client = Client(
            file_number=data['file_number'],
            full_name=data['full_name'],
            phone=data.get('phone'),
            ghana_card_number=data.get('ghana_card_number'),
            current_stage=1,
            registration_date=datetime.utcnow(),
            status='active',
            house_number=data.get('house_number'),
            gps_address=data.get('gps_address'),
            next_of_kin=data.get('next_of_kin'),
            passport_picture=data.get('passport_picture'),
            marital_status=data.get('marital_status'),
            hometown=data.get('hometown'),
            place_of_stay=data.get('place_of_stay'),
            family_member_number=data.get('family_member_number')
        )
        if data.get('local_association_id'):
            assoc = LocalAssociation.objects(id=data['local_association_id']).first()
            if assoc:
                client.local_association = assoc

        if data.get('date_of_birth') and str(data.get('date_of_birth')).strip():
            client.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d')

    existing = Client.objects(file_number=client.file_number).first()
    if existing:
        return jsonify({'error': 'File number already exists'}), 400

    try:
        client.save()
    except Exception as ie:
        return jsonify({'error': 'Database error saving client'}), 400

    log_action(
        action="CREATE",
        module="Clients",
        target_id=str(client.id),
        message=f"Registered new client: {client.full_name} ({client.file_number})",
        new_values={
            'full_name': client.full_name,
            'file_number': client.file_number,
            'assoc_id': str(client.local_association.id) if client.local_association else None
        }
    )

    return jsonify({
        'message': 'Client registered',
        'client_id': str(client.id),
        'passport_picture': client.passport_picture
    }), 201


@client_bp.route('/clients/<client_id>', methods=['GET'])
@jwt_required()
def get_client(client_id):
    client = Client.objects(id=client_id).first()
    if not client:
        return jsonify({'message': 'Client not found'}), 404

    total_expected = get_client_total_expected(client_id)
    total_paid = sum(p.amount for p in Payment.objects(client=client_id, status='paid')) or 0
    outstanding_balance = max(0, total_expected - total_paid)

    return jsonify({
        'client_id': str(client.id),
        'file_number': client.file_number,
        'full_name': client.full_name,
        'phone': client.phone,
        'ghana_card_number': client.ghana_card_number,
        'local_association_id': str(client.local_association.id) if client.local_association else None,
        'current_stage': client.current_stage,
        'registration_date': client.registration_date,
        'completion_date': client.completion_date,
        'status': client.status,
        'house_number': client.house_number,
        'gps_address': client.gps_address,
        'hometown': client.hometown,
        'place_of_stay': client.place_of_stay,
        'next_of_kin': client.next_of_kin,
        'total_expected': total_expected,
        'total_paid': float(total_paid),
        'outstanding_balance': outstanding_balance
    })


@client_bp.route('/clients', methods=['GET'])
@jwt_required()
def get_all_clients():
    """Get all clients — uses bulk queries to avoid N+1 timeouts."""
    paid_map, expected_map = _build_payment_lookups()

    all_clients = list(Client.objects())
    clients_data = []

    for client in all_clients:
        cid = str(client.id)
        total_paid = paid_map.get(cid, 0)
        total_expected = expected_map.get(cid, 0)
        outstanding_balance = max(0, total_expected - total_paid)

        clients_data.append({
            'client_id': cid,
            'file_number': client.file_number,
            'full_name': client.full_name,
            'phone': client.phone,
            'ghana_card_number': client.ghana_card_number,
            'house_number': client.house_number,
            'gps_address': client.gps_address,
            'hometown': client.hometown,
            'place_of_stay': client.place_of_stay,
            'next_of_kin': client.next_of_kin,
            'current_stage': client.current_stage,
            'status': client.status,
            'total_paid': float(total_paid),
            'outstanding_balance': outstanding_balance
        })

    return jsonify(clients_data)


@client_bp.route('/clients/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    log = logging.getLogger(__name__)
    try:
        log.info('get_dashboard called')

        total_clients = Client.objects.count()
        active_clients = Client.objects(status='active').count()
        completed_clients = Client.objects(status='completed').count()

        # Stage counts — only fetch current_stage field
        stages_counts_map = {}
        for c in Client.objects.only('current_stage'):
            stages_counts_map[c.current_stage] = stages_counts_map.get(c.current_stage, 0) + 1

        stages_list = []
        for stage_num, count in stages_counts_map.items():
            s_obj = Stage.objects(stage_number=stage_num).first()
            stages_list.append({
                'name': s_obj.stage_name if s_obj else f'Stage {stage_num}',
                'count': count
            })

        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=365)

        # Monthly revenue — only fetch payment_date and amount (no client ref)
        payments_in_year = list(
            Payment.objects(payment_date__gte=start_date, status='paid').only('payment_date', 'amount')
        )
        revenue_map = {}
        for p in payments_in_year:
            month = p.payment_date.strftime('%Y-%m') if p.payment_date else 'unknown'
            revenue_map[month] = revenue_map.get(month, 0) + (p.amount or 0)

        formatted_revenue = [{'month': m, 'total': float(t)} for m, t in sorted(revenue_map.items())]

        # Recent payments — build a client_id -> name lookup to avoid lazy loads
        recent_payment_docs = list(
            Payment.objects(status='paid').order_by('-payment_date').only(
                'client', 'amount', 'payment_date', 'stage', 'payment_type'
            )[:10]
        )

        # Collect all client PKs from recent payments in one batch
        recent_client_pks = []
        for p in recent_payment_docs:
            try:
                pk = p.client.pk if p.client else None
                if pk:
                    recent_client_pks.append(pk)
            except Exception:
                pass

        # One query to get names for those clients
        client_name_map = {}
        if recent_client_pks:
            for c in Client.objects(id__in=recent_client_pks).only('id', 'full_name'):
                client_name_map[str(c.id)] = c.full_name

        # One query to get stage names
        stage_name_map = {}
        recent_stage_pks = []
        for p in recent_payment_docs:
            try:
                pk = p.stage.pk if p.stage else None
                if pk:
                    recent_stage_pks.append(pk)
            except Exception:
                pass
        if recent_stage_pks:
            for s in Stage.objects(id__in=recent_stage_pks).only('id', 'stage_name'):
                stage_name_map[str(s.id)] = s.stage_name

        recent_payments_data = []
        for p in recent_payment_docs:
            try:
                cid = str(p.client.pk) if p.client else None
                sid = str(p.stage.pk) if p.stage else None
                recent_payments_data.append({
                    'client_name': client_name_map.get(cid, 'Unknown') if cid else 'Unknown',
                    'amount': p.amount,
                    'date': p.payment_date.strftime('%Y-%m-%d') if p.payment_date else None,
                    'stage': stage_name_map.get(sid, 'Unknown') if sid else 'Unknown',
                    'payment_type': p.payment_type
                })
            except Exception:
                continue

        pending_payments_count = Payment.objects(status='pending').count()

        # Total revenue — only fetch amount (no client ref needed)
        total_revenue = sum(
            p.amount or 0
            for p in Payment.objects(status='paid').only('amount')
        )

        # Outstanding balance — bulk queries (no lazy loads)
        paid_map, expected_map = _build_payment_lookups()
        total_outstanding = 0
        clients_with_outstanding = 0
        for cid, expected in expected_map.items():
            paid = paid_map.get(cid, 0)
            outstanding = max(0, expected - paid)
            total_outstanding += outstanding
            if outstanding > 0:
                clients_with_outstanding += 1

        pending_verifications = ClientDocument.objects(verified=False).count()

        today = datetime.utcnow()
        this_month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_month_end = this_month_start - timedelta(seconds=1)
        last_month_start = last_month_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        this_month_revenue = sum(
            p.amount or 0
            for p in Payment.objects(
                payment_date__gte=this_month_start, status='paid'
            ).only('amount')
        )
        last_month_revenue = sum(
            p.amount or 0
            for p in Payment.objects(
                payment_date__gte=last_month_start,
                payment_date__lte=last_month_end,
                status='paid'
            ).only('amount')
        )

        return jsonify({
            'total_clients': total_clients,
            'active_clients': active_clients,
            'completed_clients': completed_clients,
            'stages': stages_list,
            'monthly_revenue': formatted_revenue,
            'recent_payments': recent_payments_data,
            'pending_payments_count': pending_payments_count,
            'total_revenue': float(total_revenue),
            'total_outstanding_balance': float(total_outstanding),
            'clients_with_outstanding': clients_with_outstanding,
            'action_items': {
                'pending_verifications': pending_verifications
            },
            'financial_health': {
                'this_month_revenue': float(this_month_revenue),
                'last_month_revenue': float(last_month_revenue),
                'performance_pct': (
                    (this_month_revenue - last_month_revenue) / last_month_revenue * 100
                ) if last_month_revenue > 0 else 0
            }
        })
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        log.exception('get_dashboard exception: %s', e)
        return jsonify({'error': 'Server error', 'details': str(e), 'trace': tb}), 500


@client_bp.route('/clients/search', methods=['GET'])
@jwt_required()
def search_clients():
    query_str = request.args.get('q', '')
    stage_filter = request.args.get('stage')
    status_filter = request.args.get('status')

    q = Q()
    if query_str:
        q &= (
            Q(full_name__icontains=query_str) |
            Q(file_number__icontains=query_str) |
            Q(phone__icontains=query_str) |
            Q(ghana_card_number__icontains=query_str)
        )
    if stage_filter:
        try:
            q &= Q(current_stage=int(stage_filter))
        except ValueError:
            pass
    if status_filter:
        q &= Q(status=status_filter)

    results = list(Client.objects(q)[:50])

    if not results:
        return jsonify([])

    # Bulk lookups for just these clients — use pk to avoid lazy loads
    result_ids = [c.id for c in results]

    all_pts = list(PaymentType.objects().only('id', 'default_amount'))
    pt_defaults = {str(pt.id): (pt.default_amount or 0) for pt in all_pts}

    all_customs = list(
        ClientPaymentType.objects(client__in=result_ids).only('client', 'payment_type', 'custom_amount')
    )
    custom_map = {}
    for c in all_customs:
        try:
            cid = str(c.client.pk) if c.client else None
            ptid = str(c.payment_type.pk) if c.payment_type else None
            if cid and ptid:
                custom_map.setdefault(cid, {})[ptid] = c.custom_amount
        except Exception:
            continue

    all_paid = list(
        Payment.objects(client__in=result_ids, status='paid').only('client', 'amount')
    )
    paid_map = {}
    for p in all_paid:
        try:
            cid = str(p.client.pk) if p.client else None
            if cid:
                paid_map[cid] = paid_map.get(cid, 0) + (p.amount or 0)
        except Exception:
            continue

    clients_data = []
    for client in results:
        cid = str(client.id)
        client_customs = custom_map.get(cid, {})
        total_expected = sum(client_customs.get(ptid, default) for ptid, default in pt_defaults.items())
        total_paid = paid_map.get(cid, 0)
        outstanding_balance = max(0, total_expected - total_paid)

        # local_association: use pk to avoid lazy load, only fetch name if needed
        assoc_id = None
        assoc_name = None
        try:
            if client.local_association:
                assoc_id = str(client.local_association.pk)
                assoc_name = client.local_association.association_name
        except Exception:
            pass

        clients_data.append({
            'client_id': cid,
            'file_number': client.file_number,
            'full_name': client.full_name,
            'phone': client.phone,
            'ghana_card_number': client.ghana_card_number,
            'local_association_id': assoc_id,
            'association_name': assoc_name,
            'current_stage': client.current_stage,
            'status': client.status,
            'registration_date': client.registration_date.strftime('%Y-%m-%d') if client.registration_date else None,
            'total_paid': float(total_paid),
            'outstanding_balance': outstanding_balance
        })

    return jsonify(clients_data)