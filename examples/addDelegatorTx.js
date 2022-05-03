const { 
    avaxAssetID,
    keyChains,
    chainIDs,
    addresses,
    addressStrings,
    networkID,
    BN,
    platform,
} = require("../importAPI");

const {
    UnsignedTx,
    AddDelegatorTx,
    SECPOwnerOutput,
    ParseableOutput
} = require("avalanche/dist/apis/platformvm/index");

const {
    NodeIDStringToBuffer,
    UnixNow
} = require("avalanche/dist/utils")

const { createInputsAndOutputs } = require('../createMultisig');

async function addDelegator() {
    let nodeID = NodeIDStringToBuffer("NodeID-4B4rc5vdD1758JSBYL1xyvE5NHGzz6xzH")
    let locktime = new BN(0)
    let stakeAmount = await platform.getMinStake()
    let startTime = UnixNow().add(new BN(60 * 1))
    let endTime = startTime.add(new BN(2630000))
    let memo = Buffer.from("Multi-sig Add Delegator Tx")

    // unlock amount = sum(output amounts) + fee
    let fee = new BN(1e6)

    // creating stake amount output at 0th index
    let outputConfig = [
        {
            amount: stakeAmount.minValidatorStake,
            owners: addresses.p,
            threshold: 2
        }
    ]

    // outputs to be created for rewards
    const rewardOutputOwners = new SECPOwnerOutput(
        addresses.p,
        locktime,
        2
    )
    const rewardOwners = new ParseableOutput(rewardOutputOwners)

    let { inputs, outputs } = await createInputsAndOutputs(
        avaxAssetID,
        chainIDs.p,
        addresses.p,
        addressStrings.p,
        outputConfig,
        fee,
    )

    const addDelegatorTx = new AddDelegatorTx(
        networkID,
        chainIDs.p,
        [],
        inputs,
        memo,
        nodeID,
        startTime,
        endTime,
        stakeAmount.minDelegatorStake,
        [outputs[0]],
        rewardOwners
    )

    const unsignedTx = new UnsignedTx(addDelegatorTx)
    const tx = unsignedTx.sign(keyChains.p)
    const txID = await platform.issueTx(tx);
    console.log("TxID:", txID)
}

addDelegator()