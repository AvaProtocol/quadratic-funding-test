/* eslint-disable no-await-in-loop */
/* eslint-disable no-async-promise-executor */
const { assert } = require('chai');
const _ = require('lodash');
const BigNumber = require('bignumber.js');

const OpenGrant = require('../OpenGrant');
const { matchingFund, roundDuration } = require('../constant');
const {
  createProject, scheduleRound, cleanRound, cancel,
} = require('../utils');

const shouldPass = async (openGrant, params) => {
  const { error, info } = await cancel(openGrant, params);
  assert.strictEqual(error, null, 'Cancel should not catch an error');
  assert.strictEqual(_.isMatch(info, params), true, 'Cancel info should contain the params');
};

const shouldFail = async (openGrant, params) => {
  const { error, info } = await cancel(openGrant, params);
  assert.notEqual(error, null, 'Cancel should catch an error');
  assert.strictEqual(_.isEmpty(info), true, 'Cancel info should be empty');
};

describe('Unit Test - cancel', async () => {
  const openGrant = new OpenGrant();
  const projectsCount = 2;
  const projectIndexes = [];
  let roundIndex = null;

  before(async () => {
    await openGrant.init();

    await cleanRound(openGrant);

    // Need create some new projects first
    for (let idx = 0; idx < projectsCount; idx += 1) {
      const { index, error } = await createProject(openGrant, {
        name: 'name',
        logo: 'https://oak.tech/_next/static/images/logo-e546db00eb163fae7f0c56424c3a2586.png',
        description: 'description',
        website: 'https://oak.tech/',
      });
      assert.strictEqual(error, null);
      projectIndexes.push(index);
    }

    const currentBlockNumber = await openGrant.getCurrentBlockNumber();
    const startBlockNumber = currentBlockNumber + 10;
    const response = await scheduleRound(openGrant, {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration * 2, // Double roundDuration ensure run all input cases in this round
      matchingFund,
      projectIndexes,
    });
    assert.strictEqual(response.error, null);
    roundIndex = response.index;

    // Wait for this round start
    await openGrant.waitForBlockNumber(startBlockNumber);
  });

  after(async () => {
    await cleanRound(openGrant);
  });

  it('Input with correct params should pass', async () => {
    const params = {
      roundIndex,
      projectIndex: projectIndexes[0],
    };

    await shouldPass(openGrant, params);
  });

  it('Input roundIndex as invalid array index should fail', async () => {
    const params = {
      roundIndex: -1,
      projectIndex: projectIndexes[1],
    };

    await shouldFail(openGrant, params);
  });

  it('Input roundIndex as a not exsit round index should fail', async () => {
    const params = {
      roundIndex: roundIndex + 10,
      projectIndex: projectIndexes[1],
    };

    await shouldFail(openGrant, params);
  });

  it('Input projectIndex as invalid array index should fail', async () => {
    const params = {
      roundIndex,
      projectIndex: -1,
    };

    await shouldFail(openGrant, params);
  });

  it('Input projectIndex as a not exsit project index should fail', async () => {
    const params = {
      roundIndex,
      projectIndex: projectIndexes[1] + 10,
    };

    await shouldFail(openGrant, params);
  });
});
