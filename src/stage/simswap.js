const fetch = require('node-fetch-commonjs')
const { NumberInsightV2, Insight } = require('@vonage/number-insight-v2');

module.exports = class SimSwap {
    async run(data) {
        const client = new NumberInsightV2(this.vonage.credentials);

        const resp = await client.checkForFraud({
            phone: data.phone,
            type: 'phone',
            insights: [
                Insight.SIM_SWAP
            ]
        });

        return {
            stageName: 'simSwap',
            success: !resp.simSwap.swapped,
            message: null
        }
    }

    setVonageClient(vonage) {
        this.vonage = vonage;
    }
}