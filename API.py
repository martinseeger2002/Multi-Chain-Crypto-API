import sqlite3
from flask import Flask, request, jsonify, render_template, send_file, g
from bitcoinrpc.authproxy import AuthServiceProxy, JSONRPCException
from ordCheck import process_transaction, initialize_db 
import configparser
from apscheduler.schedulers.background import BackgroundScheduler
import subprocess
import atexit
from functools import wraps
import time
import requests
import sqlite3
import json
import logging
from getOrdContent import process_tx
from flask_cors import CORS
import base64
import re
import sqlite3
import base64
from flask import Flask, jsonify, abort, make_response
from datetime import datetime


DB_PATH = './db/content.db' 

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

# Add CORS support to your Flask app
CORS(app)

# Read RPC configuration from RPC.conf
config = configparser.ConfigParser()
config.read('RPC2.conf')

# Store configurations for each ticker
rpc_configs = {
    section.upper(): {
        'rpc_user': config[section]['rpcuser'],
        'rpc_password': config[section]['rpcpassword'],
        'rpc_host': config[section]['rpchost'],
        'rpc_port': config[section]['rpcport'],
    }
    for section in config.sections()
}

def get_rpc_connection(ticker):
    ticker = ticker.upper()
    if ticker in rpc_configs:
        cfg = rpc_configs[ticker]
        return AuthServiceProxy(
            f"http://{cfg['rpc_user']}:{cfg['rpc_password']}@{cfg['rpc_host']}:{cfg['rpc_port']}"
        )
    else:
        raise ValueError(f"No RPC configuration found for ticker: {ticker}")

def fetch_and_replace_content(content, processed_txids):
    """ Recursively fetch and replace embedded /content/<txid>i0 links """
    pattern = re.compile(r'/content/([a-fA-F0-9]+)i0')
    matches = pattern.findall(content)

    for match in matches:
        embedded_txid = match
        if embedded_txid not in processed_txids:
            processed_txids.add(embedded_txid)
            embedded_content = display_content(embedded_txid, processed_txids)
            content = content.replace(f'/content/{embedded_txid}i0', embedded_content)

    return content

