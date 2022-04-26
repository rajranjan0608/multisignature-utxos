require('dotenv').config();

module.exports = {
	protocol: "https",
	ip: "api.avax-test.network",
	port: 443,
	networkID: 5,
	avaxAssetID: "U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK",
	xChainID: "2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm",
	privateKeys: JSON.parse(process.env.PRIVATEKEYS)
}