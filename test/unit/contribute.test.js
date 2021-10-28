/* eslint-disable no-async-promise-executor */
const { assert } = require('chai');
const _ = require('lodash');

const QuadraticFunding = require('../QuadraticFunding');
const {
  matchingFund, roundDuration, value,
} = require('../constant');
const {
  createProject, scheduleRound, contribute, cleanRound, preFund,
} = require('../utils');

const shouldPass = async (quadraticFunding, params) => {
  const { error, info } = await contribute(quadraticFunding, params);
  assert.strictEqual(error, null, 'Contribute should not catch an error');
  assert.strictEqual(_.isMatch(info, params), true, 'Contribute info should contain the params');
};

const shouldFail = async (quadraticFunding, params) => {
  const { error, info } = await contribute(quadraticFunding, params);
  assert.notEqual(error, null, 'Contribute should catch an error');
  assert.strictEqual(_.isEmpty(info), true, 'Contribute info should be empty');
};

describe('Unit Test - contribute', async () => {
  const quadraticFunding = new QuadraticFunding();
  let projectIndex = null;

  before(async () => {
    await quadraticFunding.init();

    await cleanRound(quadraticFunding);

    await preFund(quadraticFunding);

    // Need create project first before schedule round
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

    // Wait for this round start
    await quadraticFunding.waitForBlockNumber(startBlockNumber);
  });

  after(async () => {
    await cleanRound(quadraticFunding);
  });

  it('Input with correct params should pass', async () => {
    const params = {
      projectIndex,
      value,
    };

    await shouldPass(quadraticFunding, params);
  });

  it('Input value as 0 should fail', async () => {
    const params = {
      projectIndex,
      value: 0,
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Input value < 0 should fail', async () => {
    const params = {
      projectIndex,
      value: -100,
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Input projectIndex as invalid array index should fail', async () => {
    const params = {
      projectIndex: -1,
      value,
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Input projectIndex as a not exsit project index should fail', async () => {
    const params = {
      projectIndex: projectIndex + 10,
      value,
    };

    await shouldFail(quadraticFunding, params);
  });
});