def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key') or request.headers.get('X-Api-Key')
        print(f"Received request for: {request.path}")
        print(f"Received API Key: {api_key}")
        print(f"Headers: {request.headers}")

        # Query the database for the API key
        conn = sqlite3.connect('./db/APIkeys.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT user_id, last_login_at, plan_name, max_daily_requests,
                   num_requests_today, num_requests_yesterday
            FROM api_keys
            WHERE api_key = ?
        ''', (api_key,))
        row = cursor.fetchone()

        if row:
            user_id, last_login_at, plan_name, max_daily_requests, num_requests_today, num_requests_yesterday = row
            print("API key is valid")
            
            print(f"Max daily requests: {max_daily_requests}")
            print(f"Current requests today: {num_requests_today}")
            
            if num_requests_today >= max_daily_requests:
                print("API key has exceeded the maximum daily requests")
                conn.close()
                return jsonify({"status": "error", "message": "API key has exceeded the maximum daily requests"}), 403

            # Update the usage statistics
            last_login_at = int(time.time())
            num_requests_today += 1

            cursor.execute('''
                UPDATE api_keys
                SET last_login_at = ?,
                    num_requests_today = ?
                WHERE user_id = ?
            ''', (last_login_at, num_requests_today, user_id))
            conn.commit()
            conn.close()

            # Store user info in 'g' for access in the endpoint if needed
            g.user_info = {
                'user_id': user_id,
                'plan_name': plan_name,
                'max_daily_requests': max_daily_requests,
                'num_requests_today': num_requests_today,
                'num_requests_yesterday': num_requests_yesterday
            }

            return f(*args, **kwargs)
        else:
            conn.close()
            print("Invalid or missing API key")
            return jsonify({"status": "error", "message": "Invalid or missing API key"}), 401
    return decorated_function

@app.route('/')
def landing_page():
    return render_template('API_landing_page.html')

@app.route('/api/v1/get_address_balance/<ticker>/<address>', methods=['GET'])
@require_api_key
def get_address_balance(ticker, address):
    rpc_connection = get_rpc_connection(ticker)
    try:
        utxos = rpc_connection.listunspent(0, 9999999, [address])
        confirmed_balance = sum(utxo['amount'] for utxo in utxos if utxo['confirmations'] >= 1)
        unconfirmed_balance = sum(utxo['amount'] for utxo in utxos if utxo['confirmations'] == 0)
        return jsonify({
            "status": "success",
            "data": {
                "network": "<ticker>",
                "address": address,
                "confirmed_balance": str(confirmed_balance),
                "unconfirmed_balance": str(unconfirmed_balance)
            }
        })
    except JSONRPCException as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/v1/get_tx/<ticker>/<txid>', methods=['GET'])
@require_api_key
def get_transaction(ticker, txid):
    rpc_connection = get_rpc_connection(ticker)
    try:
        tx = rpc_connection.getrawtransaction(txid, True)
        
        def get_address_from_scriptPubKey(scriptPubKey):
            if 'addresses' in scriptPubKey:
                return scriptPubKey['addresses'][0]
            elif 'address' in scriptPubKey:
                return scriptPubKey['address']
            else:
                return "Unknown"
        
        return jsonify({
            "status": "success",
            "data": {
                "network": "<ticker>",
                "txid": txid,
                "block_no": tx.get('blockhash', None),
                "confirmations": tx.get('confirmations', 0),
                "time": tx.get('time', 0),
                "inputs": [{"txid": vin.get('txid'), "vout": vin.get('vout')} for vin in tx['vin']],
                "outputs": [
                    {
                        "index": vout['n'],
                        "address": get_address_from_scriptPubKey(vout['scriptPubKey']),
                        "value": str(vout['value']),
                        "script_hex": vout['scriptPubKey'].get('hex', '')
                    } for vout in tx['vout']
                ]
            }
        })
    except JSONRPCException as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/v1/get_block/<ticker>/<block_hash_or_height>', methods=['GET'])
@require_api_key
def get_block(ticker, block_hash_or_height):
    rpc_connection = get_rpc_connection(ticker)
    try:
        if block_hash_or_height.isdigit():
            block_hash = rpc_connection.getblockhash(int(block_hash_or_height))
        else:
            block_hash = block_hash_or_height
        block = rpc_connection.getblock(block_hash)
        return jsonify({
            "status": "success",
            "data": {
                "network": "<ticker>",
                "block_no": block['height'],
                "hash": block['hash'],
                "time": block['time'],
                "txs": block['tx']
            }
        })
    except JSONRPCException as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/v1/send_raw_tx/<ticker>', methods=['POST'])
@require_api_key
def send_transaction(ticker):
    rpc_connection = get_rpc_connection(ticker)
    tx_hex = request.json.get('tx_hex')
    if not tx_hex:
        return jsonify({"status": "error", "message": "Missing tx_hex in request body"}), 400
    try:
        txid = rpc_connection.sendrawtransaction(tx_hex)
        return jsonify({
            "status": "success",
            "data": {
                "txid": txid
            }
        })
    except JSONRPCException as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/v1/estimate_fee/<ticker>/<int:target>', methods=['GET'])
@require_api_key
def estimate_fee(ticker, target):
    rpc_connection = get_rpc_connection(ticker)
    try:
        fee_rate = rpc_connection.estimatesmartfee(target)
        return jsonify({
            "status": "success",
            "data": {
                "fee_per_byte": int(fee_rate['feerate'] * 100000000),  # Convert <ticker>/kB to satoshis/byte
                "target": target
            }
        })
    except JSONRPCException as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/v1/get_tx_unspent/<ticker>/<address>', methods=['GET'])
@require_api_key
def get_unspent_txs(ticker, address):
    rpc_connection = get_rpc_connection(ticker)
    try:
        utxos = rpc_connection.listunspent(0, 9999999, [address])
        return jsonify({
            "status": "success",
            "data": {
                "network": "<ticker>",
                "address": address,
                "txs": [
                    {
                        "txid": utxo['txid'],
                        "output_no": utxo['vout'],
                        "script_hex": utxo['scriptPubKey'],
                        "value": utxo['amount'],
                        "confirmations": utxo['confirmations']  # Added confirmations field
                    } for utxo in utxos
                ]
            }
        })
    except JSONRPCException as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/v1/transactions/<ticker>/<address>/<int:page>', methods=['GET'])
@require_api_key
def get_address_transactions(ticker, address, page):
    rpc_connection = get_rpc_connection(ticker)
    try:
        # Start from the latest block
        best_block_hash = rpc_connection.getbestblockhash()
        transactions_found = []
        blocks_checked = 0
        transactions_per_page = 10
        start_index = (page - 1) * transactions_per_page
        max_blocks_to_check = 1000  # Set the maximum depth of blocks to search

        while len(transactions_found) < (page * transactions_per_page):
            if blocks_checked >= max_blocks_to_check:
                break  # Stop if max depth is reached without finding new transactions

            block = rpc_connection.getblock(best_block_hash)
            blocks_checked += 1

            for txid in block['tx']:
                raw_tx = rpc_connection.getrawtransaction(txid, True)
                
                # Determine "from" addresses
                from_addresses = []
                for vin in raw_tx['vin']:
                    if 'txid' in vin:
                        prev_tx = rpc_connection.getrawtransaction(vin['txid'], True)
                        prev_vout = prev_tx['vout'][vin['vout']]
                        if 'addresses' in prev_vout['scriptPubKey']:
                            from_addresses.extend(prev_vout['scriptPubKey']['addresses'])

                # Determine "to" addresses and check if the transaction involves the specified address
                for vout in raw_tx['vout']:
                    if 'addresses' in vout['scriptPubKey']:
                        to_addresses = vout['scriptPubKey']['addresses']
                        if address in to_addresses or address in from_addresses:
                            tx_details = {
                                "hash": raw_tx['txid'],
                                "value": vout['value'],
                                "time": raw_tx['time'],
                                "block": block['height'],
                                "confirmations": block['confirmations'],
                                "from": from_addresses,
                                "to": to_addresses,
                                "type": "receive" if address in to_addresses else "send"
                            }
                            transactions_found.append(tx_details)
                            blocks_checked = 0  # Reset the block depth counter
                            break  # No need to check other outputs if address is found

            # Move to the previous block
            if 'previousblockhash' in block:
                best_block_hash = block['previousblockhash']
            else:
                break  # No more blocks to check

        # Paginate the results
        paginated_transactions = transactions_found[start_index:start_index + transactions_per_page]

        return jsonify({
            "status": "success",
            "data": {
                "transactions": paginated_transactions
            }
        })
    except JSONRPCException as e:
        return jsonify({"status": "error", "message": str(e)}), 400
    
@app.route('/api/v1/transaction_counts/<ticker>/<address>', methods=['GET'])
@require_api_key
def get_transaction_counts(ticker, address):
    rpc_connection = get_rpc_connection(ticker)
    try:
        transactions = rpc_connection.listtransactions("*", 100000, 0, True)
        filtered_transactions = [tx for tx in transactions if address in [tx.get('address'), tx.get('to', {}).get('address')]]
        sent = sum(1 for tx in filtered_transactions if tx['category'] == 'send')
        received = sum(1 for tx in filtered_transactions if tx['category'] == 'receive')
        total = len(filtered_transactions)
        return jsonify({
            "status": "success",
            "data": {
                "sent": sent,
                "received": received,
                "total": total
            }
        })
    except JSONRPCException as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/v1/address_summary/<ticker>/<address>', methods=['GET'])
@require_api_key
def get_address_summary(ticker, address):
    rpc_connection = get_rpc_connection(ticker)
    try:
        balance = rpc_connection.getbalance(address)
        transactions = rpc_connection.listtransactions("*", 100000, 0, True)
        filtered_transactions = [tx for tx in transactions if address in [tx.get('address'), tx.get('to', {}).get('address')]]
        sent = sum(1 for tx in filtered_transactions if tx['category'] == 'send')
        received = sum(1 for tx in filtered_transactions if tx['category'] == 'receive')
        total = len(filtered_transactions)
        total_received = sum(tx['amount'] for tx in filtered_transactions if tx['category'] == 'receive')
        return jsonify({
            "status": "success",
            "data": {
                "txs_sent": sent,
                "txs_received": received,
                "txs_total": total,
                "confirmed_balance": str(balance),
                "unconfirmed_balance": "0",
                "confirmed_received": str(total_received)
            }
        })
    except JSONRPCException as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/v1/is_valid_address/<ticker>/<address>', methods=['GET'])
@require_api_key
def is_valid_address(ticker, address):
    rpc_connection = get_rpc_connection(ticker)
    try:
        validity = rpc_connection.validateaddress(address)
        return jsonify({
            "status": "success",
            "data": {
                "is_valid": validity['isvalid']
            }
        })
    except JSONRPCException as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/v1/latest_blocks_summary/<ticker>', methods=['GET'])
@require_api_key
def get_latest_blocks_summary(ticker):
    rpc_connection = get_rpc_connection(ticker)
    try:
        best_block_hash = rpc_connection.getbestblockhash()
        blocks = []
        for i in range(10):
            block = rpc_connection.getblock(best_block_hash)
            blocks.append({
                "height": block['height'],
                "miner": "Unknown",
                "time": block['time'],
                "num_txs": len(block['tx']),
                "difficulty": block['difficulty'],
                "size": block['size'],
                "weight": block.get('weight', 0),
                "version": block['version'],
                "reward_and_fees": "N/A",
                "price": {
                    "value": "N/A",
                    "currency": "USD"
                }
            })
            if 'previousblockhash' in block:
                best_block_hash = block['previousblockhash']
            else:
                break
        return jsonify({
            "status": "success",
            "data": {
                "blocks": blocks
            }
        })
    except JSONRPCException as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/v1/best_block_hash/<ticker>', methods=['GET'])
@require_api_key
def get_best_block_hash(ticker):
    rpc_connection = get_rpc_connection(ticker)
    try:
        best_block_hash = rpc_connection.getbestblockhash()
        return jsonify({
            "status": "success",
            "data": {
                "hash": best_block_hash
            }
        })
    except JSONRPCException as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/v1/price/<ticker>/<int:unix_timestamp>', methods=['GET'])
@app.route('/api/v1/price/<ticker>', methods=['GET'])
@require_api_key
def get_price(ticker, unix_timestamp=None):
    try:
        # Replace <ticker> with the actual ticker value
        response = requests.get(f'https://api.nonkyc.io/api/v2/asset/getbyticker/{ticker}')
        data = response.json()
        
        if 'usdValue' in data:
            price = float(data['usdValue'])
            return jsonify({
                "status": "success",
                "data": {
                    "value": str(price),
                    "currency": "USD",
                    "last_updated": data.get('lastPriceUpdate', int(time.time() * 1000))
                }
            })
        else:
            return jsonify({
                "status": "error",
                "message": "Price data not available"
            }), 404
    except requests.RequestException as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to fetch price data: {str(e)}"
        }), 500

@app.route('/api/v1/network_info/<ticker>', methods=['GET'])
@require_api_key
def get_network_info(ticker):
    rpc_connection = get_rpc_connection(ticker)
    try:
        network_info = rpc_connection.getnetworkinfo()
        blockchain_info = rpc_connection.getblockchaininfo()
        mempool_info = rpc_connection.getmempoolinfo()
        return jsonify({
            "status": "success",
            "data": {
                "block_count": blockchain_info['blocks'],
                "best_block_hash": blockchain_info['bestblockhash'],
                "hashrate": "N/A",  # You might need to implement a way to calculate this
                "mempool": {
                    "mempool_txs": mempool_info['size'],
                    "mempool_size": mempool_info['bytes'],
                    "updated_at": int(time.time())
                }
            }
        })
    except JSONRPCException as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/v1/account_info', methods=['GET'])
@require_api_key
def get_account_info():
    api_key = request.headers.get('X-API-Key') or request.headers.get('X-Api-Key')

    conn = sqlite3.connect('APIkeys.db')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT user_id, creation_date, renewal_date, last_login_at, plan_name,
               max_daily_requests, current_period_ends_at, will_renew_at_period_end,
               num_requests_today, num_requests_yesterday
        FROM api_keys
        WHERE api_key = ?
    ''', (api_key,))
    row = cursor.fetchone()
    conn.close()

    if row:
        (user_id, creation_date, renewal_date, last_login_at, plan_name,
         max_daily_requests, current_period_ends_at, will_renew_at_period_end,
         num_requests_today, num_requests_yesterday) = row

        return jsonify({
            "last_login_at": last_login_at,
            "plan": {
                "name": plan_name,
                "max_daily_requests": max_daily_requests,
                "current_period_ends_at": current_period_ends_at,
                "will_renew_at_period_end": bool(will_renew_at_period_end)
            },
            "num_requests_used": {
                "today": num_requests_today,
                "yesterday": num_requests_yesterday
            }
        })
    else:
        return jsonify({"status": "error", "message": "Invalid API key"}), 401



