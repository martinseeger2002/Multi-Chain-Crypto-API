# creditBot.py

import sqlite3
import os
import argparse

def get_db_connection():
    # Use a relative path to connect to the database
    db_path = os.path.join(os.path.dirname(__file__), '../db/minteruser.db')
    return sqlite3.connect(db_path)

def get_credits_by_address(address):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Query to find the mint_credits for the given address
        cursor.execute('''
            SELECT mint_credits FROM users 
            WHERE doge = ? OR ltc = ? OR lky = ?
        ''', (address, address, address))
        result = cursor.fetchone()
        
        if result:
            return result[0]  # Return the mint_credits
        else:
            return None  # Address not found
    except sqlite3.Error as e:
        print(f"An error occurred: {e}")
        return None
    finally:
        conn.close()

def main():
    parser = argparse.ArgumentParser(description='Get mint credits by address.')
    parser.add_argument('address', type=str, help='The address to search for')
    args = parser.parse_args()

    credits = get_credits_by_address(args.address)
    if credits is not None:
        print(f"Credits for {args.address}: {credits}")
    else:
        print(f"No credits found for {args.address}")

if __name__ == "__main__":
    main()