/* eslint-disable no-async-promise-executor */
const { assert } = require('chai');
const _ = require('lodash');

const QuadraticFunding = require('../QuadraticFunding');
const {
  matchingFund, roundDuration, value,
} = require('../constant');
const {
  createProject, scheduleRound, cleanRound, approve, contribute, finalizeRound, preFund,
} = require('../utils');

const shouldPass = async (quadraticFunding, params) => {
  const { error, info } = await approve(quadraticFunding, params);
  assert.strictEqual(error, null, 'approve should not catch an error');
  assert.strictEqual(_.isMatch(info, params), true, 'approve info should contain the params');
};

const shouldFail = async (quadraticFunding, params) => {
  const { error, info } = await approve(quadraticFunding, params);
  assert.notEqual(error, null, 'approve should catch an error');
  assert.strictEqual(_.isEmpty(info), true, 'approve info should be empty');
};

describe('Unit Test - approve', async () => {
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

    // finalize round
    await finalizeRound(quadraticFunding, { roundIndex });
  });

  after(async () => {
    await cleanRound(quadraticFunding);
  });

  it('Input with correct params should pass', async () => {
    const params = {
      roundIndex,
      projectIndex,
    };

    await shouldPass(quadraticFunding, params);
  });

  it('Input roundIndex as invalid array index should fail', async () => {
    const params = {
      roundIndex: -1,
      projectIndex,
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Input roundIndex as a not exsit round index should fail', async () => {
    const params = {
      roundIndex: roundIndex + 10,
      projectIndex,
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Input projectIndex as invalid array index should fail', async () => {
    const params = {
      roundIndex,
      projectIndex: -1,
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Input projectIndex as a not exsit project index should fail', async () => {
    const params = {
      roundIndex,
      projectIndex: projectIndex + 10,
    };

    await shouldFail(quadraticFunding, params);
  });
});
