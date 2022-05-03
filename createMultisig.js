const { 
    BN,
    avax,
    platform,
    evm,
    chainIDs,
    bintools
} = require("./importAPI");

const { createOutput, createEVMOutput, updateInputs } = require('./utils');

const checkChain = (chainID, ownerAddress) => {
    let C = {
        export: false,
        import: false
    }
    if(chainID.compare(chainIDs.c) == 0) {
        if(typeof ownerAddress == "string" && bintools.isHex(ownerAddress)) {
            console.log("Import to C-Chain")
            C.import = true;
        } else {
            console.log("Export from C-Chain")
            C.export = true;
        }
    }
    return C;
}

// UTXOs for spending unspent outputs
const getUnspentOutputs = async (addresses, chainID, sourceChain = undefined) => {
	let utxoSet;
	if(chainID.compare(chainIDs.x) == 0) {
		utxoSet = await avax.getUTXOs(addresses, sourceChain)
	} else if (chainID.compare(chainIDs.p) == 0) {
		utxoSet = await platform.getUTXOs(addresses, sourceChain)
	} else if (chainID.compare(chainIDs.c) == 0) {
		utxoSet = await evm.getUTXOs(addresses, sourceChain)
	} 
	return utxoSet.utxos.getAllUTXOs()
}

/**
 * 
 * @param {Buffer} assetID ID of the asset involved in transaction
 * @param {Buffer} chainID ID of the chain on which this transaction will be issued
 * @param {Buffer[]} addresses Address whose UTXO will be consumed
 * @param {string[]} addressStrings Address strings whose UTXO will be fetched
 * @param {Buffer[]} ownerAddresses Addresses which will control the output after transaction is committed
 * @param {number} threshold Minimum number of signers required to consume the newly created output
 * @returns Signed base transaction
 */
const createInputsAndOutputs = async (assetID, chainID, addresses, addressStrings, outputConfig, fee, sourceChain) => {
    let locktime = new BN(0)

    let C = checkChain(chainID, outputConfig[0].owners)

    let utxos = [];
    if(C.export) {
        addresses.push("0x3b0e59fc2e9a82fa5eb3f042bc5151298e4f2cab") // getHexAddress(addresses[0])
    } else {
        utxos = await getUnspentOutputs(addressStrings, chainID, sourceChain);
    }

    let toBeUnlocked = fee;
    outputConfig.forEach((output) => {
        toBeUnlocked = toBeUnlocked.add(output.amount)
    }) 

    // putting right utxos in the inputs
    let { inputs, changeTransferableOutput } = await updateInputs(utxos, addresses, C, assetID, toBeUnlocked, chainID)

    let outputs = [];

    // creating transferable outputs and transfer outputs
    outputConfig.forEach((output) => {
        let newOutput;
        if(!C.import) {
            newOutput = createOutput(
                output.amount,
                assetID,
                output.owners,
                locktime,
                output.threshold
            )
        } else {
            newOutput = createEVMOutput(
                output.amount,
                output.owners,
                assetID
            )
        }
        outputs.push(newOutput)
    })
        
    // pushing change output (if any)
    if(changeTransferableOutput != undefined && !C.import) {
        outputs.push(changeTransferableOutput)
    }

    return { inputs, outputs }
}

module.exports = {
    createInputsAndOutputs
}