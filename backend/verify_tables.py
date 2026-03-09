import os
from main import create_app
from mongoengine import connection

OUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tables_result.txt')

app = create_app()
with app.app_context():
    lines = []
    try:
        db = connection.get_db()
        cols = db.list_collection_names()
        lines.append(f"MongoDB name: {db.name}")
        lines.append(f"Collections: {cols}")
        for c in cols:
            try:
                count = db[c].count_documents({})
            except Exception:
                count = 'n/a'
            lines.append(f"  {c}: {count}")
    except Exception as e:
        lines.append(f"Error connecting to MongoDB: {e}")

    result = "\n".join(lines)
    try:
        with open(OUT_PATH, 'w') as f:
            f.write(result)
    except Exception as e:
        with open('tables_result_fallback.txt', 'w') as f:
            f.write(result + f"\n\nWrite error: {e}")
