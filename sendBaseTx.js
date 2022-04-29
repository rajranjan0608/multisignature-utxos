const { 
    avaxAssetID,
    keyChains,
    chainIDs,
    addresses,
    addressStrings,
    networkID,
    BN,
    avax,
} = require("./importAPI");

const {
    UnsignedTx,
    BaseTx
} = require("avalanche/dist/apis/avm/index");

const { createInputsAndOutputs } = require('./createMultisig');

async function sendBaseTx() {
    let memo = Buffer.from("Multisig Base Tx")

    // consuming amount = sum(output amount) + fee
    let fee = new BN(1e6)

    let outputConfig = [
        {
            amount: new BN(5e8),
            owners: addresses.x,
            threshold: 2
        },
        {
            amount: new BN(1e8),
            owners: [addresses.x[1]],
            threshold: 1
        }
    ]

    let { inputs, outputs } = await createInputsAndOutputs(
        avaxAssetID,
        chainIDs.x,
        addresses.x,
        addressStrings.x[0],
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