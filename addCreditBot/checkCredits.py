import json
import subprocess
from decimal import Decimal, ROUND_HALF_UP

# Load wallet data from JSON
def load_wallet_data(file_path):
    try:
        with open(file_path, 'r') as json_file:
            return json.load(json_file)
    except (FileNotFoundError, json.JSONDecodeError):
        print("Error loading JSON file.")
        return {}

# Check UTXOs and call creditsRUD.py if credits_paid is null
def check_and_update_credits(file_path):
    wallet_data = load_wallet_data(file_path)

    for ticker, data in wallet_data.items():
        for utxo in data.get('utxos', []):
            if utxo.get('credits_paid') is None:
                sending_address = utxo['sending_address']
                amount = Decimal(utxo['amount']).quantize(Decimal('1'), rounding=ROUND_HALF_UP)
                credits_amount = int(amount) * 50

                # Prepare the command
                command = ['python3', 'creditsRUD.py', sending_address, str(credits_amount)]

                # Print the command for debugging
                print(f"Executing command: {' '.join(command)}")

                # Call creditsRUD.py with the sending address and calculated credits amount
                try:
                    subprocess.run(command, check=True)
                    # Update the JSON to mark this UTXO as processed
                    utxo['credits_paid'] = credits_amount
                except subprocess.CalledProcessError as e:
                    print(f"Error calling creditsRUD.py: {e}")

    # Save the updated data back to the JSON file
    with open(file_path, 'w') as json_file:
        json.dump(wallet_data, json_file, indent=4)

if __name__ == '__main__':
    check_and_update_credits('../db/creditsWallet.json') 