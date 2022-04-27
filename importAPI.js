const { Avalanche, BinTools, BN } = require("avalanche")

// Importing node details and Private key from the config file.
const { ip, port, protocol, networkID, privateKeys } = require('./config.js');

let { avaxAssetID, chainIDs } = require('./constants.js');

// For encoding and decoding to CB58 and buffers.
const bintools = BinTools.getInstance();

// Avalanche instance
const avalanche = new Avalanche(ip, port, protocol, networkID, "X", "C", 'fuji')

// Platform and Avax API
const platform = avalanche.PChain()
const avax = avalanche.XChain()

// Keychain for signing transactions
const keyChains = {
	x: avax.keyChain(),
	p: platform.keyChain()
}

// importing keys in the key chain
privateKeys.forEach((privKey) => {
	keyChains.x.importKey(privKey)
	keyChains.p.importKey(privKey)
})

const addresses = {
	x: keyChains.x.getAddresses(),
	p: keyChains.p.getAddresses()
}

const addressStrings = {
	x: keyChains.x.getAddressStrings(),
	p: keyChains.p.getAddressStrings()
}

avaxAssetID = bintools.cb58Decode(avaxAssetID)

chainIDs = {
	x: bintools.cb58Decode(chainIDs.x),
	p: bintools.cb58Decode(chainIDs.p)
}

// UTXOs for spending unspent outputs
const getOutputs = async (addresses, chainID) => {
	let utxoSet;
	if(chainID.compare(chainIDs.x) == 0) {
		utxoSet = await avax.getUTXOs(addresses)
	} else if (chainID.compare(chainIDs.p) == 0) {
		utxoSet = await platform.getUTXOs(addresses)
	}
	return utxoSet.utxos.getAllUTXOs()
}

// Exporting these for other files to use
module.exports = {
	networkID,
	platform,
	avax,
	keyChains,
	avaxAssetID,
	addresses,
	addressStrings,
	chainIDs,
	bintools,
	getOutputs,
	BN
}