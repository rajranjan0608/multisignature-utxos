const { Avalanche, BinTools, BN } = require("avalanche")
const Web3 = require('web3')

const MnemonicHelper = require('avalanche/dist/utils/mnemonic').default
const HDNode = require('avalanche/dist/utils/hdnode').default
const { privateToAddress } = require('ethereumjs-util')

// Importing node details and Private key from the config file.
const { ip, port, protocol, networkID, privateKeys, mnemonic } = require('./config.js');

let { avaxAssetID, chainIDs } = require('./constants.js');

// For encoding and decoding to CB58 and buffers.
const bintools = BinTools.getInstance();

function getPrivateKey(mnemonic, activeIndex = 0) {
	const mnemonicHelper = new MnemonicHelper()
	const seed = mnemonicHelper.mnemonicToSeedSync(mnemonic)
	const hdNode = new HDNode(seed)
	
	const avaPath = `m/44'/9000'/0'/0/${activeIndex}`;
	const ethPath = `m/44'/60'/0'/0/0`;

	// console.log(hdNode.derive(ethPath).privateKey.toString('hex'))
	
	return hdNode.derive(avaPath).privateKeyCB58;
}

// Avalanche instance
const avalanche = new Avalanche(ip, port, protocol, networkID)
const nodeURL = `${protocol}://${ip}:${port}/ext/bc/C/rpc`;
let web3 = new Web3(nodeURL);

// Platform and Avax API
const platform = avalanche.PChain()
const avax = avalanche.XChain()
const evm = avalanche.CChain()

// Keychain for signing transactions
const keyChains = {
	x: avax.keyChain(),
	p: platform.keyChain(),
	c: evm.keyChain()
}

function importPrivateKeys(privKey) {
	keyChains.x.importKey(privKey)
	keyChains.p.importKey(privKey)
	keyChains.c.importKey(privKey)
}

// importing keys in the key chain - use this if you have any private keys
privateKeys.forEach((privKey) => {
	importPrivateKeys(privKey)
})

// importing private keys from mnemonic
importPrivateKeys(getPrivateKey(mnemonic, 0))
importPrivateKeys(getPrivateKey(mnemonic, 1))

const addresses = {
	x: keyChains.x.getAddresses(),
	p: keyChains.p.getAddresses(),
	c: keyChains.c.getAddresses()
}

const addressStrings = {
	x: keyChains.x.getAddressStrings(),
	p: keyChains.p.getAddressStrings(),
	c: keyChains.c.getAddressStrings()
}

avaxAssetID = bintools.cb58Decode(avaxAssetID)

chainIDs = {
	x: bintools.cb58Decode(chainIDs.x),
	p: bintools.cb58Decode(chainIDs.p),
	c: bintools.cb58Decode(chainIDs.c)
}

// Exporting these for other files to use
module.exports = {
	networkID,
	platform,
	avax,
	evm,
	keyChains,
	avaxAssetID,
	addresses,
	addressStrings,
	chainIDs,
	bintools,
	web3,
	BN
}