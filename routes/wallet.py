# routes/wallet.py
from flask import Blueprint, render_template, session, request, jsonify
from utils.decorators import login_required
from db.db_utils import get_db_connection
import bcrypt
from config.config import API_KEY
from flask import current_app

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

@wallet_bp.route('/api/v1/remove_mint_credit', methods=['POST'])
def remove_mint_credit():
    if 'user' in session:
        username = session['user']
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            # Fetch the current mint credits
            user = cursor.execute('SELECT mint_credits FROM users WHERE user = ?', (username,)).fetchone()

            if user and user['mint_credits'] > 0:
                # Decrement the mint credits by one
                new_credits = user['mint_credits'] - 1
                cursor.execute('UPDATE users SET mint_credits = ? WHERE user = ?', (new_credits, username))
                conn.commit()
                current_app.logger.info(f"Mint credit removed for user {username}. New credits: {new_credits}")
                return jsonify({"status": "success", "message": "Mint credit removed", "credits": new_credits}), 200
            else:
                current_app.logger.warning(f"Insufficient mint credits for user {username}.")
                return jsonify({"status": "error", "message": "Insufficient mint credits"}), 400

        except Exception as e:
            current_app.logger.error(f"Error removing mint credit for user {username}: {str(e)}")
            return jsonify({"status": "error", "message": "An error occurred while removing mint credit"}), 500

        finally:
            conn.close()

    return jsonify({"status": "error", "message": "User not logged in"}), 401
