/* eslint-disable max-len */
const { assert } = require('chai');

const OpenGrant = require('../OpenGrant');
const { roundDuration, matchingFund } = require('../constant');
const {
  cancelRound, scheduleRound, cleanRound, checkAndFund, createProject,
} = require('../utils');

const shouldPass = async (openGrant, params) => {
  const { error, roundCanceled } = await cancelRound(openGrant, params);
  assert.strictEqual(error, null, 'Cancel round should not catch an error');
  assert.strictEqual(roundCanceled, true, 'Cancel round result should be true');
};

const shouldFail = async (openGrant, params) => {
  const { error, roundCanceled } = await cancelRound(openGrant, params);
  assert.notEqual(error, null, 'Cancel round should catch an error');
  assert.strictEqual(roundCanceled, false, 'Cancel round result should be false');
};

const scheduleNewRound = async (openGrant, projectIndex) => {
  // Schedule a new round
  const currentBlockNumber = await openGrant.getCurrentBlockNumber();
  const startBlockNumber = currentBlockNumber + 10;
  const endBlockNumber = startBlockNumber + roundDuration * 2;
  const response = await scheduleRound(openGrant, {
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
  const openGrant = new OpenGrant();

  before(async () => {
    await openGrant.init();

    await cleanRound(openGrant);

    await checkAndFund(openGrant);

    const { index, error } = await createProject(openGrant, {
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
    const response = await scheduleNewRound(openGrant, projectIndex);
    assert.strictEqual(response.error, null);
    roundIndex = response.index;
    startBlockNumber = response.startBlockNumber;
    endBlockNumber = response.endBlockNumber;
  });

  it('Logic with cancel scheduled round should pass', async () => {
    await shouldPass(openGrant, roundIndex);
  });

  it('Logic with cancel an active round should fail', async () => {
    // Wait for this round start
    await openGrant.waitForBlockNumber(startBlockNumber);

    await shouldFail(openGrant);

    // Wait for this round end
    await openGrant.waitForBlockNumber(endBlockNumber);
  });

  it('Logic with cancel round but there are no more scheduled round should fail', async () => {
    await shouldFail(openGrant);
  });
});
