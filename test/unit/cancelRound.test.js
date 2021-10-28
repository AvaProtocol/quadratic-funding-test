/* eslint-disable no-async-promise-executor */
const { assert } = require('chai');

const QuadraticFunding = require('../QuadraticFunding');
const { matchingFund, roundDuration } = require('../constant');
const {
  scheduleRound, cleanRound, cancelRound, preFund, createProject,
} = require('../utils');

const shouldPass = async (quadraticFunding, params) => {
  const { error } = await cancelRound(quadraticFunding, params);
  assert.strictEqual(error, null, 'cancelRound should not catch an error');
};

const shouldFail = async (quadraticFunding, params) => {
  const { error } = await cancelRound(quadraticFunding, params);
  assert.notEqual(error, null, 'cancelRound should catch an error');
};

describe('Unit Test - cancelRound', async () => {
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
    const response = await scheduleRound(quadraticFunding, {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration * 2, // Double roundDuration ensure run all input cases in this round
      matchingFund,
      projectIndexes: [projectIndex],
    });
    assert.strictEqual(response.error, null);
    roundIndex = response.index;
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

  it('Input roundIndex as a not exsit round index should fail', async () => {
    const params = {
      roundIndex: roundIndex + 100,
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
