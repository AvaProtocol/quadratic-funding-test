/* eslint-disable no-async-promise-executor */
const { assert } = require('chai');

const QuadraticFunding = require('../QuadraticFunding');
const {
  matchingFund, roundDuration, value,
} = require('../constant');
const {
  createProject, scheduleRound, cleanRound, contribute, finalizeRound, preFund,
} = require('../utils');

const shouldPass = async (quadraticFunding, params) => {
  const { error, response } = await finalizeRound(quadraticFunding, params);
  assert.strictEqual(error, null, 'finalizeRound should not catch an error');
  assert.strictEqual(response, true, 'finalizeRound response should be true');
};

const shouldFail = async (quadraticFunding, params) => {
  const { error } = await finalizeRound(quadraticFunding, params);
  assert.notEqual(error, null, 'approve should catch an error');
};

describe('Unit Test - finalizeRound', async () => {
  const quadraticFunding = new QuadraticFunding();
  let projectIndex = null;
  let roundIndex = null;

  before(async () => {
    await quadraticFunding.init();

    await cleanRound(quadraticFunding);

    await preFund(quadraticFunding);

    const { index, error } = await createProject(quadraticFunding, {
      name: 'name',
      logo: 'https://oak.tech/_next/static/images/logo-e546db00eb163fae7f0c56424c3a2586.png',
      description: 'description',
      website: 'https://oak.tech/',
    });
    assert.strictEqual(error, null);
    projectIndex = index;

    const currentBlockNumber = await quadraticFunding.getCurrentBlockNumber();
    const startBlockNumber = currentBlockNumber + 10;
    const endBlockNumber = currentBlockNumber + roundDuration;
    let response = await scheduleRound(quadraticFunding, {
      start: startBlockNumber,
      end: endBlockNumber,
      matchingFund,
      projectIndexes: [projectIndex],
    });
    assert.strictEqual(response.error, null);
    roundIndex = response.index;

    // Wait for this round start
    await quadraticFunding.waitForBlockNumber(startBlockNumber);

    response = await contribute(quadraticFunding, {
      projectIndex,
      value,
    });
    assert.strictEqual(response.error, null);

    // Wait for this round end
    await quadraticFunding.waitForBlockNumber(endBlockNumber);
  });

  after(async () => {
    await cleanRound(quadraticFunding);
  });

  it('Input roundIndex as invalid array index should fail', async () => {
    const params = {
      roundIndex: -1,
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Input with correct params should pass', async () => {
    const params = {
      roundIndex,
    };

    await shouldPass(quadraticFunding, params);
  });
});
