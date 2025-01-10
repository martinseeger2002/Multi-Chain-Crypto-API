import requests
from bs4 import BeautifulSoup

def get_transaction_details(url, txid):
    try:
        response = requests.get(url.format(txid=txid))
        response.raise_for_status()
        
        # Check if the response is JSON
        if 'application/json' in response.headers.get('Content-Type', ''):
            data = response.json()
            # Assuming inscription_id is part of the JSON response
            return data.get('inscription_id', 'No inscription ID found')
        else:
            # Parse HTML to find inscription ID
            soup = BeautifulSoup(response.text, 'html.parser')
            inscription_id_tag = soup.find('dt', text='Inscription ID')
            if inscription_id_tag:
                inscription_id = inscription_id_tag.find_next('dd').text
                return inscription_id
            else:
                return "No inscription ID found in HTML response"
    except requests.exceptions.RequestException as e:
        return f"An error occurred: {e}"

def main():
    txid = "ab4326c7bf5d26865450f281b81b73a90ed46319a14a5c9974f969097ba5ed0a"

    urls = {
        'doge': "https://wonky-ord.dogeord.io/tx/{txid}",
        'shic': "https://shicinals-ord.com/tx/{txid}",
        'bonk': "https://inscription.bonkscoin.io/tx/{txid}",
        'pep': "https://pepinals.com/tx/{txid}"
    }

    for network, url in urls.items():
        print(f"Fetching transaction details for {network}...")
        inscription_id = get_transaction_details(url, txid)
        print(f"Inscription ID for {network}: {inscription_id}")

if __name__ == "__main__":
    main()
