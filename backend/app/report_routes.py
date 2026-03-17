from flask import Blueprint, request, jsonify, Response
from app.models import Payment, Client, Stage, PaymentType, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import csv
import io

report_bp = Blueprint('report_bp', __name__)


@report_bp.route('/reports/daily-revenue', methods=['GET'])
@jwt_required()
def get_daily_revenue():
    """Get daily revenue for the last 30 days"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)

    payments = Payment.objects(payment_date__gte=start_date, payment_date__lte=end_date, status='paid')

    totals_by_date = {}
    for p in payments:
        if not p.payment_date:
            continue
        d = p.payment_date.strftime('%Y-%m-%d')
        totals_by_date[d] = totals_by_date.get(d, 0) + float(p.amount)

    results = [{'date': d, 'total': totals_by_date[d]} for d in sorted(totals_by_date.keys())]
    return jsonify(results)


@report_bp.route('/reports/payment-types', methods=['GET'])
@jwt_required()
def get_payment_types_summary():
    """Get revenue grouped by payment type for the last 30 days"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)

    payments = Payment.objects(payment_date__gte=start_date, payment_date__lte=end_date, status='paid')

    totals_by_type = {}
    for p in payments:
        t = p.payment_type or 'Unknown'
        totals_by_type[t] = totals_by_type.get(t, 0) + float(p.amount)

    # sort by total desc
    sorted_types = sorted(totals_by_type.items(), key=lambda x: x[1], reverse=True)
    return jsonify([{'payment_type': t[0], 'total': t[1]} for t in sorted_types])


@report_bp.route('/reports/total-transactions', methods=['GET'])
@jwt_required()
def get_total_transactions():
    """Get total number of paid transactions"""
    total_transactions = Payment.objects(status='paid').count()
    return jsonify({'total_transactions': total_transactions})


@report_bp.route('/reports/outstanding-payments', methods=['GET'])
@jwt_required()
def get_outstanding_payments():
    """Get clients with outstanding payments for their current stage"""
    # Optimized implementation using server-side aggregation and raw collection
    # reads to avoid per-document dereferencing and many small queries.
    # Steps:
    #  - Load all clients (ids + meta)
    #  - Load stages mapping by stage_number
    #  - Load payment types grouped by stage id with default_amount
    #  - Load client-payment-type overrides for relevant clients
    #  - Aggregate paid totals per client+stage in the DB
    #  - Compute expected per client by summing payment type defaults overridden by customs

    # Load clients
    clients = list(Client.objects().only('id', 'full_name', 'file_number', 'current_stage'))
    if not clients:
        return jsonify([])

    # Map stage_number -> Stage (id + name)
    stages = {s.stage_number: {'id': str(s.id), 'name': s.stage_name} for s in Stage.objects().only('id', 'stage_number', 'stage_name')}

    # Load payment types grouped by stage id (use raw collection to avoid deref)
    pt_coll = PaymentType._get_collection()
    payment_types_by_stage = {}
    for doc in pt_coll.find({}, {'_id': 1, 'stage': 1, 'default_amount': 1}):
        stage_id = str(doc.get('stage')) if doc.get('stage') else None
        ptid = str(doc.get('_id'))
        if stage_id:
            payment_types_by_stage.setdefault(stage_id, []).append({'id': ptid, 'default_amount': doc.get('default_amount', 0) or 0})

    # Build list of client ids and map client metadata
    client_meta = {}
    client_ids = []
    for c in clients:
        cid = str(c.id)
        client_ids.append(c.id)
        client_meta[cid] = {'full_name': c.full_name, 'file_number': c.file_number, 'current_stage': c.current_stage}

    # Load client-payment-type overrides for these clients
    custom_map = {}
    try:
        cpt_coll = ClientPaymentType._get_collection()
        for doc in cpt_coll.find({'client': {'$in': client_ids}}, {'client':1, 'payment_type':1, 'custom_amount':1}):
            cid = str(doc.get('client')) if doc.get('client') else None
            ptid = str(doc.get('payment_type')) if doc.get('payment_type') else None
            if cid and ptid:
                custom_map.setdefault(cid, {})[ptid] = doc.get('custom_amount', 0) or 0
    except Exception:
        custom_map = {}

    # Aggregate paid totals by client and stage in DB
    paid_map = {}  # {(client_id, stage_id) -> total}
    try:
        pay_coll = Payment._get_collection()
        pipeline = [
            {'$match': {'status': 'paid', 'client': {'$in': client_ids}}},
            {'$group': {'_id': {'client': '$client', 'stage': '$stage'}, 'total': {'$sum': {'$ifNull': ['$amount', 0]}}}}
        ]
        for row in pay_coll.aggregate(pipeline):
            key = row.get('_id')
            if key and key.get('client'):
                cid = str(key.get('client'))
                sid = str(key.get('stage')) if key.get('stage') else None
                paid_map[(cid, sid)] = row.get('total', 0)
    except Exception:
        paid_map = {}

    outstanding = []
    for cid, meta in client_meta.items():
        cur_stage_num = meta.get('current_stage')
        stage_info = stages.get(cur_stage_num)
        if not stage_info:
            continue
        stage_id = stage_info['id']

        pts = payment_types_by_stage.get(stage_id, [])
        if not pts:
            continue

        # Compute expected using defaults + any client override
        total_expected = 0
        for pt in pts:
            ptid = pt['id']
            default = pt.get('default_amount', 0) or 0
            total_expected += custom_map.get(cid, {}).get(ptid, default)

        total_paid = paid_map.get((cid, stage_id), 0) or 0
        outstanding_amount = total_expected - total_paid
        if outstanding_amount > 0:
            outstanding.append({
                'client_id': cid,
                'client': meta.get('full_name'),
                'file_number': meta.get('file_number'),
                'total_expected': float(total_expected),
                'total_paid': float(total_paid),
                'outstanding_amount': float(outstanding_amount),
                'current_stage': cur_stage_num,
                'stage_name': stage_info.get('name')
            })

    outstanding.sort(key=lambda x: x['outstanding_amount'], reverse=True)
    return jsonify(outstanding)


