const { assert } = require('chai');
const { fundAmount } = require('../constant');

const OpenGrant = require('../OpenGrant');
const { fund } = require('../utils');

const shouldPass = async (openGrant, params) => {
  const { error } = await fund(openGrant, params);
  assert.strictEqual(error, null, 'Found hould not catch an error');
};

const shouldFail = async (openGrant, params) => {
  const { error } = await fund(openGrant, params);
  assert.notEqual(error, null, 'Found should catch an error');
};

describe('Unit Test - fund', async () => {
  const openGrant = new OpenGrant();

  before(async () => {
    await openGrant.init();
  });

  it('Input with non-empty string should pass', async () => {
    const params = {
      fundBalance: fundAmount,
    };
    await shouldPass(openGrant, params);
  });

  it('Input as 0 should fail', async () => {
    const params = {
      fundBalance: 0,
    };
    await shouldFail(openGrant, params);
  });
});
