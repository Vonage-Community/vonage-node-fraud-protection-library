const fetch = require('node-fetch-commonjs')
const { NumberInsightV2, Insight } = require('@vonage/number-insight-v2');

module.exports = class FraudScore {
    constructor(options) {
        this.options = options;

        if (!this.options.maxScore) {
            this.options.maxScore = 80;
        }
    }

    async run(data) {
        const client = new NumberInsightV2(this.vonage.credentials);

        const resp = await client.checkForFraud({
            phone: data.phone,
            type: 'phone',
            insights: [
                Insight.FRAUD_SCORE
            ]
        });

        return {
            stageName: 'fraudScore',
            success: resp.riskScore < this.options.maxScore,
            message: resp.riskScore
        }
    }

    setVonageClient(vonage) {
        this.vonage = vonage;
    }
}