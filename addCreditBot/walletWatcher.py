# walletWatcher.py

import os
import sqlite3
import configparser
from bitcoinrpc.authproxy import AuthServiceProxy, JSONRPCException

# Configuration
CONFIG_PATH = '../config/RPC2.conf'
DB_PATH = '../db/boughtcreditsdb.sqlite'
DOGE_ADDRESS = 'DKpHXgYLdi5XiwL9e1D9tXzBSTpTHnBLYA' # privkey QSaXgPsc9yTC41QbPnjVn4gbwDWXpUcEjdHgdSvxNtzdmaU7JMHS
LUCKY_ADDRESS = 'L6fDpwqUHYLEjrSEr98rGBz9w9dYHwxjaF' # privkey SwsEhuJhcrSTGNrGdKs2iB9FC4Qs43Mi7n8MpaN6zDtmYxpNkdiS

def read_rpc_credentials(config_path):
    config = configparser.ConfigParser()
    config.read(config_path)
    return {
        'dogecoin': {
            'user': config['DOGE']['rpcuser'],
            'password': config['DOGE']['rpcpassword'],
            'host': config['DOGE']['rpchost'],
            'port': config['DOGE']['rpcport']
        },
        'luckycoin': {
            'user': config['LKY']['rpcuser'],
            'password': config['LKY']['rpcpassword'],
            'host': config['LKY']['rpchost'],
            'port': config['LKY']['rpcport']
        }
    }

def get_rpc_connection(rpc_creds, coin_type):
    return AuthServiceProxy(f"http://{rpc_creds[coin_type]['user']}:{rpc_creds[coin_type]['password']}@{rpc_creds[coin_type]['host']}:{rpc_creds[coin_type]['port']}")

def create_db_if_not_exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS utxos (
            txid TEXT PRIMARY KEY,
            receiving_address TEXT,
            sending_address TEXT,
            amount REAL,
            timestamp INTEGER,
            credits_added INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

def fetch_utxos(rpc_connection, address):
    try:
        return rpc_connection.listunspent(0, 9999999, [address])
    except JSONRPCException as e:
        print(f"Error fetching UTXOs: {e}")
        return []

def get_sender_address(rpc_connection, txid):
    try:
        raw_tx = rpc_connection.getrawtransaction(txid)
        decoded_tx = rpc_connection.decoderawtransaction(raw_tx)
        if decoded_tx['vin']:
            vin_txid = decoded_tx['vin'][0]['txid']
            vin_vout = decoded_tx['vin'][0]['vout']
            vin_raw_tx = rpc_connection.getrawtransaction(vin_txid)
            vin_decoded_tx = rpc_connection.decoderawtransaction(vin_raw_tx)
            return vin_decoded_tx['vout'][vin_vout]['scriptPubKey']['addresses'][0]
    except (JSONRPCException, KeyError, IndexError) as e:
        print(f"Error determining sender address for txid {txid}: {e}")
    return "Unknown"

def update_db_with_utxos(db_path, rpc_connection, utxos, address):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    for utxo in utxos:
        sender_address = get_sender_address(rpc_connection, utxo['txid'])
        if not sender_address:
            sender_address = "Unknown"
        cursor.execute('''
            INSERT OR IGNORE INTO utxos (txid, receiving_address, sending_address, amount, timestamp, credits_added)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (utxo['txid'], address, str(sender_address), utxo['amount'], utxo['confirmations'], 0))
    
    conn.commit()
    conn.close()

def main():
    # Read RPC credentials
    rpc_creds = read_rpc_credentials(CONFIG_PATH)
    
    # Create database if it doesn't exist
    create_db_if_not_exists(DB_PATH)
    
    # Connect to Dogecoin and Luckycoin nodes
    doge_rpc = get_rpc_connection(rpc_creds, 'dogecoin')
    lky_rpc = get_rpc_connection(rpc_creds, 'luckycoin')
    
    # Fetch and update UTXOs for Dogecoin
    doge_utxos = fetch_utxos(doge_rpc, DOGE_ADDRESS)
    update_db_with_utxos(DB_PATH, doge_rpc, doge_utxos, DOGE_ADDRESS)
    
    # Fetch and update UTXOs for Luckycoin
    lky_utxos = fetch_utxos(lky_rpc, LUCKY_ADDRESS)
    update_db_with_utxos(DB_PATH, lky_rpc, lky_utxos, LUCKY_ADDRESS)

if __name__ == "__main__":
    main()
