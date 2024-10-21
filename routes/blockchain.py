# routes/blockchain.py
from flask import Blueprint, jsonify
from utils.decorators import require_api_key
from utils.rpc_utils import get_rpc_connection
from bitcoinrpc.authproxy import JSONRPCException

blockchain_bp = Blueprint('blockchain', __name__)

@blockchain_bp.route('/api/v1/get_block/<ticker>/<block_hash_or_height>', methods=['GET'])
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
                "network": ticker,
                "block_no": block['height'],
                "hash": block['hash'],
                "time": block['time'],
                "txs": block['tx']
            }
        })
    except JSONRPCException as e:
        return jsonify({"status": "error", "message": str(e)}), 400

@blockchain_bp.route('/api/v1/latest_blocks_summary/<ticker>', methods=['GET'])
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

@blockchain_bp.route('/api/v1/best_block_hash/<ticker>', methods=['GET'])
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
