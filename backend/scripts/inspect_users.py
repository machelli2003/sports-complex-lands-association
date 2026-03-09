from main import create_app

app = create_app()
with app.app_context():
    from app.models import User
    for u in User.objects.order_by('+id')[:20]:
        print(f"ID={str(u.id)} USER={u.username} ROLE={u.role} HASH_PREFIX={(u.password_hash or '')[:30]}")
