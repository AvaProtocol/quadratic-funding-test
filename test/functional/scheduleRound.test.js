/* eslint-disable max-len */
const { assert } = require('chai');
const _ = require('lodash');

const QuadraticFunding = require('../QuadraticFunding');
const { roundDuration, matchingFund } = require('../constant');
const {
  createProject, scheduleRound, cleanRound, preFund,
} = require('../utils');

const shouldPass = async (quadraticFunding, params) => {
  const previousRoundCount = await quadraticFunding.getGrantRoundCount();

  const { error, info } = await scheduleRound(quadraticFunding, params);
  assert.strictEqual(error, null, 'Schedule round should not catch an error');
  assert.strictEqual(_.isEmpty(info), false, 'Round info should not be empty');

  const roundCount = await quadraticFunding.getGrantRoundCount();
  assert.strictEqual(roundCount, previousRoundCount + 1, 'After pass case, grant round count should increase 1');
};

const shouldFail = async (quadraticFunding, params) => {
  const previousRoundCount = await quadraticFunding.getGrantRoundCount();

  const { error, info } = await scheduleRound(quadraticFunding, params);
  assert.notEqual(error, null, 'Schedule round should catch an error');
  assert.strictEqual(_.isEmpty(info), true, 'Round info should be empty');

  const roundCount = await quadraticFunding.getGrantRoundCount();
  assert.strictEqual(roundCount, previousRoundCount, 'After fail case, grant round count should not change');
};

describe('Functional Test - schedule_round', async () => {
  const quadraticFunding = new QuadraticFunding();
  let projectIndex = null;
  let currentBlockNumber = null;
  let startBlockNumber = null;

  before(async () => {
    await quadraticFunding.init();

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
  });

  beforeEach(async () => {
    await cleanRound(quadraticFunding);
    currentBlockNumber = await quadraticFunding.getCurrentBlockNumber();
    startBlockNumber = currentBlockNumber + 10000;
  });

  afterEach(async () => {
    await cleanRound(quadraticFunding);
  });

  it('Logic with schedule a overlap round should fail', async () => {
    let params = {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration,
      matchingFund,
      projectIndexes: [projectIndex],
    };

    // Schedule round A should pass
    await shouldPass(quadraticFunding, params);

    params = {
      start: startBlockNumber + 1,
      end: startBlockNumber + roundDuration + 1,
      matchingFund,
      projectIndexes: [projectIndex],
    };

    // Schedule round B should fail
    await shouldFail(quadraticFunding, params);
  });

  it('Logic with schedule a non-overlap round should pass', async () => {
    let params = {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration,
      matchingFund,
      projectIndexes: [projectIndex],
    };

    // Schedule round A should pass
    await shouldPass(quadraticFunding, params);

    params = {
      start: startBlockNumber + roundDuration + 1,
      end: startBlockNumber + roundDuration + 1 + roundDuration,
      matchingFund,
      projectIndexes: [projectIndex],
    };

    // Schedule round B should fail
    await shouldPass(quadraticFunding, params);
  });
});
