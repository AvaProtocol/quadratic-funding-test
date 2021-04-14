/* eslint-disable no-async-promise-executor */
const { assert } = require('chai');

const OpenGrant = require('../OpenGrant');
const {
  matchingFund, roundDuration, value,
} = require('../constant');
const {
  createProject, scheduleRound, cleanRound, contribute, finalizeRound, checkAndFund,
} = require('../utils');

const shouldPass = async (openGrant, params) => {
  const { error, response } = await finalizeRound(openGrant, params);
  assert.strictEqual(error, null, 'finalizeRound should not catch an error');
  assert.strictEqual(response, true, 'finalizeRound response should be true');
};

const shouldFail = async (openGrant, params) => {
  const { error } = await finalizeRound(openGrant, params);
  assert.notEqual(error, null, 'approve should catch an error');
};

describe('Unit Test - finalizeRound', async () => {
  const openGrant = new OpenGrant();
  let projectIndex = null;
  let roundIndex = null;

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

  it('Input roundIndex as invalid array index should fail', async () => {
    const params = {
      roundIndex: -1,
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
