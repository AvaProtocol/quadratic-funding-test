/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
const { assert } = require('chai');
const _ = require('lodash');

const QuadraticFunding = require('../QuadraticFunding');
const { matchingFund, roundDuration } = require('../constant');
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

describe('Unit Test - schedule_round', async () => {
  const quadraticFunding = new QuadraticFunding();
  let projectIndex = null;
  let currentBlockNumber = null;
  let startBlockNumber = null;

  let maxGrantCountPerRound = 0;

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

    maxGrantCountPerRound = await quadraticFunding.getMaxGrantCountPerRound();
  });

  beforeEach(async () => {
    await cleanRound(quadraticFunding);
    currentBlockNumber = await quadraticFunding.getCurrentBlockNumber();
    startBlockNumber = currentBlockNumber + 1000;
  });

  afterEach(async () => {
    await cleanRound(quadraticFunding);
  });

  it('Input with correct params should pass', async () => {
    const params = {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration,
      matchingFund: 0,
      projectIndexes: [projectIndex],
    };

    await shouldPass(quadraticFunding, params);
  });

  it('Input matchingFund as 0 should pass', async () => {
    const params = {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration,
      matchingFund: 0,
      projectIndexes: [projectIndex],
    };

    await shouldPass(quadraticFunding, params);
  });

  it('Input start > end should fail', async () => {
    const params = {
      start: startBlockNumber + roundDuration + 10,
      end: startBlockNumber + roundDuration,
      matchingFund,
      projectIndexes: [projectIndex],
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Input as < 0 should fail', async () => {
    const params = {
      start: -100,
      end: -1,
      matchingFund: -matchingFund,
      projectIndexes: [projectIndex],
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Input start/end as 0 should fail', async () => {
    const params = {
      start: 0,
      end: 0,
      matchingFund,
      projectIndexes: [projectIndex],
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Input start/end < currentBlockNumber shoud fail', async () => {
    const params = {
      start: currentBlockNumber - 2,
      end: currentBlockNumber - 1,
      matchingFund,
      projectIndexes: [projectIndex],
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Input projectIndexes contains invalid array index should fail', async () => {
    const params = {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration,
      matchingFund,
      projectIndexes: [-1, projectIndex],
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Input projectIndexes contains not exsit project index should fail', async () => {
    const params = {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration,
      matchingFund,
      projectIndexes: [projectIndex + 10],
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Input projectIndexes as empty should fail', async () => {
    const params = {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration,
      matchingFund,
      projectIndexes: [],
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Error case with the length of projects > per round max projects length', async () => {
    const projectIndexes = [projectIndex];
    for (let i = 0; i < maxGrantCountPerRound; i += 1) {
      const { index, error } = await createProject(quadraticFunding, {
        name: 'name',
        logo: 'https://oak.tech/_next/static/images/logo-e546db00eb163fae7f0c56424c3a2586.png',
        description: 'description',
        website: 'https://oak.tech/',
      });
      assert.strictEqual(error, null);
      projectIndexes.push(index);
    }
    const params = {
      start: startBlockNumber + 1000,
      end: startBlockNumber + roundDuration + 1000,
      matchingFund: 0,
      projectIndexes,
    };

    const { error } = await scheduleRound(quadraticFunding, params);
    assert.notEqual(error, null);
  });
});
