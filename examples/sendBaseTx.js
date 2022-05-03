const { 
    avaxAssetID,
    keyChains,
    chainIDs,
    addresses,
    addressStrings,
    networkID,
    BN,
    avax,
} = require("../importAPI");

const {
    UnsignedTx,
    BaseTx
} = require("avalanche/dist/apis/avm/index");

const { createInputsAndOutputs } = require('../createMultisig');

async function sendBaseTx() {
    let memo = Buffer.from("Multisig Base Tx")

    // unlock amount = sum(output amounts) + fee
    let fee = new BN(1e6)

    // creating outputs of 0.5 (multisig) and 0.1 AVAX - change output will be added by the function in the last
    let outputConfig = [
        {
            amount: new BN(5e4),
            owners: addresses.x,
            threshold: 2
        },
        {
            amount: new BN(1e4),
            owners: [addresses.x[1]],
            threshold: 1
        }
    ]

    let { inputs, outputs } = await createInputsAndOutputs(
        avaxAssetID,
        chainIDs.x,
        addresses.x,
        addressStrings.x,
        outputConfig,
        fee,
    )

    const baseTx = new BaseTx(
        networkID,
        chainIDs.x,
        outputs,
        inputs,
        memo
    )

    const unsignedTx = new UnsignedTx(baseTx)
    const tx = unsignedTx.sign(keyChains.x)
    const txID = await avax.issueTx(tx);
    console.log("TxID:", txID)
}

sendBaseTx()