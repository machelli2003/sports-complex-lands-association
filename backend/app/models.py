import mongoengine as me
from datetime import datetime


class LocalAssociation(me.Document):
    meta = {'collection': 'local_associations'}
    association_name = me.StringField(required=True, max_length=100)
    location = me.StringField(max_length=100)
    contact_person = me.StringField(max_length=100)
    phone = me.StringField(max_length=20)
    users = me.ListField(me.ReferenceField('User'))
    clients = me.ListField(me.ReferenceField('Client'))


class Stage(me.Document):
    meta = {'collection': 'stages'}
    stage_number = me.IntField(required=True)
    stage_name = me.StringField(required=True, max_length=100)
    description = me.StringField()
    payment_types = me.ListField(me.ReferenceField('PaymentType'))
    clients = me.ListField(me.ReferenceField('ClientStage'))
    payments = me.ListField(me.ReferenceField('Payment'))


class PaymentType(me.Document):
    meta = {'collection': 'payment_types'}
    stage = me.ReferenceField(Stage, required=True)
    payment_name = me.StringField(required=True, max_length=100)
    default_amount = me.FloatField(required=True)
    description = me.StringField()


class User(me.Document):
    meta = {'collection': 'users'}
    username = me.StringField(required=True, unique=True, max_length=50)
    full_name = me.StringField(required=True, max_length=100)
    role = me.StringField(default='staff', max_length=20)
    password_hash = me.StringField()
    association = me.ReferenceField(LocalAssociation)
    audit_logs = me.ListField(me.ReferenceField('AuditLog'))


class Client(me.Document):
    meta = {'collection': 'clients'}
    file_number = me.StringField(required=True, unique=True, max_length=50)
    full_name = me.StringField(required=True, max_length=100)
    phone = me.StringField(max_length=20)
    ghana_card_number = me.StringField(max_length=50)
    local_association = me.ReferenceField(LocalAssociation)
    current_stage = me.IntField(default=1)
    registration_date = me.DateTimeField(default=datetime.utcnow)
    completion_date = me.DateTimeField()
    status = me.StringField(default='active', max_length=20)
    house_number = me.StringField(max_length=50)
    gps_address = me.StringField(max_length=200)
    next_of_kin = me.StringField(max_length=100)
    passport_picture = me.StringField(max_length=200)
    marital_status = me.StringField(max_length=20)
    date_of_birth = me.DateTimeField()
    hometown = me.StringField(max_length=100)
    place_of_stay = me.StringField(max_length=200)
    family_member_number = me.StringField(max_length=20)
    stages = me.ListField(me.ReferenceField('ClientStage'))
    payments = me.ListField(me.ReferenceField('Payment'))
    documents = me.ListField(me.ReferenceField('ClientDocument'))


class ClientStage(me.Document):
    meta = {'collection': 'client_stages'}
    client = me.ReferenceField(Client, required=True)
    stage = me.ReferenceField(Stage, required=True)
    status = me.StringField(default='pending', max_length=20)
    start_date = me.DateTimeField(default=datetime.utcnow)
    completion_date = me.DateTimeField()
    notes = me.StringField()


class Payment(me.Document):
    meta = {'collection': 'payments'}
    client = me.ReferenceField(Client, required=True)
    stage = me.ReferenceField(Stage, required=True)
    payment_type = me.StringField(max_length=100)
    amount = me.FloatField(required=True)
    payment_date = me.DateTimeField(default=datetime.utcnow)
    receipt_number = me.StringField(unique=True, max_length=50)
    payment_method = me.StringField(max_length=20)
    status = me.StringField(default='pending', max_length=20)
    recorded_by = me.ReferenceField(User)
    receipt_path = me.StringField(max_length=255)


class ClientPaymentType(me.Document):
    meta = {'collection': 'client_payment_types'}
    client = me.ReferenceField(Client, required=True)
    payment_type = me.ReferenceField(PaymentType, required=True)
    custom_amount = me.FloatField(required=True)
    created_at = me.DateTimeField(default=datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.utcnow)


class ClientDocument(me.Document):
    meta = {'collection': 'client_documents'}
    client = me.ReferenceField(Client, required=True)
    document_type = me.StringField(required=True, max_length=100)
    file_path = me.StringField(max_length=200)
    submission_date = me.DateTimeField(default=datetime.utcnow)
    verified = me.BooleanField(default=False)
    verified_date = me.DateTimeField()
    notes = me.StringField()


class Setting(me.Document):
    meta = {'collection': 'settings'}
    key = me.StringField(primary_key=True, max_length=50)
    value = me.StringField(required=True)


class AuditLog(me.Document):
    meta = {'collection': 'audit_logs'}
    user = me.ReferenceField(User)
    action = me.StringField(required=True, max_length=50)
    module = me.StringField(required=True, max_length=50)
    target_id = me.StringField(max_length=50)
    message = me.StringField()
    old_values = me.DictField()
    new_values = me.DictField()
    ip_address = me.StringField(max_length=45)
    timestamp = me.DateTimeField(default=datetime.utcnow)
