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
    ExportTx
} = require("avalanche/dist/apis/avm/index");

const { createInputsAndOutputs } = require('../createMultisig');

async function exportXP() {
    let memo = Buffer.from("Multisig Export Tx")

    // consuming amount = sum(output amount) + fee
    let fee = new BN(1e6)

    // creates mutlti-sig (0.1 AVAX) and single-sig (0.03 AVAX) output for exporting to P Address (0.001 AVAX will be fees)
    let outputConfig = [
        {
            amount: new BN(3e6),
            owners: [addresses.p[0]],
            threshold: 1
        },
        {
            amount: new BN(1e8),
            owners: addresses.p,
            threshold: 2
        }
    ]

    // importing fees will be deducted from these our other outputs in the exported output memory
    let { inputs, outputs } = await createInputsAndOutputs(
        avaxAssetID,
        chainIDs.x,
        addresses.x,
        addressStrings.x,
        outputConfig,
        fee,
    )

    const exportTx = new ExportTx(
        networkID,
        chainIDs.x,
        [outputs.at(-1)],
        inputs,
        memo,
        chainIDs.p,
        [outputs[0], outputs[1]]
    )

    const unsignedTx = new UnsignedTx(exportTx)
    const tx = unsignedTx.sign(keyChains.x)
    const txID = await avax.issueTx(tx);
    console.log("TxID:", txID)
}

exportXP()