@app.route('/api/v1/get_sig_script_asm/<ticker>/<txid>', methods=['GET'])
@require_api_key
def get_sig_script_asm(ticker, txid):
    rpc_connection = get_rpc_connection(ticker)
    try:
        # Retrieve the raw transaction details
        tx = rpc_connection.getrawtransaction(txid, True)
        
        # Extract the scriptSig ASM from each input
        sig_scripts_asm = [
            vin['scriptSig']['asm'] for vin in tx['vin'] if 'scriptSig' in vin
        ]
        
        return jsonify({
            "status": "success",
            "data": {
                "txid": txid,
                "sig_scripts_asm": sig_scripts_asm
            }
        })
    except JSONRPCException as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/v1/decoderawtransaction/<ticker>', methods=['POST'])
@require_api_key
def decode_raw_transaction(ticker):
    rpc_connection = get_rpc_connection(ticker)
    try:
        hexstring = request.json.get('hexstring')
        if not hexstring:
            return jsonify({"status": "error", "message": "Missing hexstring in request body"}), 400
        
        decoded_tx = rpc_connection.decoderawtransaction(hexstring)
        return jsonify({
            "status": "success",
            "data": decoded_tx
        })
    except JSONRPCException as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/v1/decodescript/<ticker>', methods=['POST'])
