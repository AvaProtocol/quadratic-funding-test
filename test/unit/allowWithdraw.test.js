/* eslint-disable no-async-promise-executor */
const { assert } = require('chai');
const _ = require('lodash');
const BigNumber = require('bignumber.js');

const OpenGrant = require('../OpenGrant');
const { matchingFund, roundDuration, value } = require('../constant');
const {
  createProject, scheduleRound, cleanRound, allowWithdraw, contribute,
} = require('../utils');

const shouldPass = async (openGrant, params) => {
  const { error, info } = await allowWithdraw(openGrant, params);
  assert.strictEqual(error, null, 'AllowWithdraw should not catch an error');
  assert.strictEqual(_.isMatch(info, params), true, 'AllowWithdraw info should contain the params');
};

const shouldFail = async (openGrant, params) => {
  const { error, info } = await allowWithdraw(openGrant, params);
  assert.notEqual(error, null, 'AllowWithdraw should catch an error');
  assert.strictEqual(_.isEmpty(info), true, 'AllowWithdraw info should be empty');
};

describe('Unit Test - allowWithdraw', async () => {
  const openGrant = new OpenGrant();
  let projectIndex = null;
  let roundIndex = null;

  before(async () => {
    await openGrant.init();

    await cleanRound(openGrant);

    const { index, error } = await createProject(openGrant, {
      name: 'name',
      logo: 'https://oak.tech/_next/static/images/logo-e546db00eb163fae7f0c56424c3a2586.png',
      description: 'description',
      website: 'https://oak.tech/',
    });
    assert.strictEqual(error, null);
    projectIndex = index;

    const currentBlockNumber = await openGrant.getCurrentBlockNumber();
    const startBlockNumber = currentBlockNumber + 10;
    const endBlockNumber = currentBlockNumber + roundDuration;
    let response = await scheduleRound(openGrant, {
      start: startBlockNumber,
      end: endBlockNumber,
      matchingFund,
      projectIndexes: [projectIndex],
    });
    assert.strictEqual(response.error, null);
    roundIndex = response.index;

    // Wait for this round start
    await openGrant.waitForBlockNumber(startBlockNumber);

    response = await contribute(openGrant, {
      projectIndex,
      value,
    });
    assert.strictEqual(response.error, null);

    // Wait for this round end
    await openGrant.waitForBlockNumber(endBlockNumber);
  });

  after(async () => {
    await cleanRound(openGrant);
  });

  it('Input with correct params should pass', async () => {
    const params = {
      roundIndex,
      projectIndex,
    };

    await shouldPass(openGrant, params);
  });

  it('Input roundIndex as invalid array index should fail', async () => {
    const params = {
      roundIndex: -1,
      projectIndex,
    };

    await shouldFail(openGrant, params);
  });

  it('Input roundIndex as a not exsit round index should fail', async () => {
    const params = {
      roundIndex: roundIndex + 10,
      projectIndex,
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
      projectIndex: projectIndex + 10,
    };

    await shouldFail(openGrant, params);
  });
});
