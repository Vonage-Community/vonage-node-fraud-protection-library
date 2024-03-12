const { Vonage } = require('@vonage/server-sdk');

module.exports = class FraudProtection {
    constructor(creds) {
        this.stages = [];

        if (creds instanceof Vonage) {
            this.vonage = creds;
        } else {
            this.vonage = new Vonage(creds)
        }
    }

    add(stage) {
        this.stages.push(stage);
    }

    async run(data, existingContext) {
        let count = 0;
        let skipTo = count;
        const results = existingContext?.results || [];

        if (results.length !== 0) {
            skipTo = results.length -1;
        }

        for(const stageCount in this.stages) {
            if (skipTo > 0 && skipTo > count) {
                count++;
                continue;
            }

            const stage = this.stages[stageCount];
            if (stage.setVonageClient instanceof Function) {
                stage.setVonageClient(this.vonage);
            }

            const res = await stage.run(data);
            res.stage = count;
            results[stageCount] = res;
            count++;

            if (!res.success) {
                break;
            }
        }

        return {
            success: results[results.length - 1].success,
            results
        }
    }
}