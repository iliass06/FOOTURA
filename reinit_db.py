from app import app
from database import init_db
import os

if __name__ == "__main__":
    if os.path.exists('instance/futura.db'):
        os.remove('instance/futura.db')
    with app.app_context():
        init_db()
    print("Database re-initialized successfully.")
