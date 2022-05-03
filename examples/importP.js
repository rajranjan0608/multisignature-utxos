const { 
    avaxAssetID,
    keyChains,
    chainIDs,
    addresses,
    addressStrings,
    networkID,
    BN,
    platform
} = require("../importAPI");

const {
    UnsignedTx,
    ImportTx
} = require("avalanche/dist/apis/platformvm/index");

const { createInputsAndOutputs } = require('../createMultisig');

async function importP() {
    let memo = Buffer.from("Multisig Import Tx")
    
    // Use this parameter if you have UTXOs exported from other chains - only exported outputs will be fetched
    let sourceChain = "X";

    // unlock amount = sum(output amount) + fee
    let fee = new BN(1e6)

    // creates output 1 multi-sig (0.005 AVAX) and 1 single-sig (0.005 AVAX) to import to C-Chain
    let outputConfig = [
        {
            amount: new BN(5e6),
            owners: addresses.p,
            threshold: 2
        },
        {
            amount: new BN(5e6),
            owners: [addresses.p[1]],
            threshold: 1
        }
    ]

    // all the inputs here are the exported ones due to source chain parameter
    let { inputs, outputs } = await createInputsAndOutputs(
        avaxAssetID,
        chainIDs.p,
        addresses.p,
        addressStrings.p,
        outputConfig,
        fee,
        sourceChain
    )

    const importTx = new ImportTx(
        networkID,
        chainIDs.p,
        outputs,
        [],
        memo,
        chainIDs.x,
        inputs
    )

    const unsignedTx = new UnsignedTx(importTx)
    const tx = unsignedTx.sign(keyChains.x)
    const txID = await platform.issueTx(tx);
    console.log("TxID:", txID)
}

importP()