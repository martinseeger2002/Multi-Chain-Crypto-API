from flask import Blueprint, request, jsonify, render_template
import requests

wonky_bp = Blueprint('wonky', __name__)

@wonky_bp.route('/')
def index():
    return render_template('index.html')

@wonky_bp.route('/check_balance', methods=['POST'])
def check_balance():
    address = request.form.get('address')
    token_type = request.form.get('token_type')
    
    if not address or not token_type:
        return jsonify({'error': 'Address and token type are required'}), 400

    if token_type == 'shc20':
        url = f"https://shicinals-ord.com/shc20/address/{address}/balance"
    elif token_type == 'prc20':
        url = f"https://pepinals.com/prc20/address/{address}/balance"
    elif token_type == 'drc20':
        url = f"https://wonky-ord.dogeord.io/drc20/address/{address}/balance"
    elif token_type == 'bnk20':
        url = f"https://inscription.bonkscoin.io/bnk20/address/{address}/balance"
    else:
        return jsonify({'error': 'Invalid token type'}), 400

    response = requests.get(url)
    
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Failed to fetch balance'}), response.status_code