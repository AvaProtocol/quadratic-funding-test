/* eslint-disable no-await-in-loop */
/* eslint-disable no-async-promise-executor */
const { assert } = require('chai');
const _ = require('lodash');

const QuadraticFunding = require('../QuadraticFunding');
const { matchingFund, roundDuration } = require('../constant');
const {
  createProject, scheduleRound, cleanRound, approve, withdraw, cancel, preFund, finalizeRound,
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

describe('Functional Test - withdraw', async () => {
  const quadraticFunding = new QuadraticFunding();
  const projectsCount = 3;
  const projectIndexes = [];
  let roundIndex = null;
  let startBlockNumber = null;
  let endBlockNumber = null;

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

    // Schedule a new round
    const currentBlockNumber = await quadraticFunding.getCurrentBlockNumber();
    startBlockNumber = currentBlockNumber + 20;
    endBlockNumber = startBlockNumber + roundDuration * 2;
    const response = await scheduleRound(quadraticFunding, {
      start: startBlockNumber,
      end: endBlockNumber,
      matchingFund,
      projectIndexes: [projectIndexes[0], projectIndexes[1]],
    });
    assert.strictEqual(response.error, null);
    roundIndex = response.index;
  });

  after(async () => {
    await cleanRound(quadraticFunding);
  });

  it('Logic with withdraw a project but round is not start should fail', async () => {
    const params = {
      roundIndex,
      projectIndex: projectIndexes[0],
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Logic with withdraw a project but round is active should fail', async () => {
    // Wait for this round start
    await quadraticFunding.waitForBlockNumber(startBlockNumber);

    const params = {
      roundIndex,
      projectIndex: projectIndexes[0],
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Logic with withdraw a project but not in this round should fail', async () => {
    // Wait for this round end
    await quadraticFunding.waitForBlockNumber(endBlockNumber);

    // Wait for this round finalized
    await finalizeRound(quadraticFunding, { roundIndex });

    const params = {
      roundIndex,
      projectIndex: projectIndexes[2],
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Logic with withdraw a project but project is not allowed withdraw should fail', async () => {
    const params = {
      roundIndex,
      projectIndex: projectIndexes[0],
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Logic with withdraw a project but project is canceled should fail', async () => {
    const params = {
      roundIndex,
      projectIndex: projectIndexes[0],
    };

    await cancel(quadraticFunding, params);

    await shouldFail(quadraticFunding, params);
  });

  it('Logic with withdraw an allowed withdraw project should pass', async () => {
    const params = {
      roundIndex,
      projectIndex: projectIndexes[1],
    };

    await approve(quadraticFunding, params);

    await shouldPass(quadraticFunding, params);
  });

  it('Logic with withdraw a withdrawn project should fail', async () => {
    const params = {
      roundIndex,
      projectIndex: projectIndexes[1],
    };

    await shouldFail(quadraticFunding, params);
  });
});
