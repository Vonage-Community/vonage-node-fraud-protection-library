const { Vonage } = require('@vonage/server-sdk');
const fetch = require('node-fetch-commonjs')

module.exports = class TFA {
    constructor(options) {
        this.options = options;
    }

    async run(data) {
        if (data?.tfaPin && !data?.tfaRequestId) {
            return {
                stageName: 'tfa',
                success: false,
                message: 'No Request ID supplied with PIN',
            }
        }

        if (data?.tfaRequestId && !data?.tfaPin) {
            return {
                stageName: 'tfa',
                success: false,
                message: 'No PIN supplied for Request ID',
            }
        }

        if (this.options?.sendPin && !data?.tfaRequestId) {
            const smsWorkflow = {
                channel: 'sms',
                to: data.phone,
            };

            if (this.options.from) {
                smsWorkflow.from = this.options.from;
            }

            const resp = await this.vonage.verify2.newRequest({
                brand: 'Vonage Test',
                workflow: [
                    smsWorkflow
                ]
            });

            return {
                stageName: 'tfa',
                success: false,
                message: 'No Request ID',
                requestId: resp.requestId
            }
        }

        const resp = await this.vonage.verify2.checkCode(data.tfaRequestId, data.tfaPin);

        return {
            stageName: 'tfa',
            success: resp === 'completed' ? true : false,
            message: null
        }
    }

    /**
     * @param {Vonage} vonage 
     */
    setVonageClient(vonage) {
        this.vonage = vonage;
    }
}