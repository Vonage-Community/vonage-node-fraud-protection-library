const fetch = require('node-fetch-commonjs')

module.exports = class FraudDefenderDecision {
    async run(data) {
        const resp = await fetch('https://api.nexmo.com/v0.1/fraud-defender/check', {
            body: JSON.stringify({
                from: data.phone,
                to: data.to,
                product: 'voice',
            }),
            headers: {
                'Authorization': await this.vonage.credentials.createBasicHeader(),
                'Content-Type': 'application/json'
            },
            method: 'POST'
        })
            .then(async (resp) => await resp.json())

        return {
            stageName: 'frauddefenderdecision',
            success: resp.action === 'allow' ? true : false,
            message: resp.reason
        }
    }

    setVonageClient(vonage) {
        this.vonage = vonage;
    }
}