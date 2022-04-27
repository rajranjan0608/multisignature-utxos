const { 
    getOutputs,
    networkID,
    BN,
} = require("./importAPI");

const {
    UnsignedTx,
    BaseTx
} = require("avalanche/dist/apis/avm/index");

const { createOutput, updateInputs } = require('./utils');

/**
 * 
 * @param {Buffer} assetID ID of the asset involved in transaction
 * @param {Buffer} chainID ID of the chain on which this transaction will be issued
 * @param {Buffer[]} addresses Address whose UTXO will be consumed
 * @param {string[]} addressStrings Address strings whose UTXO will be consumed
 * @param {Buffer[]} ownerAddresses Addresses which will control the output after transaction is committed
 * @param {any} keyChain Keychain for the addresses whose UTXO will be consumed (here addressStrings)
 * @param {number} threshold Minimum number of signers required to consume the newly created output
 * @param {BN} amount Amount of nAVAX to lock with the addresses in the output
 * @returns Signed base transaction
 */
const createMultisigBaseTx = async (assetID, chainID, addresses, addressStrings, ownerAddresses, keyChain, threshold, amount) => {
    let locktime = new BN(0)
    let memo = Buffer.from("Multisig Base Transaction...")
    
    // consuming amounts (change will be handled while creating inputs)
    let fee = new BN(1e7)
    let toBeUnlocked = amount.add(fee)

    // toBeUnlocked - amount = fee (this will be remain unlocked and hence will be burned)

    let utxos = await getOutputs(addressStrings, chainID)

    console.log("Total UTXOs:", utxos.length)

    // putting right utxos in the inputs
    console.log("Putting UTXOs in the inputs...")
    let { inputs, changeTransferableOutput, netInputBalance } = updateInputs(utxos, addresses, assetID, toBeUnlocked)

    console.log("To be unlocked:", toBeUnlocked.toString())
    console.log("Net balance in inputs:", netInputBalance.toString())
    console.log("Change:", netInputBalance.sub(toBeUnlocked).toString())

    let outputs = [];

    // creating transferable outputs and transfer outputs
    console.log("Creating outputs...")
    let transferableOutput = createOutput(
        amount,
        assetID,
        ownerAddresses,
        locktime,
        threshold
    )
    outputs.push(transferableOutput)
    
    // pushing change output (if any)
    if(changeTransferableOutput !== null) {
        console.log("Creating change output...")
        outputs.push(changeTransferableOutput)
    }

    const baseTx = new BaseTx(
        networkID,
        chainID,
        outputs,
        inputs,
        memo
    )

    const unsignedTx = new UnsignedTx(baseTx)
    const tx = unsignedTx.sign(keyChain)
    return tx;
}

module.exports = {
    createMultisigBaseTx
}