const { 
    getOutputs,
    networkID,
    xKeyChain,
    xAddresses,
    xAddressStrings,
    bintools,
    BN
} = require("./importAPI");

const {
    UnsignedTx,
    BaseTx
} = require("avalanche/dist/apis/avm/index");

const { createOutput, updateInputs } = require('./utils');

const createMultisig = async () => {
    let avaxAssetIdBuff = bintools.cb58Decode("U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK")
    let xChainID = bintools.cb58Decode("2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm")

    let locktime = new BN(0)
    let memo = Buffer.from("Multisig Base Transaction")

    let threshold = 2
    
    // consuming amounts (change will be handled while creating inputs)
    let sendAmount = new BN(1e2);
    let fee = new BN(1e7)
    let toBeUnlocked = sendAmount.add(fee)

    // toBeUnlocked - sendAmount = fee (this will be remain unlocked and hence will be burned)

    let utxos = await getOutputs(xAddressStrings[1])

    // putting right utxos in the inputs
    let { inputs, changeTransferableOutput, netInputBalance } = updateInputs(utxos, xAddresses, avaxAssetIdBuff, toBeUnlocked)

    let outputs = [];

    // creating transferable outputs and transfer outputs
    let transferableOutput = createOutput(
        sendAmount,
        avaxAssetIdBuff,
        xAddresses,
        locktime,
        threshold
    )
    outputs.push(transferableOutput)
    
    // pushing change output (if any)
    if(changeTransferableOutput !== null) {
        outputs.push(changeTransferableOutput)
    }

    console.log("Total balance in inputs", netInputBalance.toString())

    const baseTx = new BaseTx(
        networkID,
        xChainID,
        outputs,
        inputs,
        memo
    )

    const unsignedTx = new UnsignedTx(baseTx)
    const tx = unsignedTx.sign(xKeyChain)
    // const txID = await avax.issueTx(tx);
    // console.log(txID);
}

createMultisig()