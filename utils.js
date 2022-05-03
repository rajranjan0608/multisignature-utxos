const {
    BN,
    chainIDs,
    web3,
} = require("./importAPI")

let SECPTransferInput, TransferableInput, SECPTransferOutput, TransferableOutput, EVMInput, EVMOutput;

const getTransferClass = (chainID) => {
    let vm = ""
    if(chainID.compare(chainIDs.x) == 0) {
        vm = "avm"
    } else if(chainID.compare(chainIDs.p) == 0) {
        vm = "platformvm"
    } else if(chainID.compare(chainIDs.c) == 0) {
        vm = "evm"
    }
    return { SECPTransferInput, TransferableInput, SECPTransferOutput, TransferableOutput, EVMInput, EVMOutput, index } = require(`avalanche/dist/apis/${vm}/index`);
}

const createEVMInput = (amount, addresses, assetID, nonce) => {
    const hexAddress = addresses.at(-1);
    const evmInput = new EVMInput(
        hexAddress,
        amount,
        assetID,
        nonce
    )
    evmInput.addSignatureIdx(0, addresses[0])
    
    return evmInput
}

const createEVMOutput = (amount, hexAddress, assetID) => {
    return new EVMOutput(
        hexAddress,
        amount,
        assetID
    )
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

const updateTransferClass = (chainID) => {
    { SECPTransferInput, TransferableInput, SECPTransferOutput, TransferableOutput, EVMInput, EVMOutput, index = getTransferClass(chainID) }
}

const updateInputs = async (utxos, addresses, C, assetID, toBeUnlocked, chainID) => {
    // Getting transferable inputs according to chain id
    updateTransferClass(chainID)

    let inputs = [], changeTransferableOutput = undefined, netInputBalance = new BN(0); 
    
    if(C.export) {
        const nonce = await web3.eth.getTransactionCount(addresses.at(-1));
        inputs.push(createEVMInput(toBeUnlocked, addresses, assetID, nonce))
    } else {
        utxos.forEach((utxo) => {
            let output = utxo.getOutput()
            if(output.getOutputID() === 7 && assetID.compare(utxo.getAssetID()) === 0 && netInputBalance.lt(toBeUnlocked)) {
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
    
                    let excessAmount = netInputBalance.sub(toBeUnlocked);
    
                    // creating change transferable output
                    if(excessAmount > 0) {
                        if(!C.import) {
                            changeTransferableOutput = createOutput(
                                excessAmount,
                                assetID,
                                qualifiedSpenders,
                                outputLocktime,
                                outputThreshold
                            )
                        }
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
    }
    return { inputs, changeTransferableOutput }
}

module.exports = {
    createOutput,
    createEVMOutput,
    updateInputs
}