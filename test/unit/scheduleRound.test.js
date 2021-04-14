/* eslint-disable max-len */
const { assert } = require('chai');
const _ = require('lodash');

const OpenGrant = require('../OpenGrant');
const { matchingFund, roundDuration } = require('../constant');
const {
  createProject, scheduleRound, cleanRound, checkAndFund,
} = require('../utils');

const shouldPass = async (openGrant, params) => {
  const previousRoundCount = await openGrant.getGrantRoundCount();

  const { error, info } = await scheduleRound(openGrant, params);
  assert.strictEqual(error, null, 'Schedule round should not catch an error');
  assert.strictEqual(_.isEmpty(info), false, 'Round info should not be empty');

  const roundCount = await openGrant.getGrantRoundCount();
  assert.strictEqual(roundCount, previousRoundCount + 1, 'After pass case, grant round count should increase 1');
};

const shouldFail = async (openGrant, params) => {
  const previousRoundCount = await openGrant.getGrantRoundCount();

  const { error, info } = await scheduleRound(openGrant, params);
  assert.notEqual(error, null, 'Schedule round should catch an error');
  assert.strictEqual(_.isEmpty(info), true, 'Round info should be empty');

  const roundCount = await openGrant.getGrantRoundCount();
  assert.strictEqual(roundCount, previousRoundCount, 'After fail case, grant round count should not change');
};

describe('Unit Test - schedule_round', async () => {
  const openGrant = new OpenGrant();
  let projectIndex = null;
  let currentBlockNumber = null;
  let startBlockNumber = null;

  let maxRoundGrants = 0;

  before(async () => {
    await openGrant.init();

    await checkAndFund(openGrant);

    // Need create project first before schedule round
    const { index, error } = await createProject(openGrant, {
      name: 'name',
      logo: 'https://oak.tech/_next/static/images/logo-e546db00eb163fae7f0c56424c3a2586.png',
      description: 'description',
      website: 'https://oak.tech/',
    });
    assert.strictEqual(error, null);
    projectIndex = index;

    maxRoundGrants = await openGrant.getMaxRoundGrants();
  });

  beforeEach(async () => {
    await cleanRound(openGrant);
    currentBlockNumber = await openGrant.getCurrentBlockNumber();
    startBlockNumber = currentBlockNumber + 1000;
  });

  afterEach(async () => {
    await cleanRound(openGrant);
  });

  it('Input with correct params should pass', async () => {
    const params = {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration,
      matchingFund: 0,
      projectIndexes: [projectIndex],
    };

    await shouldPass(openGrant, params);
  });

  it('Input matchingFund as 0 should pass', async () => {
    const params = {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration,
      matchingFund: 0,
      projectIndexes: [projectIndex],
    };

    await shouldPass(openGrant, params);
  });

  it('Input start > end should fail', async () => {
    const params = {
      start: startBlockNumber + roundDuration + 10,
      end: startBlockNumber + roundDuration,
      matchingFund,
      projectIndexes: [projectIndex],
    };

    await shouldFail(openGrant, params);
  });

  it('Input as < 0 should fail', async () => {
    const params = {
      start: -100,
      end: -1,
      matchingFund: -matchingFund,
      projectIndexes: [projectIndex],
    };

    await shouldFail(openGrant, params);
  });

  it('Input start/end as 0 should fail', async () => {
    const params = {
      start: 0,
      end: 0,
      matchingFund,
      projectIndexes: [projectIndex],
    };

    await shouldFail(openGrant, params);
  });

  it('Input start/end < currentBlockNumber shoud fail', async () => {
    const params = {
      start: currentBlockNumber - 1 - roundDuration,
      end: currentBlockNumber - 1,
      matchingFund,
      projectIndexes: [projectIndex],
    };

    await shouldFail(openGrant, params);
  });

  it('Input projectIndexes contains invalid array index should fail', async () => {
    const params = {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration,
      matchingFund,
      projectIndexes: [-1, projectIndex],
    };

    await shouldFail(openGrant, params);
  });

  it('Input projectIndexes contains not exsit project index should fail', async () => {
    const params = {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration,
      matchingFund,
      projectIndexes: [projectIndex + 10],
    };

    await shouldFail(openGrant, params);
  });

  it('Input projectIndexes as empty should fail', async () => {
    const params = {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration,
      matchingFund,
      projectIndexes: [],
    };

    await shouldFail(openGrant, params);
  });

  it('Error case with the length of projects > per round max projects length', async () => {
    const projectIndexes = [];
    for (let i = 0; i < maxRoundGrants + 10; i += 1) {
      projectIndexes.push(i);
    }
    const params = {
      start: global.blockNumber + 100,
      end: global.blockNumber + 100000,
      matchingFund: 100,
      projectIndexes,
    };

    let error = null;
    await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });
});
