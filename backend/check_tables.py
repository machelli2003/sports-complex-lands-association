import os
from main import create_app
from mongoengine import connection

out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'db_collections.txt')

app = create_app()
with app.app_context():
    try:
        db = connection.get_db()
        collections = db.list_collection_names()
        with open(out_path, 'w') as out:
            out.write(f"MongoDB name: {db.name}\n")
            out.write(f"Collections: {collections}\n")
            for c in collections:
                try:
                    count = db[c].count_documents({})
                except Exception:
                    count = 'n/a'
                out.write(f"  {c}: {count}\n")
    except Exception as e:
        with open(out_path, 'w') as out:
            out.write(f"Error connecting to MongoDB: {e}\n")