@require_api_key
def decode_script(ticker):
    rpc_connection = get_rpc_connection(ticker)
    try:
        hexstring = request.json.get('hexstring')
        if not hexstring:
            return jsonify({"status": "error", "message": "Missing hexstring in request body"}), 400
        
        decoded_script = rpc_connection.decodescript(hexstring)
        return jsonify({
            "status": "success",
            "data": decoded_script
        })
    except JSONRPCException as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/v1/ord_check/<coin>/<txid>', methods=['GET'])
@require_api_key
def ord_check(coin, txid):
    try:
        # Call the process_transaction function directly
        json_result = process_transaction(coin, txid)
        
        # Parse the JSON result
        result_data = json.loads(json_result)
        
        # Check for errors in the result
        if "error" in result_data:
            return jsonify({
                "status": "error",
                "message": result_data["error"]
            }), 400
        
        # Return the successful result
        return jsonify({
            "status": "success",
            "data": result_data
        })
    except Exception as e:
        # Handle unexpected errors
        return jsonify({
            "status": "error",
            "message": f"An unexpected error occurred: {str(e)}"
        }), 500

@app.route('/api/v1/import_address/<ticker>', methods=['POST'])
@require_api_key
def import_address(ticker):
    rpc_connection = get_rpc_connection(ticker)
    data = request.json

    # Log the incoming request data
    logging.info(f"Received import address request: {data}")

    # Extract address from the request
    address = data.get('address')

    if not address or not isinstance(address, str) or address.strip() == '':
        return jsonify({"status": "error", "message": "A single valid address is required."}), 400

    try:
        # Import the address without rescan
        rpc_connection.importaddress(address, "", False)  # Use positional arguments
        return jsonify({
            "status": "success",
            "imported_address": address
        }), 200
    except JSONRPCException as e:
        logging.error(f"Error importing address: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/v1/send_tx/<ticker>', methods=['POST'])
@require_api_key
def send_tx(ticker):
    # Ensure the ticker is LKY
    if ticker.upper() != 'LKY':
        return jsonify({
            "status": "error",
            "message": "This operation is only available for the LKY ticker."
        }), 400

    data = request.json

    # Extract the API key from the request headers
    api_key = request.headers.get('X-API-Key') or request.headers.get('X-Api-Key')

    # Extract parameters from the request
    from_address = data.get('from_address')
    privkey_wif = data.get('privkey_wif')
    recipient_address = data.get('recipient_address')
    amount_to_send = data.get('amount_to_send')
    dev_fee_base = data.get('dev_fee_base', 0.0)  # Default to 0.0 if not provided
    dev_fee_address = data.get('dev_fee_address', "<dev fee address>")  # Default if not provided

    # Validate required parameters
    required_params = ['from_address', 'privkey_wif', 'recipient_address', 'amount_to_send']
    missing_params = [param for param in required_params if not data.get(param)]

    if missing_params:
        return jsonify({
            "status": "error",
            "message": f"Missing required parameters: {', '.join(missing_params)}"
        }), 400

    try:
        # Call the send_lucky function
        txid = send_lucky(from_address, privkey_wif, api_key, recipient_address, amount_to_send, dev_fee_base, dev_fee_address)
        
        if txid:
            return jsonify({
                "status": "success",
                "data": {
                    "txid": txid
                }
            })
        else:
            return jsonify({
                "status": "error",
                "message": "Transaction failed"
            }), 400
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Exception occurred: {str(e)}"
        }), 500

