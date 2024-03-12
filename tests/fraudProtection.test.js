const FraudProtection = require("../src/fraudProtection.js")
const FraudDefenderDecision = require("../src/stage/decision.js")
const SimSwap = require("../src/stage/simswap.js");
const TFA = require("../src/stage/tfa.js");
const nock = require('nock');
const fs = require('fs');

const key = fs.readFileSync(`${__dirname}/private.test.key`).toString();

test('Products can be added to fraud prevention stack', async () => {
    const scope1 = nock('https://api.nexmo.com')
        .persist()
        .post('/v0.1/fraud-defender/check', { to: '18005556666', from: '15556667890', product: 'voice' })
        .reply(200, {
            rule_id: '-1',
            action: 'allow',
            reason: '',
            subsystem: 'prefix',
        });
    const scope2 = nock('https://api.nexmo.com')
        .persist()
        .post('/v2/ni', {
            type: 'phone',
            phone: '15556667890',
            insights: [
                'sim_swap'
            ]
        })
        .reply(200, {
            request_id: "3f92ed75-e624-4503-abbd-a93d6b442571",
            type: "phone",
            phone: {
                phone: "15556667890",
                carrier: "Google (Grand Central) - SVR",
                type: "VOIP"
            },
            sim_swap: {
                status: "completed",
                swapped: true
            }
          })

    const client = new FraudProtection({apiKey: '1234', apiSecret: 'abcd', applicationId: 'abcd-1234', privateKey: key});

    client.add(new FraudDefenderDecision())
    client.add(new SimSwap())

    const existingContext = {};
    const context = await client.run({phone: '15556667890', to: '18005556666'}, existingContext);

    expect(context.success).toBe(false);
    const failedStage = context.results[context.results.length - 1];
    expect(failedStage.success).toBe(false);
    expect(failedStage.stageName).toBe('simSwap');

    nock.cleanAll();
})

test('Products can be re-run with additional context', async () => {
    const scope3 = nock('https://api.nexmo.com')
        .persist()
        .post('/v2/verify/ff3929df-1224-4398-8702-e83403e5a61c', {
            code: '1234'
        })
        .reply(200, {
            request_id: "ff3929df-1224-4398-8702-e83403e5a61c",
            status: "completed",
        })
            
    const client = new FraudProtection({apiKey: '1234', apiSecret: 'abcd', applicationId: 'abcd-1234', privateKey: key});

    client.add(new FraudDefenderDecision())
    client.add(new SimSwap())
    client.add(new TFA())

    const existingContext = {
        success: false, 
        results: [
            {success: true, stage: 0, stageName: 'frauddefenderdecision'}, 
            {success: true, stage: 1, stageName: 'simSwap'}, 
            {success: false, stage: 2, stageName: 'tfa'}, 
        ]
    };
    const context = await client.run({phone: '15556667890', tfaRequestId: 'ff3929df-1224-4398-8702-e83403e5a61c', tfaPin: '1234'}, existingContext);

    expect(context.success).toBe(true);
    const failedStage = context.results[context.results.length - 1];
    expect(failedStage.success).toBe(true);
    expect(failedStage.stageName).toBe('tfa');
    expect(failedStage.message).toBe(null);

    nock.cleanAll();
})

test('TFA will send PIN when configured', async () => {
    nock('https://api.nexmo.com')
        .persist()
        .post('/v2/verify', {
            brand: 'Vonage Test',
            workflow: [
                {
                    channel: 'sms',
                    to: '15556667890',
                    from: '18005556666'
                }
            ]
        })
        .reply(200, {
            request_id: "ff3929df-1224-4398-8702-e83403e5a61c",
        })
            
    const client = new FraudProtection({apiKey: '1234', apiSecret: 'abcd', applicationId: 'abcd-1234', privateKey: key});

    client.add(new TFA({ sendPin: true, from: '18005556666' }))

    const context = await client.run({phone: '15556667890'});

    expect(context.success).toBe(false);
    const failedStage = context.results[context.results.length - 1];
    expect(failedStage.success).toBe(false);
    expect(failedStage.stageName).toBe('tfa');
    expect(failedStage.message).toBe('No Request ID');
    expect(failedStage.requestId).toBe('ff3929df-1224-4398-8702-e83403e5a61c')

    nock.cleanAll();
})