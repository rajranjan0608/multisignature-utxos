const { Avalanche, BinTools, BN } = require("avalanche")

// Importing node details and Private key from the config file.
const { ip, port, protocol, networkID, privateKeys } = require('./config.js')

// For encoding and decoding to CB58 and buffers.
const bintools = BinTools.getInstance();

// Avalanche instance
const avalanche = new Avalanche(ip, port, protocol, networkID, "X", "C", 'fuji')

// Platform and Info API
const platform = avalanche.PChain()
const avax = avalanche.XChain()
const info = avalanche.Info();

// Keychain for signing transactions
const xKeyChain = avax.keyChain()

// importing keys in the key chain
privateKeys.forEach((privKey) => {
	xKeyChain.importKey(privKey)
})
const xAddresses = xKeyChain.getAddresses()
const xAddressStrings = xKeyChain.getAddressStrings()
console.log(xAddressStrings)

// UTXOs for spending unspent outputs
const getOutputs = async (addresses) => {
	const xchainUTXOs = await avax.getUTXOs(addresses)
	return xchainUTXOs.utxos.getAllUTXOs()
}

// Exporting these for other files to use
module.exports = {
	networkID,
	platform,
	avax,
	info,
	xKeyChain,
	xAddresses,
	xAddressStrings,
	bintools,
	getOutputs,
	BN
}