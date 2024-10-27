# print_db_contents.py

import sqlite3
import os

# Configuration
DB_PATH = '../db/boughtcreditsdb.sqlite'

def print_database_contents(db_path):
    if not os.path.exists(db_path):
        print(f"Database file not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if the table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='utxos';")
        if not cursor.fetchone():
            print("No 'utxos' table found in the database.")
            return
        
        # Fetch all data from the utxos table
        cursor.execute("SELECT * FROM utxos")
        rows = cursor.fetchall()
        
        # Fetch column names
        cursor.execute("PRAGMA table_info(utxos)")
        columns = [column[1] for column in cursor.fetchall()]
        print(" | ".join(columns))
        
        # Print each row
        for row in rows:
            print(" | ".join(str(item) for item in row))
                
    except sqlite3.Error as e:
        print(f"An error occurred: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    print_database_contents(DB_PATH)