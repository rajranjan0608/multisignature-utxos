require('dotenv').config();

module.exports = {
	protocol: "https",
	ip: "api.avax-test.network",
	port: 443,
	networkID: 5,
	privateKeys: JSON.parse(process.env.PRIVATEKEYS),
	mnemonic: process.env.MNEMONIC
}