@app.route('/api/v1/mint/<ticker>', methods=['POST'])
@require_api_key
def mint(ticker):
    data = request.json

    # Extract parameters
    receiving_address = data.get('receiving_address')
    meme_type = data.get('meme_type')
    hex_data = data.get('hex_data')
    sending_address = data.get('sending_address')
    privkey = data.get('privkey')
    utxo = data.get('utxo')
    vout = data.get('vout')
    script_hex = data.get('script_hex')
    utxo_amount = data.get('utxo_amount')

    # List of required parameters
    required_params = [
        'receiving_address', 'meme_type', 'hex_data', 'sending_address',
        'privkey', 'utxo', 'vout', 'script_hex', 'utxo_amount'
    ]

    # Identify missing parameters
    missing_params = []
    for param in required_params:
        value = data.get(param)
        if value is None or (isinstance(value, str) and value.strip() == ''):
            missing_params.append(param)

    if missing_params:
        return jsonify({
            "status": "error",
            "message": f"Missing required parameters: {', '.join(missing_params)}"
        }), 400

    # Convert 'vout' and 'utxo_amount' to strings for the command
    vout_str = str(vout)
    utxo_amount_str = str(utxo_amount)

    # Determine the command directory and script based on the ticker
    if ticker.lower() == 'doge':
        command_dir = './getOrdTxsDoge'
        script = 'getOrdTxsDoge.js'
    elif ticker.lower() == 'lky':
        command_dir = './getOrdTxsLKY'
        script = 'getOrdTxsLKY.js'
    elif ticker.lower() == 'lky':
        command_dir = './getOrdTxsLTC'
        script = 'getOrdTxsLTC.js'
    else:
        return jsonify({
            "status": "error",
            "message": "Unsupported ticker type."
        }), 400

    # Define the command to run
    command = [
        'node', script, 'mint',
        receiving_address, meme_type, hex_data,
        sending_address, privkey, utxo, vout_str,
        script_hex, utxo_amount_str
    ]

    try:
        # Run the command and capture the output
        result = subprocess.run(
            command,
            cwd=command_dir,
            capture_output=True,
            text=True,
            check=True
        )
        output = result.stdout.strip()

        # Assume output format:
        # Final transaction: <txid>
        # {
        #   "pendingTransactions": [...],
        #   "instructions": "..."
        # }

        # Split the output into the final transaction line and the JSON part
        final_tx_line, json_part = output.split('\n', 1)
        final_tx_id = final_tx_line.replace("Final transaction: ", "").strip()
        json_data = json.loads(json_part)

        # Structure the response as desired
        response = {
            "finalTransaction": final_tx_id,
            "pendingTransactions": json_data.get("pendingTransactions", []),
            "instructions": json_data.get("instructions", "")
        }

        return jsonify(response)

    except subprocess.CalledProcessError as e:
        return jsonify({
            "status": "error",
            "message": f"Command failed with error: {e.stderr}"
        }), 500
    except ValueError:
        # Error splitting the output
        return jsonify({
            "status": "error",
            "message": "Failed to parse command output."
        }), 500
    except json.JSONDecodeError:
        return jsonify({
            "status": "error",
            "message": "Invalid JSON format in command output."
        }), 500
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }), 500

