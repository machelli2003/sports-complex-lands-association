#!/usr/bin/env python3
"""Migrate data from the existing SQLite database to MongoDB via MongoEngine.

Usage:
  python migrate_sqlite_to_mongo.py --sqlite /path/to/instance/sports_complex.db --mongo "<MONGO_URI>" [--drop]

By default the script will not drop existing MongoDB collections. Use --drop to remove target collections first.
"""
import sqlite3
import os
import argparse
import json
from datetime import datetime

import mongoengine as me

def parse_datetime(val):
    if val is None:
        return None
    try:
        return datetime.fromisoformat(val)
    except Exception:
        try:
            return datetime.strptime(val, "%Y-%m-%d %H:%M:%S")
        except Exception:
            return None


def migrate(sqlite_path, mongo_uri, drop=False):
    if not os.path.exists(sqlite_path):
        raise FileNotFoundError(sqlite_path)

    print(f"Connecting to MongoDB: {mongo_uri}")
    me.connect(host=mongo_uri)

    # import models after connecting
    from app import models

    if drop:
        print("Dropping existing MongoDB collections used by the app")
        for cls in [models.LocalAssociation, models.Stage, models.PaymentType, models.User,
                    models.Client, models.ClientStage, models.Payment, models.ClientPaymentType,
                    models.ClientDocument, models.Setting, models.AuditLog]:
            try:
                cls.drop_collection()
            except Exception as e:
                print(f"  Warning dropping {cls}: {e}")

    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    id_map = {}

    # Local associations
    print('Migrating local_associations...')
    cur.execute('SELECT * FROM local_associations')
    for row in cur.fetchall():
        doc = models.LocalAssociation(
            association_name=row['association_name'],
            location=row['location'],
            contact_person=row['contact_person'],
            phone=row['phone']
        ).save()
        id_map.setdefault('local_associations', {})[row['id']] = doc

    # Stages
    print('Migrating stages...')
    cur.execute('SELECT * FROM stages')
    for row in cur.fetchall():
        doc = models.Stage(
            stage_number=row['stage_number'],
            stage_name=row['stage_name'],
            description=row['description']
        ).save()
        id_map.setdefault('stages', {})[row['id']] = doc

    # Payment types
    print('Migrating payment_types...')
    cur.execute('SELECT * FROM payment_types')
    for row in cur.fetchall():
        stage_ref = id_map.get('stages', {}).get(row['stage_id'])
        doc = models.PaymentType(
            stage=stage_ref,
            payment_name=row['payment_name'],
            default_amount=row['default_amount'],
            description=row['description']
        ).save()
        id_map.setdefault('payment_types', {})[row['id']] = doc

    # Users
    print('Migrating users...')
    cur.execute('SELECT * FROM users')
    for row in cur.fetchall():
        assoc = id_map.get('local_associations', {}).get(row['association_id'])
        doc = models.User(
            username=row['username'],
            full_name=row['full_name'],
            role=row['role'] or 'staff',
            password_hash=row['password_hash'],
            association=assoc
        ).save()
        id_map.setdefault('users', {})[row['id']] = doc

    # Clients
    print('Migrating clients...')
    cur.execute('SELECT * FROM clients')
    for row in cur.fetchall():
        assoc = id_map.get('local_associations', {}).get(row['local_association_id'])
        doc = models.Client(
            file_number=row['file_number'],
            full_name=row['full_name'],
            phone=row['phone'],
            ghana_card_number=row['ghana_card_number'],
            local_association=assoc,
            current_stage=row.get('current_stage') or 1,
            registration_date=parse_datetime(row['registration_date']),
            completion_date=parse_datetime(row['completion_date']),
            status=row.get('status') or 'active',
            house_number=row.get('house_number'),
            gps_address=row.get('gps_address'),
            next_of_kin=row.get('next_of_kin'),
            passport_picture=row.get('passport_picture'),
            marital_status=row.get('marital_status'),
            date_of_birth=parse_datetime(row.get('date_of_birth')),
            hometown=row.get('hometown'),
            place_of_stay=row.get('place_of_stay'),
            family_member_number=row.get('family_member_number')
        ).save()
        id_map.setdefault('clients', {})[row['id']] = doc

    # Client stages
    print('Migrating client_stages...')
    cur.execute('SELECT * FROM client_stages')
    for row in cur.fetchall():
        client_ref = id_map.get('clients', {}).get(row['client_id'])
        stage_ref = id_map.get('stages', {}).get(row['stage_id'])
        doc = models.ClientStage(
            client=client_ref,
            stage=stage_ref,
            status=row.get('status') or 'pending',
            start_date=parse_datetime(row.get('start_date')),
            completion_date=parse_datetime(row.get('completion_date')),
            notes=row.get('notes')
        ).save()
        id_map.setdefault('client_stages', {})[row['id']] = doc

    # Payments
    print('Migrating payments...')
    cur.execute('SELECT * FROM payments')
    for row in cur.fetchall():
        client_ref = id_map.get('clients', {}).get(row['client_id'])
        stage_ref = id_map.get('stages', {}).get(row['stage_id'])
        recorded_by = id_map.get('users', {}).get(row.get('recorded_by_id'))
        doc = models.Payment(
            client=client_ref,
            stage=stage_ref,
            payment_type=row.get('payment_type'),
            amount=row['amount'],
            payment_date=parse_datetime(row.get('payment_date')),
            receipt_number=row.get('receipt_number'),
            payment_method=row.get('payment_method'),
            status=row.get('status') or 'pending',
            recorded_by=recorded_by,
            receipt_path=row.get('receipt_path')
        ).save()
        id_map.setdefault('payments', {})[row['id']] = doc

    # Client payment types
    print('Migrating client_payment_types...')
    cur.execute('SELECT * FROM client_payment_types')
    for row in cur.fetchall():
        client_ref = id_map.get('clients', {}).get(row['client_id'])
        payment_type_ref = id_map.get('payment_types', {}).get(row['payment_type_id'])
        doc = models.ClientPaymentType(
            client=client_ref,
            payment_type=payment_type_ref,
            custom_amount=row['custom_amount'],
            created_at=parse_datetime(row.get('created_at')),
            updated_at=parse_datetime(row.get('updated_at'))
        ).save()
        id_map.setdefault('client_payment_types', {})[row['id']] = doc

    # Client documents
    print('Migrating client_documents...')
    cur.execute('SELECT * FROM client_documents')
    for row in cur.fetchall():
        client_ref = id_map.get('clients', {}).get(row['client_id'])
        doc = models.ClientDocument(
            client=client_ref,
            document_type=row['document_type'],
            file_path=row.get('file_path'),
            submission_date=parse_datetime(row.get('submission_date')),
            verified=bool(row.get('verified')),
            verified_date=parse_datetime(row.get('verified_date')),
            notes=row.get('notes')
        ).save()
        id_map.setdefault('client_documents', {})[row['id']] = doc

    # Settings
    print('Migrating settings...')
    cur.execute('SELECT * FROM settings')
    for row in cur.fetchall():
        models.Setting(key=row['key'], value=row['value']).save()

    # Audit logs
    print('Migrating audit_logs...')
    cur.execute('SELECT * FROM audit_logs')
    for row in cur.fetchall():
        user_ref = id_map.get('users', {}).get(row.get('user_id'))
        old_values = None
        new_values = None
        try:
            old_values = json.loads(row['old_values']) if row['old_values'] else None
        except Exception:
            old_values = None
        try:
            new_values = json.loads(row['new_values']) if row['new_values'] else None
        except Exception:
            new_values = None

        models.AuditLog(
            user=user_ref,
            action=row.get('action'),
            module=row.get('module'),
            target_id=row.get('target_id'),
            message=row.get('message'),
            old_values=old_values,
            new_values=new_values,
            ip_address=row.get('ip_address'),
            timestamp=parse_datetime(row.get('timestamp'))
        ).save()

    conn.close()
    print('Migration complete.')


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--sqlite', dest='sqlite', help='SQLite DB file path', default='instance/sports_complex.db')
    p.add_argument('--mongo', dest='mongo', help='MongoDB URI', default=os.environ.get('MONGO_URI'))
    p.add_argument('--drop', dest='drop', action='store_true', help='Drop target MongoDB collections before migrating')
    args = p.parse_args()

    if not args.mongo:
        print('Please provide --mongo or set MONGO_URI environment variable')
        raise SystemExit(1)

    sqlite_path = args.sqlite
    if sqlite_path.startswith('sqlite:///'):
        sqlite_path = sqlite_path.replace('sqlite:///', '')

    migrate(sqlite_path, args.mongo, drop=args.drop)
