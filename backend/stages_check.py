from app import create_app, db
from app.models import Stage

app = create_app()
with app.app_context():
    print(Stage.query.all())
