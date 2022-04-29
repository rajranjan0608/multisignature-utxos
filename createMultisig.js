const { 
    getOutputs,
    BN,
} = require("./importAPI");

const { createOutput, updateInputs } = require('./utils');

/**
 * 
 * @param {Buffer} assetID ID of the asset involved in transaction
 * @param {Buffer} chainID ID of the chain on which this transaction will be issued
 * @param {Buffer[]} addresses Address whose UTXO will be consumed
 * @param {string[]} addressStrings Address strings whose UTXO will be fetched
 * @param {Buffer[]} ownerAddresses Addresses which will control the output after transaction is committed
 * @param {BN} toBeUnlocked Amount of nAVAX to lock with the addresses in the output
 * @param {number} threshold Minimum number of signers required to consume the newly created output
 * @returns Signed base transaction
 */
const createInputsAndOutputs = async (assetID, chainID, addresses, addressStrings, outputConfig, fee, sourceChain) => {
    let locktime = new BN(0)

    let utxos = await getOutputs(addressStrings, chainID, sourceChain)

    let toBeUnlocked = fee;
    outputConfig.forEach((output) => {
        toBeUnlocked = toBeUnlocked.add(output.amount)
    }) 

    console.log("Total UTXOs:", utxos.length)

    // putting right utxos in the inputs
    console.log("Putting UTXOs in the inputs...")
    let { inputs, changeTransferableOutput, netInputBalance } = updateInputs(utxos, addresses, assetID, toBeUnlocked, chainID)

    console.log("To be unlocked:", toBeUnlocked.toString())
    console.log("Net balance in inputs:", netInputBalance.toString())

    let outputs = [];

    // creating transferable outputs and transfer outputs
    console.log("Creating outputs...")

    outputConfig.forEach((output) => {
        let transferableOutput = createOutput(
            output.amount,
            assetID,
            output.owners,
            locktime,
            output.threshold
        )
        outputs.push(transferableOutput)
    })
    
    // pushing change output (if any)
    if(changeTransferableOutput !== null) {
        console.log("Creating change output...")
        outputs.push(changeTransferableOutput)
    }

    return { inputs, outputs }
}

module.exports = {
    createInputsAndOutputs
}