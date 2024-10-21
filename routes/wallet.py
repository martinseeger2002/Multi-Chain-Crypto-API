# routes/wallet.py
from flask import Blueprint, render_template, session, request, jsonify
from utils.decorators import login_required
from db.db_utils import get_db_connection
import bcrypt
from config.config import API_KEY

wallet_bp = Blueprint('wallet', __name__)

@wallet_bp.route('/wallet')
def wallet():
    return render_template('minter_index.html', api_key=API_KEY)

@wallet_bp.route('/login', methods=['POST'])
def login():
    if request.is_json:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password').encode('utf-8')

        conn = get_db_connection()
        user = conn.execute('SELECT * FROM users WHERE user = ?', (username,)).fetchone()
        conn.close()

        if user and bcrypt.checkpw(password, user['password']):
            session['user'] = username
            return jsonify({"status": "success", "message": "Logged in successfully"}), 200
        else:
            return jsonify({"status": "error", "message": "Invalid username or password"}), 401

    return jsonify({"status": "error", "message": "Invalid request format"}), 400

@wallet_bp.route('/api/v1/mint_credits', methods=['GET'])
def get_mint_credits():
    if 'user' in session:
        username = session['user']
        conn = get_db_connection()
        user = conn.execute('SELECT mint_credits FROM users WHERE user = ?', (username,)).fetchone()
        conn.close()
        if user:
            return jsonify({"status": "success", "credits": user['mint_credits']}), 200
    return jsonify({"status": "error", "message": "User not logged in or credits not found"}), 401
