# API.py
from flask import Flask
from flask_cors import CORS
import atexit

from config.config import API_KEY
from routes.wallet import wallet_bp
from routes.main import main_bp
from routes.transactions import transactions_bp
from routes.address import address_bp
from routes.blockchain import blockchain_bp
from routes.network import network_bp
from routes.minting import minting_bp
from routes.user import user_bp
from routes.doginals import doginals_bp
from routes.rc001 import rc001_bp
from tasks.scheduled_tasks import scheduler

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Replace with a secure key

CORS(app)

# Register Blueprints
app.register_blueprint(wallet_bp)
app.register_blueprint(main_bp)
app.register_blueprint(transactions_bp)
app.register_blueprint(address_bp)
app.register_blueprint(blockchain_bp)
app.register_blueprint(network_bp)
app.register_blueprint(minting_bp)
app.register_blueprint(user_bp)
app.register_blueprint(doginals_bp)
app.register_blueprint(rc001_bp)

# Initialize scheduler
scheduler.start()

# Shut down the scheduler when exiting the app
atexit.register(lambda: scheduler.shutdown())

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5326, debug=True, use_reloader=False)
