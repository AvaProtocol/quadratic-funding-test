/* eslint-disable no-await-in-loop */
/* eslint-disable no-async-promise-executor */
const { assert } = require('chai');
const _ = require('lodash');

const QuadraticFunding = require('../QuadraticFunding');
const { matchingFund, roundDuration } = require('../constant');
const {
  createProject, scheduleRound, cleanRound, cancel, preFund,
} = require('../utils');

const shouldPass = async (quadraticFunding, params) => {
  const { error, info } = await cancel(quadraticFunding, params);
  assert.strictEqual(error, null, 'Cancel should not catch an error');
  assert.strictEqual(_.isMatch(info, params), true, 'Cancel info should contain the params');
};

const shouldFail = async (quadraticFunding, params) => {
  const { error, info } = await cancel(quadraticFunding, params);
  assert.notEqual(error, null, 'Cancel should catch an error');
  assert.strictEqual(_.isEmpty(info), true, 'Cancel info should be empty');
};

describe('Unit Test - cancel', async () => {
  const quadraticFunding = new QuadraticFunding();
  const projectsCount = 2;
  const projectIndexes = [];
  let roundIndex = null;

  before(async () => {
    await quadraticFunding.init();

    await cleanRound(quadraticFunding);

    await preFund(quadraticFunding);

    // Need create some new projects first
    for (let idx = 0; idx < projectsCount; idx += 1) {
      const { index, error } = await createProject(quadraticFunding, {
        name: 'name',
        logo: 'https://oak.tech/_next/static/images/logo-e546db00eb163fae7f0c56424c3a2586.png',
        description: 'description',
        website: 'https://oak.tech/',
      });
      assert.strictEqual(error, null);
      projectIndexes.push(index);
    }

    const currentBlockNumber = await quadraticFunding.getCurrentBlockNumber();
    const startBlockNumber = currentBlockNumber + 10;
    const response = await scheduleRound(quadraticFunding, {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration * 2, // Double roundDuration ensure run all input cases in this round
      matchingFund,
      projectIndexes,
    });
    assert.strictEqual(response.error, null);
    roundIndex = response.index;

    // Wait for this round start
    await quadraticFunding.waitForBlockNumber(startBlockNumber);
  });

  after(async () => {
    await cleanRound(quadraticFunding);
  });

  it('Input with correct params should pass', async () => {
    const params = {
      roundIndex,
      projectIndex: projectIndexes[0],
    };

    await shouldPass(quadraticFunding, params);
  });

  it('Input roundIndex as invalid array index should fail', async () => {
    const params = {
      roundIndex: -1,
      projectIndex: projectIndexes[1],
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Input roundIndex as a not exsit round index should fail', async () => {
    const params = {
      roundIndex: roundIndex + 10,
      projectIndex: projectIndexes[1],
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
      projectIndex: projectIndexes[1] + 10,
    };

    await shouldFail(quadraticFunding, params);
  });
});
