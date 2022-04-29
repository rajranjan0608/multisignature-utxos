const {
    BN,
    chainIDs
} = require("./importAPI")

let SECPTransferInput, TransferableInput, SECPTransferOutput, TransferableOutput;

const getTransferClass = (chainID) => {
    let vm = ""
    if(chainID.compare(chainIDs.x) == 0) {
        vm = "avm"
    } else if(chainID.compare(chainIDs.p) == 0) {
        vm = "platformvm"
    }
    return { SECPTransferInput, TransferableInput, SECPTransferOutput, TransferableOutput, index } = require(`avalanche/dist/apis/${vm}/index`);
}

const createOutput = (amount, assetID, addresses, locktime, threshold) => {
    let transferOutput = new SECPTransferOutput(
        amount,
        addresses,
        locktime,
        threshold
    )

    return new TransferableOutput(
        assetID,
        transferOutput
    )
}

const addSignatureIndexes = (addresses, threshold, input) => {
    let sigIndex = 0;
    addresses.every((address) => {
        if(threshold > 0) {
                input.addSignatureIdx(sigIndex, address);
                sigIndex++;
                threshold--;
            return true;
        } else {
            return false;
        }
    })
}

const createInput = (amount, txID, outputIndex, assetID, spenders, threshold) => {
    // creating transfer input
    let transferInput = new SECPTransferInput(amount)

    // adding threshold signatures
    addSignatureIndexes(spenders, threshold, transferInput)

    // creating transferable input
    return new TransferableInput(
        txID,
        outputIndex,
        assetID,
        transferInput
    )
}

const updateInputs = (utxos, addresses, assetID, toBeUnlocked, chainID) => {
    // Getting transferable inputs according to chain id
    { SECPTransferInput, TransferableInput, SECPTransferOutput, TransferableOutput, index = getTransferClass(chainID) }

    let inputs = [], changeTransferableOutput = null, netInputBalance = new BN(0); 
    utxos.forEach((utxo) => {
        let output = utxo.getOutput()
        if(output.getOutputID() === 7 && assetID.compare(utxo.getAssetID()) === 0 && netInputBalance < toBeUnlocked) {
            let outputThreshold = output.getThreshold();

            // spenders which we have in our keychain
            let qualifiedSpenders = output.getSpenders(addresses);

            // create inputs only if we have custody of threshold or more number of utxo spenders
            if(outputThreshold <= qualifiedSpenders.length) {
                let txID = utxo.getTxID();
                let outputIndex = utxo.getOutputIdx();
                let utxoAmount = output.amountValue;
                let outputLocktime = output.getLocktime()

                netInputBalance = netInputBalance.add(utxoAmount)

                let excessAmount = toBeUnlocked.sub(netInputBalance);

                // creating change transferable output
                if(excessAmount < 0) {
                    changeTransferableOutput = createOutput(
                        excessAmount.abs(),
                        assetID,
                        qualifiedSpenders,
                        outputLocktime,
                        outputThreshold
                    )
                }

                // create transferable input
                let transferableInput = createInput(
                    utxoAmount,
                    txID,
                    outputIndex,
                    assetID,
                    qualifiedSpenders,
                    outputThreshold
                )
    
                inputs.push(transferableInput)
            }
        }
    })
    return { inputs, changeTransferableOutput, netInputBalance }
}

module.exports = {
    createOutput,
    createInput,
    updateInputs
}