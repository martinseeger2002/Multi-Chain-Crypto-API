const dogecore = require('./bitcore-lib-luckycoin');
const { PrivateKey, Transaction } = dogecore;

// Get command-line arguments
const args = process.argv.slice(2);
const [txId, outputIndex, address, script, satoshis, privateKeyWIF, receivingAddress1, amount1, receivingAddress2, amount2, fee, changeAddress] = args;

// Define the UTXOs
const utxos = [
  {
    txId,
    outputIndex: parseInt(outputIndex),
    address,
    script,
    satoshis: parseInt(satoshis)
  }
];

// Define the private key
const privateKey = PrivateKey.fromWIF(privateKeyWIF);

// Define the transaction
const transaction = new Transaction()
  .from(utxos) // Add UTXOs
  .to(receivingAddress1, parseInt(amount1)) // Send to the first receiving address
  .to(receivingAddress2, parseInt(amount2)) // Send to the second receiving address
  .fee(parseInt(fee)) // Set the transaction fee
  .change(changeAddress) // Change address
  .sign(privateKey); // Sign the transaction

// Get the transaction hex
const txHex = transaction.serialize();
console.log('Transaction Hex:', txHex);