# routes/minting.py
from flask import Blueprint, jsonify, request, current_app
from utils.decorators import require_api_key
from utils.rpc_utils import get_rpc_connection
import subprocess
import json
import logging

minting_bp = Blueprint('minting', __name__)

@minting_bp.route('/api/v1/mint/<ticker>', methods=['POST'])
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
    utxo_amount = data.get('utxo_amount')  # Ensure this is a string

    # Log the extracted parameters for debugging
    print(f"Received mint request with parameters: {data}")

    # Convert 'vout' and 'utxo_amount' to strings for the command
    vout_str = str(vout)
    
    try:
        # Convert utxo_amount to a float, then to satoshis
        utxo_amount_float = float(utxo_amount)
        utxo_amount_satoshis = int(utxo_amount_float * 100000000)
    except ValueError as e:
        return jsonify({
            "status": "error",
            "message": f"Invalid utxo_amount: {utxo_amount}. Error: {str(e)}"
        }), 400

    # Determine the command directory and script based on the ticker
    if ticker.lower() == 'doge':
        command_dir = './getOrdTxsDoge'
        script = 'getOrdTxsDoge.js'
    elif ticker.lower() == 'lky':
        command_dir = './getOrdTxsLKY'
        script = 'getOrdTxsLKY.js'
    elif ticker.lower() == 'ltc':
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
        script_hex, str(utxo_amount_satoshis)
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
        error_output = result.stderr.strip()

        # Print both stdout and stderr
        print("Command output:", output)
        print("Command error output:", error_output)

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

@minting_bp.route('/api/v1/get_new_address_and_privkey/<ticker>', methods=['GET'])
@require_api_key
def get_new_address_and_privkey(ticker):
    rpc_connection = get_rpc_connection(ticker)
    try:
        new_address = rpc_connection.getnewaddress()
        privkey = rpc_connection.dumpprivkey(new_address)
        return jsonify({
            "status": "success",
            "data": {
                "new_address": new_address,
                "privkey": privkey
            }
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@minting_bp.route('/api/v1/generate_tx_hex/<ticker>', methods=['POST'])
@require_api_key
def generate_tx_hex(ticker):
    """
    Generate a Bitcoin transaction hex using the createTxHex.js module.

    :param ticker: The cryptocurrency ticker (e.g., doge, lky, ltc).
    :return: JSON response containing the transaction hex or an error message.
    """
    # Determine the command directory and script based on the ticker
    if ticker.lower() == 'doge':
        command_dir = './getOrdTxsDoge'
        script = 'createTxHex.js'
    elif ticker.lower() == 'lky':
        command_dir = './getOrdTxsLKY'
        script = 'createTxHex.js'
    elif ticker.lower() == 'ltc':
        command_dir = './getOrdTxsLTC'
        script = 'createTxHex.js'
    else:
        return jsonify({
            "status": "error",
            "message": "Unsupported ticker type."
        }), 400

    # Extract parameters from the request body
    data = request.json
    required_params = ['sendingAddress', 'wifPrivateKey', 'utxos', 'recipients', 'fee', 'changeAddress']
    
    # Check for missing required parameters
    missing_params = [param for param in required_params if param not in data]
    if missing_params:
        return jsonify({
            "status": "error",
            "message": f"Missing required parameters: {', '.join(missing_params)}"
        }), 400

    # Validate UTXOs
    utxos = data.get('utxos')
    if not isinstance(utxos, list) or len(utxos) == 0:
        return jsonify({
            "status": "error",
            "message": "UTXOs must be a non-empty list."
        }), 400

    # Validate recipients
    recipients = data.get('recipients')
    if not isinstance(recipients, list) or len(recipients) == 0:
        return jsonify({
            "status": "error",
            "message": "Recipients must be a non-empty list."
        }), 400

    # Ensure amounts are integers (satoshis)
    for utxo in utxos:
        if not isinstance(utxo.get('amount'), int):
            return jsonify({
                "status": "error",
                "message": "UTXO amounts must be integers representing satoshis."
            }), 400

    for recipient in recipients:
        if not isinstance(recipient.get('amount'), int):
            return jsonify({
                "status": "error",
                "message": "Recipient amounts must be integers representing satoshis."
            }), 400

    # Prepare the input data for the JavaScript module
    try:
        input_data = json.dumps(data)
    except (TypeError, ValueError) as e:
        return jsonify({
            "status": "error",
            "message": f"Invalid JSON input: {str(e)}"
        }), 400

    # Log the input data
    current_app.logger.info(f"Received data for {ticker}: {data}")

    # Execute the JavaScript module to generate the transaction hex
    try:
        result = subprocess.run(
            ['node', script],
            cwd=command_dir,
            input=input_data,
            capture_output=True,
            text=True,
            check=True
        )
        tx_hex = result.stdout.strip()

        # Log the output
        current_app.logger.info(f"Transaction hex for {ticker}: {tx_hex}")

        if not all(c in '0123456789abcdefABCDEF' for c in tx_hex) or len(tx_hex) % 2 != 0:
            return jsonify({
                "status": "error",
                "message": "Received invalid transaction hex."
            }), 500

        return jsonify({
            "status": "success",
            "data": {
                "transaction_hex": tx_hex
            }
        }), 200

    except subprocess.CalledProcessError as e:
        current_app.logger.error(f"createTxHex.js error: {e.stderr}")
        return jsonify({
            "status": "error",
            "message": f"Transaction generation failed: {e.stderr.strip()}"
        }), 500
    except Exception as e:
        current_app.logger.error(f"Unexpected error: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"An unexpected error occurred: {str(e)}"
        }), 500

@minting_bp.route('/api/v1/generate_key/<ticker>', methods=['GET'])
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
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Unexpected error: {str(e)}"
        }), 500
