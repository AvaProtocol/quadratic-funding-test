/* eslint-disable no-await-in-loop */
/* eslint-disable no-async-promise-executor */
const { assert } = require('chai');
const _ = require('lodash');

const QuadraticFunding = require('../QuadraticFunding');
const {
  matchingFund, roundDuration, value,
} = require('../constant');
const {
  createProject, scheduleRound, cleanRound, approve, contribute, withdraw, finalizeRound, preFund,
} = require('../utils');

const shouldPass = async (quadraticFunding, params) => {
  const { error, info } = await withdraw(quadraticFunding, params);
  assert.strictEqual(error, null, 'Withdraw should not catch an error');
  assert.strictEqual(_.isMatch(info, params), true, 'Withdraw info should contain the params');
};

const shouldFail = async (quadraticFunding, params) => {
  const { error, info } = await withdraw(quadraticFunding, params);
  assert.notEqual(error, null, 'Withdraw should catch an error');
  assert.strictEqual(_.isEmpty(info), true, 'Withdraw info should be empty');
};

describe('Unit Test - withdraw', async () => {
  const quadraticFunding = new QuadraticFunding();
  const projectsCount = 2;
  const projectIndexes = [];
  let roundIndex = null;

  before(async () => {
    await quadraticFunding.init();

    await cleanRound(quadraticFunding);

    await preFund(quadraticFunding);

    // Need create some new projects first
    for (let idx = 0; idx < projectsCount; idx += 1) {
      const { index, error } = await createProject(quadraticFunding, {
        name: 'name',
        logo: 'https://oak.tech/_next/static/images/logo-e546db00eb163fae7f0c56424c3a2586.png',
        description: 'description',
        website: 'https://oak.tech/',
      });
      assert.strictEqual(error, null);
      projectIndexes.push(index);
    }

    const currentBlockNumber = await quadraticFunding.getCurrentBlockNumber();
    const startBlockNumber = currentBlockNumber + 10;
    const endBlockNumber = currentBlockNumber + roundDuration;
    let response = await scheduleRound(quadraticFunding, {
      start: startBlockNumber,
      end: endBlockNumber,
      matchingFund,
      projectIndexes,
    });
    assert.strictEqual(response.error, null);
    roundIndex = response.index;

    // Wait for this round start
    await quadraticFunding.waitForBlockNumber(startBlockNumber);

    // Contribute to all projects
    for (let idx = 0; idx < projectsCount; idx += 1) {
      response = await contribute(quadraticFunding, {
        projectIndex: projectIndexes[idx],
        value,
      });
      assert.strictEqual(response.error, null);
    }

    // Wait for this round end
    await quadraticFunding.waitForBlockNumber(endBlockNumber);

    // Finalize all round
    response = await finalizeRound(quadraticFunding, {
      roundIndex,
    });
    assert.strictEqual(response.response, true);

    // Approve all projects to withdraw
    for (let idx = 0; idx < projectsCount; idx += 1) {
      response = await approve(quadraticFunding, {
        roundIndex,
        projectIndex: projectIndexes[idx],
      });
      assert.strictEqual(response.error, null);
    }
  });

  after(async () => {
    await cleanRound(quadraticFunding);
  });

  it('Input with correct params should pass', async () => {
    const params = {
      roundIndex,
      projectIndex: projectIndexes[0],
    };

    await shouldPass(quadraticFunding, params);
  });

  it('Input roundIndex as invalid array index should fail', async () => {
    const params = {
      roundIndex: -1,
      projectIndex: projectIndexes[1],
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Input roundIndex as a not exsit round index should fail', async () => {
    const params = {
      roundIndex: roundIndex + 10,
      projectIndex: projectIndexes[1],
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Input projectIndex as invalid array index should fail', async () => {
    const params = {
      roundIndex,
      projectIndex: -1,
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Input projectIndex as a not exsit project index should fail', async () => {
    const params = {
      roundIndex,
      projectIndex: projectIndexes[1] + 10,
    };

    await shouldFail(quadraticFunding, params);
  });
});
