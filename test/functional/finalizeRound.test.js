/* eslint-disable no-await-in-loop */
/* eslint-disable no-async-promise-executor */
const { assert } = require('chai');
const _ = require('lodash');

const QuadraticFunding = require('../QuadraticFunding');
const { roundDuration } = require('../constant');
const {
  scheduleRound, cleanRound, finalizeRound, preFund, createProject,
} = require('../utils');

const shouldPass = async (quadraticFunding, params) => {
  const { error } = await finalizeRound(quadraticFunding, params);
  assert.strictEqual(error, null, 'finalizeRound should not catch an error');
};

const shouldFail = async (quadraticFunding, params) => {
  const { error } = await finalizeRound(quadraticFunding, params);
  assert.notEqual(error, null, 'finalizeRound should catch an error');
};

describe('Functional Test - finalizeRound', async () => {
  const quadraticFunding = new QuadraticFunding();
  let projectIndex = null;
  let roundIndex = null;
  let startBlockNumber = null;
  let endBlockNumber = null;

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

    // Schedule a new round
    const currentBlockNumber = await quadraticFunding.getCurrentBlockNumber();
    startBlockNumber = currentBlockNumber + 20;
    endBlockNumber = startBlockNumber + roundDuration;
    const response = await scheduleRound(quadraticFunding, {
      start: startBlockNumber,
      end: endBlockNumber, // Double roundDuration ensure run all input cases in this round
      matchingFund: 0,
      projectIndexes: [projectIndex],
    });
    assert.strictEqual(response.error, null);
    roundIndex = response.index;
  });

  after(async () => {
    await cleanRound(quadraticFunding);
  });

  it('Logic with finalize a round but this round is not start should fail', async () => {
    const params = {
      roundIndex,
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Logic with finalize a round but this round is active should fail', async () => {
    // Wait for this round start
    await quadraticFunding.waitForBlockNumber(startBlockNumber);

    const params = {
      roundIndex,
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Logic with finalize a round in ended round should pass', async () => {
    // Wait for this round end
    await quadraticFunding.waitForBlockNumber(endBlockNumber);

    const params = {
      roundIndex,
    };

    await shouldPass(quadraticFunding, params);
  });
});