@app.route('/api/v1/sms/<ticker>', methods=['POST'])
@require_api_key
def sms(ticker):
    data = request.json

    # Extract parameters
    receiving_address = data.get('receiving_address')
    meme_type = data.get('meme_type')
    hex_data = data.get('hex_data')
    sending_address = data.get('sending_address')
    privkey = data.get('privkey')
    utxo = data.get('utxo')
    vout = data.get('vout')
    script_hex = data.get('script_hex')
    utxo_amount = data.get('utxo_amount')

    # List of required parameters
    required_params = [
        'receiving_address', 'meme_type', 'hex_data', 'sending_address',
        'privkey', 'utxo', 'vout', 'script_hex', 'utxo_amount'
    ]

    # Identify missing parameters
    missing_params = []
    for param in required_params:
        value = data.get(param)
        if value is None or (isinstance(value, str) and value.strip() == ''):
            missing_params.append(param)

    if missing_params:
        return jsonify({
            "status": "error",
            "message": f"Missing required parameters: {', '.join(missing_params)}"
        }), 400

    # Convert 'vout' and 'utxo_amount' to strings for the command
    vout_str = str(vout)
    utxo_amount_str = str(utxo_amount)

    # Define the command to run
    command = [
        'node', '.', 'mint',
        receiving_address, meme_type, hex_data,
        sending_address, privkey, utxo, vout_str,
        script_hex, utxo_amount_str
    ]

    # Set the directory where the command should be run
    command_dir = './getSmsTxsDoge'  # Update this path as needed

    try:
        # Run the command and capture the output
        result = subprocess.run(
            command,
            cwd=command_dir,
            capture_output=True,
            text=True,
            check=True
        )
        output = result.stdout.strip()

        # Assume output format:
        # Final transaction: <txid>
        # {
        #   "pendingTransactions": [...],
        #   "instructions": "..."
        # }

        # Split the output into the final transaction line and the JSON part
        final_tx_line, json_part = output.split('\n', 1)
        final_tx_id = final_tx_line.replace("Final transaction: ", "").strip()
        json_data = json.loads(json_part)

        # Structure the response as desired
        response = {
            "finalTransaction": final_tx_id,
            "pendingTransactions": json_data.get("pendingTransactions", []),
            "instructions": json_data.get("instructions", "")
        }

        return jsonify(response)

    except subprocess.CalledProcessError as e:
        return jsonify({
            "status": "error",
            "message": f"Command failed with error: {e.stderr}"
        }), 500
    except ValueError:
        # Error splitting the output
        return jsonify({
            "status": "error",
            "message": "Failed to parse command output."
        }), 500
    except json.JSONDecodeError:
        return jsonify({
            "status": "error",
            "message": "Invalid JSON format in command output."
        }), 500
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }), 500

