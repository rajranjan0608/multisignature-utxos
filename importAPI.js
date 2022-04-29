const { Avalanche, BinTools, BN } = require("avalanche")

const MnemonicHelper = require('avalanche/dist/utils/mnemonic').default
const HDNode = require('avalanche/dist/utils/hdnode').default

// Importing node details and Private key from the config file.
const { ip, port, protocol, networkID, privateKeys, mnemonic } = require('./config.js');

let { avaxAssetID, chainIDs } = require('./constants.js');

// For encoding and decoding to CB58 and buffers.
const bintools = BinTools.getInstance();

function getPrivateKey(mnemonic, activeIndex = 0) {
	const mnemonicHelper = new MnemonicHelper()
	const seed = mnemonicHelper.mnemonicToSeedSync(mnemonic)
	const hdNode = new HDNode(seed)
	
	const walletPath = `m/44'/9000'/0'/0/${activeIndex}`;
	
	return hdNode.derive(walletPath).privateKeyCB58;
}

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

function importPrivateKeys(privKey) {
	keyChains.x.importKey(privKey)
	keyChains.p.importKey(privKey)
}

// importing keys in the key chain - use this if you have any private keys
// privateKeys.forEach((privKey) => {
// 	importPrivateKeys(privKey)
// })

// importing private keys from mnemonic
importPrivateKeys(getPrivateKey(mnemonic, 0))
importPrivateKeys(getPrivateKey(mnemonic, 1))

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
const getOutputs = async (addresses, chainID, sourceChain = undefined) => {
	let utxoSet;
	if(chainID.compare(chainIDs.x) == 0) {
		utxoSet = await avax.getUTXOs(addresses, sourceChain)
	} else if (chainID.compare(chainIDs.p) == 0) {
		utxoSet = await platform.getUTXOs(addresses, sourceChain)
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