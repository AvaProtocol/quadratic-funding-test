/* eslint-disable no-await-in-loop */
/* eslint-disable no-async-promise-executor */
const { assert } = require('chai');
const _ = require('lodash');

const OpenGrant = require('../OpenGrant');
const { roundDuration } = require('../constant');
const {
  scheduleRound, cleanRound, finalizeRound,
} = require('../utils');

const shouldPass = async (openGrant, params) => {
  const { error } = await finalizeRound(openGrant, params);
  assert.strictEqual(error, null, 'finalizeRound should not catch an error');
};

const shouldFail = async (openGrant, params) => {
  const { error } = await finalizeRound(openGrant, params);
  assert.notEqual(error, null, 'finalizeRound should catch an error');
};

describe('Functional Test - finalizeRound', async () => {
  const openGrant = new OpenGrant();
  let roundIndex = null;
  let startBlockNumber = null;
  let endBlockNumber = null;

  before(async () => {
    await openGrant.init();

    await cleanRound(openGrant);

    // Schedule a new round
    const currentBlockNumber = await openGrant.getCurrentBlockNumber();
    startBlockNumber = currentBlockNumber + 20;
    endBlockNumber = startBlockNumber + roundDuration;
    const response = await scheduleRound(openGrant, {
      start: startBlockNumber,
      end: endBlockNumber, // Double roundDuration ensure run all input cases in this round
      matchingFund: 0,
      projectIndexes: [],
    });
    assert.strictEqual(response.error, null);
    roundIndex = response.index;
  });

  after(async () => {
    await cleanRound(openGrant);
  });

  it('Logic with finalize a round but this round is not start should fail', async () => {
    const params = {
      roundIndex,
    };

    await shouldFail(openGrant, params);
  });

  it('Logic with finalize a round but this round is active should fail', async () => {
    // Wait for this round start
    await openGrant.waitForBlockNumber(startBlockNumber);

    const params = {
      roundIndex,
    };

    await shouldFail(openGrant, params);
  });

  it('Logic with finalize a round in ended round should pass', async () => {
    // Wait for this round end
    await openGrant.waitForBlockNumber(endBlockNumber);

    const params = {
      roundIndex,
    };

    await shouldPass(openGrant, params);
  });
});
