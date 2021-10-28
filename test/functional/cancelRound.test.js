/* eslint-disable max-len */
const { assert } = require('chai');

const QuadraticFunding = require('../QuadraticFunding');
const { roundDuration, matchingFund } = require('../constant');
const {
  cancelRound, scheduleRound, cleanRound, preFund, createProject,
} = require('../utils');

const shouldPass = async (quadraticFunding, params) => {
  const { error, roundCanceled } = await cancelRound(quadraticFunding, params);
  assert.strictEqual(error, null, 'Cancel round should not catch an error');
  assert.strictEqual(roundCanceled, true, 'Cancel round result should be true');
};

const shouldFail = async (quadraticFunding, params) => {
  const { error, roundCanceled } = await cancelRound(quadraticFunding, params);
  assert.notEqual(error, null, 'Cancel round should catch an error');
  assert.strictEqual(roundCanceled, false, 'Cancel round result should be false');
};

const scheduleNewRound = async (quadraticFunding, projectIndex) => {
  // Schedule a new round
  const currentBlockNumber = await quadraticFunding.getCurrentBlockNumber();
  const startBlockNumber = currentBlockNumber + 10;
  const endBlockNumber = startBlockNumber + roundDuration;
  const response = await scheduleRound(quadraticFunding, {
    start: startBlockNumber,
    end: endBlockNumber,
    matchingFund,
    projectIndexes: [projectIndex],
  });
  assert.strictEqual(response.error, null);

  return { startBlockNumber, endBlockNumber, ...response };
};

describe('Functional Test - cancel_round', async () => {
  let projectIndex = null;
  let roundIndex = null;
  let startBlockNumber = null;
  let endBlockNumber = null;
  const quadraticFunding = new QuadraticFunding();

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
  });

  beforeEach(async () => {
    // Schedule a new round
    const response = await scheduleNewRound(quadraticFunding, projectIndex);
    assert.strictEqual(response.error, null);
    roundIndex = response.index;
    startBlockNumber = response.startBlockNumber;
    endBlockNumber = response.endBlockNumber;
  });

  afterEach(async () => {
    await cleanRound(quadraticFunding);
  });

  it('Logic with cancel scheduled round should pass', async () => {
    await shouldPass(quadraticFunding, { roundIndex });
  });

  it('Logic with cancel an active round should fail', async () => {
    // Wait for this round start
    await quadraticFunding.waitForBlockNumber(startBlockNumber);

    await shouldFail(quadraticFunding, { roundIndex });

    // Wait for this round end
    await quadraticFunding.waitForBlockNumber(endBlockNumber);
  });

  it('Logic with cancel a canceled round should fail', async () => {
    await shouldPass(quadraticFunding, { roundIndex });

    await shouldFail(quadraticFunding, { roundIndex });
  });
});