@report_bp.route('/reports/completion-analytics', methods=['GET'])
@jwt_required()
def get_completion_analytics():
    """Get completion rates by stage"""
    stages = Stage.objects()
    completion_data = []

    for stage in stages:
        payments = Payment.objects(stage=stage.id, status='paid')
        unique_clients = set()
        for p in payments:
            if p.client:
                unique_clients.add(str(p.client.id))

        completion_data.append({
            'stage': stage.stage_name,
            'completed': len(unique_clients)
        })

    return jsonify(completion_data)


@report_bp.route('/reports/daily-revenue/export', methods=['GET'])
@jwt_required()
def export_daily_revenue():
    """Export daily revenue to CSV (Admin only)"""
    current_user_id = get_jwt_identity()
    user = User.objects(id=current_user_id).first() or User.objects(username=current_user_id).first()
    if not user or user.role != 'admin':
        return jsonify({'message': 'Admin access required for data export'}), 403

    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)

    payments = Payment.objects(payment_date__gte=start_date, payment_date__lte=end_date, status='paid')

    totals_by_date = {}
    for p in payments:
        if not p.payment_date:
            continue
        d = p.payment_date.strftime('%Y-%m-%d')
        totals_by_date[d] = totals_by_date.get(d, 0) + float(p.amount)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Date', 'Total Revenue (GHS)'])

    for d in sorted(totals_by_date.keys()):
        writer.writerow([d, str(totals_by_date[d])])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=daily_revenue.csv'}
    )


@report_bp.route('/reports/clients/export', methods=['GET'])
@jwt_required()
def export_clients():
    """Export all clients to CSV (Admin only)"""
    current_user_id = get_jwt_identity()
    user = User.objects(id=current_user_id).first() or User.objects(username=current_user_id).first()
    if not user or user.role != 'admin':
        return jsonify({'message': 'Admin access required for data export'}), 403

    clients = Client.objects()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Client ID', 'File Number', 'Full Name', 'Phone', 'Ghana Card', 'Current Stage', 'Status', 'Registration Date'])

    for client in clients:
        writer.writerow([
            str(client.id),
            client.file_number,
            client.full_name,
            client.phone or '',
            client.ghana_card_number or '',
            client.current_stage,
            client.status,
            client.registration_date.strftime('%Y-%m-%d') if client.registration_date else ''
        ])

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=clients.csv'}
    )
