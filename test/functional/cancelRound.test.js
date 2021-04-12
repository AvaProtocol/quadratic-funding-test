/* eslint-disable max-len */
const { assert } = require('chai');

const OpenGrant = require('../OpenGrant');
const { roundDuration, matchingFund } = require('../constant');
const {
  cancelRound, scheduleRound, cleanRound,
} = require('../utils');

const shouldPass = async (openGrant, params) => {
  const previousRoundCount = await openGrant.getGrantRoundCount();

  const { error, roundCanceled } = await cancelRound(openGrant, params);
  assert.strictEqual(error, null, 'Cancel round should not catch an error');
  assert.strictEqual(roundCanceled, true, 'Cancel round result should be true');

  const roundCount = await openGrant.getGrantRoundCount();
  assert.strictEqual(roundCount, previousRoundCount - 1, 'After pass case, grant round count should decrease 1');
};

const shouldFail = async (openGrant, params) => {
  const previousRoundCount = await openGrant.getGrantRoundCount();

  const { error, roundCanceled } = await cancelRound(openGrant, params);
  assert.notEqual(error, null, 'Cancel round should catch an error');
  assert.strictEqual(roundCanceled, false, 'Cancel round result should be false');

  const roundCount = await openGrant.getGrantRoundCount();
  assert.strictEqual(roundCount, previousRoundCount, 'After fail case, grant round count should not change');
};

const scheduleNewRound = async (openGrant) => {
  // Schedule a new round
  const currentBlockNumber = await openGrant.getCurrentBlockNumber();
  const startBlockNumber = currentBlockNumber + 10;
  const endBlockNumber = startBlockNumber + roundDuration * 2;
  const response = await scheduleRound(openGrant, {
    start: startBlockNumber,
    end: endBlockNumber,
    matchingFund,
    projectIndexes: [],
  });
  assert.strictEqual(response.error, null);

  return { startBlockNumber, endBlockNumber };
};

describe('Functional Test - cancel_round', async () => {
  let roundIndex = null;
  const openGrant = new OpenGrant();

  before(async () => {
    await openGrant.init();

    await cleanRound(openGrant);
  });

  beforeEach(async () => {
    // Schedule a new round
    const response = await scheduleNewRound(openGrant);
    assert.strictEqual(response.error, null);
    roundIndex = response.index;
  });

  it('Logic with cancel scheduled round should pass', async () => {
    await shouldPass(openGrant, roundIndex);
  });

  it('Logic with cancel an active round should fail', async () => {
    // Schedule a new round
    const { startBlockNumber, endBlockNumber } = await scheduleNewRound(openGrant);

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
