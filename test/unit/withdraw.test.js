/* eslint-disable no-await-in-loop */
/* eslint-disable no-async-promise-executor */
const { assert } = require('chai');
const _ = require('lodash');

const OpenGrant = require('../OpenGrant');
const {
  matchingFund, roundDuration, value,
} = require('../constant');
const {
  createProject, scheduleRound, cleanRound, approve, contribute, withdraw, finalizeRound, preFund,
} = require('../utils');

const shouldPass = async (openGrant, params) => {
  const { error, info } = await withdraw(openGrant, params);
  assert.strictEqual(error, null, 'Withdraw should not catch an error');
  assert.strictEqual(_.isMatch(info, params), true, 'Withdraw info should contain the params');
};

const shouldFail = async (openGrant, params) => {
  const { error, info } = await withdraw(openGrant, params);
  assert.notEqual(error, null, 'Withdraw should catch an error');
  assert.strictEqual(_.isEmpty(info), true, 'Withdraw info should be empty');
};

describe('Unit Test - withdraw', async () => {
  const openGrant = new OpenGrant();
  const projectsCount = 2;
  const projectIndexes = [];
  let roundIndex = null;

  before(async () => {
    await openGrant.init();

    await cleanRound(openGrant);

    await preFund(openGrant);

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
    const endBlockNumber = currentBlockNumber + roundDuration;
    let response = await scheduleRound(openGrant, {
      start: startBlockNumber,
      end: endBlockNumber,
      matchingFund,
      projectIndexes,
    });
    assert.strictEqual(response.error, null);
    roundIndex = response.index;

    // Wait for this round start
    await openGrant.waitForBlockNumber(startBlockNumber);

    // Contribute to all projects
    for (let idx = 0; idx < projectsCount; idx += 1) {
      response = await contribute(openGrant, {
        projectIndex: projectIndexes[idx],
        value,
      });
      assert.strictEqual(response.error, null);
    }

    // Wait for this round end
    await openGrant.waitForBlockNumber(endBlockNumber);

    // Finalize all round
    response = await finalizeRound(openGrant, {
      roundIndex,
    });
    assert.strictEqual(response.response, true);

    // Approve all projects to withdraw
    for (let idx = 0; idx < projectsCount; idx += 1) {
      response = await approve(openGrant, {
        roundIndex,
        projectIndex: projectIndexes[idx],
      });
      assert.strictEqual(response.error, null);
    }
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
