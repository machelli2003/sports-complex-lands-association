from app.models import Payment, Client, Stage, PaymentType, ClientStage, ClientPaymentType
from datetime import datetime


def get_applicable_amount(client_id, payment_type_id):
    """Get the applicable amount for a client-payment type combination.
    Returns custom amount if set, otherwise returns default amount."""
    # Try to fetch custom amount first, fall back to payment type default.
    custom = ClientPaymentType.objects(client=client_id, payment_type=payment_type_id).first()
    if custom:
        return custom.custom_amount
    payment_type = PaymentType.objects(id=payment_type_id).only('default_amount').first()
    return payment_type.default_amount if payment_type else 0

def get_client_total_expected(client_id):
    """Calculate the total expected amount for a client based on custom/default amounts.

    Optimized: fetch all payment types once and all client-specific custom amounts
    in a single query to avoid N+1 database queries which can time out on remote
    DBs (e.g., Render -> Atlas latency).
    """
    # Fetch payment types (id + default_amount) once
    all_payment_types = list(PaymentType.objects().only('id', 'default_amount'))

    # Fetch all custom amounts for this client in one query
    client_customs = ClientPaymentType.objects(client=client_id)
    custom_map = {str(c.payment_type.id): c.custom_amount for c in client_customs}

    total = 0
    for pt in all_payment_types:
        total += custom_map.get(str(pt.id), pt.default_amount or 0)

    return total

def check_stage_completion(client_id, stage_id):
    """Check if a stage is completed and advance client to next stage"""
    payment_types = PaymentType.objects(stage=stage_id)

    if not payment_types:
        return

    total_expected = 0
    for pt in payment_types:
        total_expected += get_applicable_amount(client_id, pt.id)

    total_paid = sum(p.amount for p in Payment.objects(client=client_id, stage=stage_id, status='paid'))

    client_stage = ClientStage.objects(client=client_id, stage=stage_id).first()

    if not client_stage:
        client_stage = ClientStage(
            client=client_id,
            stage=stage_id,
            status='in_progress' if total_paid < total_expected else 'completed',
            start_date=datetime.utcnow()
        )
        if total_paid >= total_expected:
            client_stage.completion_date = datetime.utcnow()
        client_stage.save()

    if total_paid >= total_expected:
        client_stage.status = 'completed'
        if not client_stage.completion_date:
            client_stage.completion_date = datetime.utcnow()
        client_stage.save()

        current_stage_obj = Stage.objects(id=stage_id).first()
        if current_stage_obj:
            next_stage = Stage.objects(stage_number__gt=current_stage_obj.stage_number).order_by('stage_number').first()

            client = Client.objects(id=client_id).first()

            if next_stage and next_stage.stage_number <= 5:
                next_client_stage = ClientStage.objects(client=client_id, stage=next_stage.id).first()
                if not next_client_stage:
                    new_client_stage = ClientStage(
                        client=client_id,
                        stage=next_stage.id,
                        status='pending'
                    )
                    new_client_stage.save()

                if client and client.current_stage < next_stage.stage_number:
                    client.current_stage = next_stage.stage_number
                    client.save()
            else:
                check_overall_completion(client_id)
    else:
        if client_stage.status != 'completed':
            client_stage.status = 'in_progress'
            client_stage.save()

def check_overall_completion(client_id):
    """Check if all payments are done and mark client as completed"""
    total_all_paid = sum(p.amount for p in Payment.objects(client=client_id, status='paid')) or 0

    client_total_expected = get_client_total_expected(client_id)

    if total_all_paid >= client_total_expected:
        client = Client.objects(id=client_id).first()
        if client and client.status != 'completed':
            client.status = 'completed'
            client.completion_date = datetime.utcnow()
            client.save()
