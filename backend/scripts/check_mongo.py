import os
import sys
from mongoengine import connect
from mongoengine.connection import get_db

uri = os.environ.get('MONGODB_URI') or os.environ.get('MONGO_URI') or os.environ.get('MONGODB_HOST')
if not uri:
    print('No MongoDB URI found in environment variables (MONGODB_URI/MONGO_URI).')
    sys.exit(2)

try:
    connect(host=uri)
    db = get_db()
    cols = db.list_collection_names()
    print('Connected to MongoDB')
    print('Database:', db.name)
    print('Collections (first 20):')
    for c in cols[:20]:
        try:
            count = db[c].count_documents({})
        except Exception:
            count = 'N/A'
        print(f' - {c}: {count}')
    if not cols:
        print('(no collections found)')
    sys.exit(0)
except Exception as e:
    print('Connection error:', e)
    sys.exit(1)
