const {
    SECPTransferInput,
    TransferableInput,
    SECPTransferOutput,
    TransferableOutput
} = require("avalanche/dist/apis/avm/index");

const {
    BN
} = require("./importAPI")

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

const getCustodialSpenders = (addresses, spenders) => {
    let custodialSpenders = []
    addresses.forEach((address) => {
        if(spenders.includes(address)) {
            custodialSpenders.push(address)
        }
    })
    return custodialSpenders;
}

const addSignatures = (addresses, threshold, input) => {
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
    addSignatures(spenders, threshold, transferInput)

    // creating transferable input
    return new TransferableInput(
        txID,
        outputIndex,
        assetID,
        transferInput
    )
}

const updateInputs = (utxos, addresses, assetID, toBeUnlocked) => {
    let inputs = [], changeTransferableOutput = null, netInputBalance = new BN(0); 
    utxos.forEach((utxo) => {
        let output = utxo.getOutput()
        if(output.getOutputID() === 7 && assetID.compare(utxo.getAssetID()) === 0 && netInputBalance < toBeUnlocked) {
            let outputThreshold = output.getThreshold();
            let spenders = output.getSpenders(addresses);

            // spenders which we have in our keychain
            let custodialSpenders = getCustodialSpenders(addresses, spenders)

            // create inputs only if we have custody of threshold or more number of utxo spenders
            if(outputThreshold <= custodialSpenders.length) {
                let txID = utxo.getTxID();
                let outputIndex = utxo.getOutputIdx();
                let utxoAmount = output.amountValue;
                let outputLocktime = output.getLocktime()

                netInputBalance = netInputBalance.add(utxoAmount)

                // creating change transferable output
                if(utxoAmount > toBeUnlocked) {
                    changeTransferableOutput = createOutput(
                        utxoAmount.sub(toBeUnlocked),
                        assetID,
                        spenders,
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
                    custodialSpenders,
                    outputThreshold
                )
    
                inputs.push(transferableInput)
            }
        }
    })
    return { inputs, changeTransferableOutput, netInputBalance }
}

module.exports = {
    getCustodialSpenders,
    addSignatures,
    createOutput,
    createInput,
    updateInputs
}