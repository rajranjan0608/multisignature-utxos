const { 
    avaxAssetID,
    keyChains,
    chainIDs,
    addresses,
    addressStrings,
    BN,
    avax,
} = require("./importAPI");

const { createMultisigBaseTx } = require('./createMultisig');

async function sendBaseTx() {
    let amount = new BN(1e2);
    let threshold = 2;
    const tx = await createMultisigBaseTx(avaxAssetID, chainIDs.x, addresses.x, addressStrings.x[1], addresses.p, keyChains.x, threshold, amount)
    const txID = await avax.issueTx(tx);
    console.log("TxID:", txID)
}

sendBaseTx()
