const { 
    avaxAssetID,
    keyChains,
    chainIDs,
    addresses,
    addressStrings,
    networkID,
    BN,
    evm
} = require("../importAPI");

const {
    UnsignedTx,
    ExportTx
} = require("avalanche/dist/apis/evm/index");

const { createInputsAndOutputs } = require('../createMultisig');

async function importP() {
    // unlock amount = sum(output amount) + fee (fees on C-Chain is dynamic)
    let fee = new BN(30e9)

    let outputConfig = [
        {
            amount: new BN(1),
            owners: addresses.x,
            threshold: 1
        },
        {
            amount: new BN(2),
            owners: addresses.x,
            threshold: 1
        }
    ]

    // all the inputs here are the exported ones due to source chain parameter
    let { inputs, outputs } = await createInputsAndOutputs(
        avaxAssetID,
        chainIDs.c,
        addresses.c,
        addressStrings.c,
        outputConfig,
        fee
    )

    console.log(inputs[0].sigIdxs)

    const exportTx = new ExportTx(
        networkID,
        chainIDs.c,
        chainIDs.x,
        inputs,
        outputs
    )

    const unsignedTx = new UnsignedTx(exportTx)
    const tx = unsignedTx.sign(keyChains.c)
    // console.log(tx.unsignedTx.transaction.inputs[0].address)
    const txID = await evm.issueTx(tx);
    console.log("TxID:", txID)
}

importP()