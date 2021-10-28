const { assert } = require('chai');
const { fundAmount } = require('../constant');

const QuadraticFunding = require('../QuadraticFunding');
const { fund } = require('../utils');

const shouldPass = async (quadraticFunding, params) => {
  const { error } = await fund(quadraticFunding, params);
  assert.strictEqual(error, null, 'Found hould not catch an error');
};

const shouldFail = async (quadraticFunding, params) => {
  const { error } = await fund(quadraticFunding, params);
  assert.notEqual(error, null, 'Found should catch an error');
};

describe('Unit Test - fund', async () => {
  const quadraticFunding = new QuadraticFunding();

  before(async () => {
    await quadraticFunding.init();
  });

  it('Input with non-empty string should pass', async () => {
    const params = {
      fundBalance: fundAmount,
    };
    await shouldPass(quadraticFunding, params);
  });

  it('Input as 0 should fail', async () => {
    const params = {
      fundBalance: 0,
    };
    await shouldFail(quadraticFunding, params);
  });
});
