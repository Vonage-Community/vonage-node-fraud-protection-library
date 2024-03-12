# Vonage Fraud Prevention Library

A wrapper around various fraud prevention libraries provided by Vonage in one
package. Add a variety of steps to gauge the potential fraud based on a device
or telephone number, and build business rules around handling the results.
Information can easily be fed into automated systems to provide real-time
alerting and blocking.

## Installation

### Requirements

* Node.js 18+
* [A Vonage Developer Account](https://ui.idp.vonage.com/ui/auth/registration)
* Some modules may require additional account settings, contact Support for more information:
    * Fraud Defender Decision API
    * Silent Authentication

### Install Package

You can include the library in your application by installing it through NPM:

```bash
npm install @vonage/fraud-protection-library
```

## Usage

The Vonage Fraud Protection Library is a wrapper for the Vonage Node SDK that
will automatically set up and process data through a workflow specified by the
developer. You will create a new instance of our Fraud Protection library with
your Vonage credentials, add in the products you want to use as part of the
Fraud Protection workflow, and then run any data you have the workflows.

```js
const client = new fraudProtection({
    apiKey: '<vonage-api-key>',
    apiSecret: '<vonage-api-secret>',
    applicationId: '<vonage-application-id>',
    privateKey: '<vonage-private-key>'
});

// Add the products you want to run through
client.add(new FraudDefenderDecision())
client.add(new TFA({ sendPin: true }))

// Keep track of workflow with a "context"
const existingContext = req.session.context || {};
// Pass data into the library for us to check against
const data = req.session.data || {phone: '14199802340', to: '18003819125'};

// Run the data through the services and get a result
const context = await client.run(data, existingContext);
```

The `client.run()` method will return a "context", which is a result of the
workflow runs. This context can be saved off for later, or even augmented with
additional info to be re-run (for example, the first run may fail Verify due
to a missing PIN, but a second run can be done adding in the PIN to check).

```json
{
  success: false,
  results: [
    {
      stageName: 'frauddefenderdecision',
      success: true,
      message: undefined,
      stage: 0
    },
    { stageName: 'simSwap', success: true, message: null, stage: 1 },
    {
      stageName: 'tfa',
      success: false,
      message: 'No Request ID',
      requestId: 'a0b7faa7-8077-4593-816d-xxxxxxxxxxxx',
      stage: 2
    }
  ]
}
```

Your application can check `context.success` for an overall pass/fail, or dive
into any stage to make individual decisions.