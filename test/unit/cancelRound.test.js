/* eslint-disable no-async-promise-executor */
const { assert } = require('chai');
const _ = require('lodash');

const OpenGrant = require('../OpenGrant');
const { matchingFund, roundDuration } = require('../constant');
const {
  scheduleRound, cleanRound, cancelRound,
} = require('../utils');

const shouldPass = async (openGrant, params) => {
  const { error } = await cancelRound(openGrant, params);
  assert.strictEqual(error, null, 'cancelRound should not catch an error');
};

const shouldFail = async (openGrant, params) => {
  const { error } = await cancelRound(openGrant, params);
  assert.notEqual(error, null, 'cancelRound should catch an error');
};

describe('Unit Test - cancelRound', async () => {
  const openGrant = new OpenGrant();
  let roundIndex = null;

  before(async () => {
    await openGrant.init();

    await cleanRound(openGrant);

    const currentBlockNumber = await openGrant.getCurrentBlockNumber();
    const startBlockNumber = currentBlockNumber + 10;
    const response = await scheduleRound(openGrant, {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration * 2, // Double roundDuration ensure run all input cases in this round
      matchingFund,
      projectIndexes: [],
    });
    assert.strictEqual(response.error, null);
    roundIndex = response.index;
  });

  after(async () => {
    await cleanRound(openGrant);
  });

  it('Input roundIndex as invalid array index should fail', async () => {
    const params = {
      roundIndex: -1,
    };

    await shouldFail(openGrant, params);
  });

  it('Input roundIndex as a not exsit round index should fail', async () => {
    const params = {
      roundIndex: roundIndex + 100,
    };

    await shouldFail(openGrant, params);
  });

  it('Input with correct params should pass', async () => {
    const params = {
      roundIndex,
    };

    await shouldPass(openGrant, params);
  });
});