try:
	from flask_sqlalchemy import SQLAlchemy
	db = SQLAlchemy()
except Exception:
	class _DummyDB:
		def init_app(self, app):
			return None

	db = _DummyDB()