@app.route('/api/v1/get_witness_script_asm/<ticker>/<txid>', methods=['GET'])
@require_api_key
def get_witness_script_asm(ticker, txid):
    rpc_connection = get_rpc_connection(ticker)
    try:
        # Retrieve the raw transaction details
        tx = rpc_connection.getrawtransaction(txid, True)
        
        # Extract the witness script ASM from each input
        witness_scripts_asm = []
        for vin in tx['vin']:
            if 'txinwitness' in vin:
                witness_asm = ' '.join(vin['txinwitness'])
                witness_scripts_asm.append(witness_asm)
        
        return jsonify({
            "status": "success",
            "data": {
                "txid": txid,
                "witness_scripts_asm": witness_scripts_asm
            }
        })
    except JSONRPCException as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route('/api/v1/get_ord_content/<ticker>/<genesis_txid>', methods=['GET'])
@require_api_key
def get_ord_content(ticker, genesis_txid):
    try:
        # Call the process_tx function with the provided ticker and genesis_txid
        base64_data = process_tx(ticker, genesis_txid, depth=500)
        
        # Log the base64 data for debugging
        logging.info(f"Base64 Data: {base64_data}")

        # Check if the transaction was processed successfully
        if base64_data:
            return jsonify({
                "status": "success",
                "data": {
                    "base64_data": base64_data
                }
            })
        else:
            logging.error("Failed to process the transaction.")
            return jsonify({"status": "error", "message": "Failed to process the transaction."}), 500

    except Exception as e:
        # Log the exception for debugging
        logging.error(f"An unexpected error occurred: {str(e)}")
        return jsonify({"status": "error", "message": f"An unexpected error occurred: {str(e)}"}), 500
    
@app.route('/api/v1/get_new_address_and_privkey/<ticker>', methods=['GET'])
@require_api_key
def get_new_address_and_privkey(ticker):
    rpc_connection = get_rpc_connection(ticker)
    try:
        # Get a new address
        new_address = rpc_connection.getnewaddress()
        
        # Dump the private key for the new address
        privkey = rpc_connection.dumpprivkey(new_address)
        
        return jsonify({
            "status": "success",
            "data": {
                "new_address": new_address,
                "privkey": privkey
            }
        })
    except JSONRPCException as e:
        return jsonify({"status": "error", "message": str(e)}), 400    

