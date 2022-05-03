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
    ImportTx
} = require("avalanche/dist/apis/evm/index");

const { createInputsAndOutputs } = require('../createMultisig');

async function importP() {
    // Use this parameter if you have UTXOs exported from other chains - only exported outputs will be fetched
    let sourceChain = "X";

    // unlock amount = sum(output amount) + fee (fees on C-Chain is dynamic)
    let fee = new BN(0)

    let outputConfig = [
        {
            amount: new BN(1e4),
            owners: "0x4406a53c35D05424966bD8FC354E05a3c6B56aF0",
        },
        {
            amount: new BN(2e4),
            owners: "0x3b0e59fc2e9a82fa5eb3f042bc5151298e4f2cab",
        }
    ]

    // all the inputs here are the exported ones due to source chain parameter
    let { inputs, outputs } = await createInputsAndOutputs(
        avaxAssetID,
        chainIDs.c,
        addresses.c,
        addressStrings.c,
        outputConfig,
        fee,
        sourceChain
    )

    const importTx = new ImportTx(
        networkID,
        chainIDs.c,
        chainIDs.x,
        inputs,
        outputs
    )

    const unsignedTx = new UnsignedTx(importTx)
    const tx = unsignedTx.sign(keyChains.x)
    const txID = await evm.issueTx(tx);
    console.log("TxID:", txID)
}

importP()