import mongoengine as me
import mongomock
from datetime import datetime

from app.models import Client, Stage, PaymentType, Payment


def setup_module(module):
    # connect to in-memory MongoDB using mongomock
    me.connect(
        "testdb",
        host="mongodb://localhost",
        mongo_client_class=mongomock.MongoClient
    )


def teardown_module(module):
    me.disconnect()


def test_create_payment_flow():
    # create stage
    stage = Stage(stage_number=1, stage_name="Stage 1").save()

    # create payment type
    pt = PaymentType(
        stage=stage,
        payment_name="Registration",
        default_amount=100.0
    ).save()

    # create client
    client = Client(
        file_number="F001",
        full_name="Test User",
        current_stage=1
    ).save()

    # create payment
    p = Payment(
        client=client,
        stage=stage,
        payment_type=pt.payment_name,
        amount=100.0,
        receipt_number="R001"
    ).save()

    # assertions
    assert p.amount == 100.0
    assert p.receipt_number == "R001"

    # verify relations
    assert str(p.client.id) == str(client.id)
    assert str(stage.id) == str(p.stage.id)