@app.route('/api/v1/generate_key/<ticker>', methods=['GET'])
@require_api_key
def generate_key(ticker):
    # Determine the command directory and script based on the ticker
    if ticker.lower() == 'doge':
        command_dir = './getOrdTxsDoge'
        script = 'generateKey.js'
    elif ticker.lower() == 'lky':
        command_dir = './getOrdTxsLKY'
        script = 'generateKey.js'
    elif ticker.lower() == 'ltc':
        command_dir = './getOrdTxsLTC'
        script = 'generateKey.js'
    else:
        return jsonify({
            "status": "error",
            "message": "Unsupported ticker type."
        }), 400

    # Define the command to run
    command = ['node', script]

    try:
        # Run the command and capture the output
        result = subprocess.run(
            command,
            cwd=command_dir,
            capture_output=True,
            text=True,
            check=True
        )
        output = result.stdout.strip()

        # Assuming the output is in the format:
        # New WIF Private Key: <privkey>
        # Corresponding Address: <address>
        lines = output.split('\n')
        privkey = lines[0].split(': ')[1]
        new_address = lines[1].split(': ')[1]

        # Import the new address without rescan
        rpc_connection = get_rpc_connection(ticker)
        rpc_connection.importaddress(new_address, "", False)  # Use positional arguments

        # Return the output as JSON in the specified format
        return jsonify({
            "status": "success",
            "data": {
                "new_address": new_address,
                "privkey": privkey
            }
        })
    except subprocess.CalledProcessError as e:
        return jsonify({
            "status": "error",
            "message": f"Command failed with error: {e.stderr}"
        }), 500
    except JSONRPCException as e:
        return jsonify({
            "status": "error",
            "message": f"Error importing address: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }), 500

@app.route('/content/<txid>i0', methods=['GET'])
def display_content(txid, processed_txids=None):
    if processed_txids is None:
        processed_txids = set()

    try:
        # Remove the 'i0' suffix if present
        if txid.endswith('i0'):
            txid = txid[:-2]

        # Connect to the database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Query the database for the content
        cursor.execute('SELECT mime_type, base64_data FROM transactions WHERE genesis_txid = ?', (txid,))
        result = cursor.fetchone()

        if not result:
            # If not found, call process_tx to retrieve the data
            app.logger.info(f"Data not found in DB for txid: {txid}. Calling process_tx.")
            result = process_tx(txid, depth=500)

            # If process_tx returns valid data, store it in the database
            if isinstance(result, dict) and 'base64_data' in result:
                mime_type = result.get('mime_type', 'application/octet-stream')
                base64_data = result['base64_data']
                cursor.execute('''
                    INSERT INTO transactions (genesis_txid, mime_type, base64_data, processing)
                    VALUES (?, ?, ?, 0)
                ''', (txid, mime_type, base64_data))
                conn.commit()
            else:
                app.logger.error("Failed to process the transaction.")
                return jsonify({"status": "error", "message": "Failed to process the transaction."}), 500
        else:
            mime_type, base64_data = result

        conn.close()

        decoded_data = base64.b64decode(base64_data)

        # Check if the content is HTML
        if mime_type == 'text/html':
            content = decoded_data.decode('utf-8')

            # Recursively fetch and replace embedded content
            content = fetch_and_replace_content(content, processed_txids)

            return content  # Display the content as a webpage

        # For other MIME types, return the raw content
        response = make_response(decoded_data)
        response.headers['Content-Type'] = mime_type
        return response

    except Exception as e:
        # Log the exception for debugging
        app.logger.error(f"An unexpected error occurred: {str(e)}")
        return jsonify({"status": "error", "message": f"An unexpected error occurred: {str(e)}"}), 500
    
    
@app.route('/api_tester.html')
def api_tester():
    return send_file('api_tester.html')

# Function to run the scanAndImportNew.py script
def run_scan_and_import():
    try:
        subprocess.run(["python3", "scanAndImportNew.py"], check=True)
        print("scanAndImportNew.py executed successfully")
    except subprocess.CalledProcessError as e:
        print(f"Error running scanAndImportNew.py: {e}")

def trigger_blockchain_rescan():
    for ticker, cfg in rpc_configs.items():
        try:
            rpc_connection = AuthServiceProxy(
                f"http://{cfg['rpc_user']}:{cfg['rpc_password']}@{cfg['rpc_host']}:{cfg['rpc_port']}"
            )
            # Assuming 'rescanblockchain' is the correct RPC method
            start_height = 0  # You can specify a starting block height if needed
            result = rpc_connection.rescanblockchain(start_height)
            print(f"Blockchain rescan started for {ticker}: {result}")
        except JSONRPCException as e:
            print(f"Error triggering blockchain rescan for {ticker}: {e}")
        

def reset_daily_request_counts():
    conn = sqlite3.connect('./db/APIkeys.db')
    cursor = conn.cursor()
    cursor.execute('SELECT user_id, num_requests_today FROM api_keys')
    rows = cursor.fetchall()

    for user_id, num_requests_today in rows:
        # Update yesterday's requests with today's count and reset today's count
        cursor.execute('''
            UPDATE api_keys
            SET num_requests_yesterday = ?,
                num_requests_today = 0
            WHERE user_id = ?
        ''', (num_requests_today, user_id))

    conn.commit()
    conn.close()


# Set up the scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(func=run_scan_and_import, trigger="interval", minutes=2.5)
scheduler.add_job(
    func=trigger_blockchain_rescan,
    trigger='cron',
    hour=4,
    minute=0,
    timezone='America/Chicago'  # Central Time
)
# Schedule the reset of daily request counts at midnight
scheduler.add_job(
    func=reset_daily_request_counts,
    trigger='cron',
    hour=0,
    minute=0,
    timezone='America/Chicago'  # Adjust timezone as needed
)

scheduler.start()

# Shut down the scheduler when exiting the app
atexit.register(lambda: scheduler.shutdown())


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8069, debug=True)