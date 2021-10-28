/* eslint-disable no-await-in-loop */
/* eslint-disable no-async-promise-executor */
const { assert } = require('chai');
const _ = require('lodash');

const QuadraticFunding = require('../QuadraticFunding');
const { roundDuration } = require('../constant');
const {
  createProject, scheduleRound, cleanRound, approve, cancel, finalizeRound, preFund,
} = require('../utils');

const shouldPass = async (quadraticFunding, params) => {
  const { error, info } = await approve(quadraticFunding, params);
  assert.strictEqual(error, null, 'approve should not catch an error');
  assert.strictEqual(_.isMatch(info, params), true, 'approve info should contain the params');
};

const shouldFail = async (quadraticFunding, params) => {
  const { error, info } = await approve(quadraticFunding, params);
  assert.notEqual(error, null, 'approve should catch an error');
  assert.strictEqual(_.isEmpty(info), true, 'approve info should be empty');
};

describe('Functional Test - approve', async () => {
  const quadraticFunding = new QuadraticFunding();
  const projectsCount = 2;
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
    endBlockNumber = startBlockNumber + roundDuration;
    const response = await scheduleRound(quadraticFunding, {
      start: startBlockNumber,
      end: endBlockNumber, // Double roundDuration ensure run all input cases in this round
      matchingFund: 0,
      projectIndexes: [projectIndexes[0]],
    });
    assert.strictEqual(response.error, null);
    roundIndex = response.index;
  });

  after(async () => {
    await cleanRound(quadraticFunding);
  });

  it('Logic with approve a project but this round is not start should fail', async () => {
    const params = {
      roundIndex,
      projectIndex: projectIndexes[0],
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Logic with approve a project but this round is active should fail', async () => {
    // Wait for this round start
    await quadraticFunding.waitForBlockNumber(startBlockNumber);

    const params = {
      roundIndex,
      projectIndex: projectIndexes[0],
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Logic with approve a project in ended round should fail', async () => {
    // Wait for this round end
    await quadraticFunding.waitForBlockNumber(endBlockNumber);

    const params = {
      roundIndex,
      projectIndex: projectIndexes[0],
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Logic with approve a project in finalized round should pass', async () => {
    // Wait for this round finalize
    await finalizeRound(quadraticFunding, { roundIndex });

    const params = {
      roundIndex,
      projectIndex: projectIndexes[0],
    };

    await shouldPass(quadraticFunding, params);
  });

  it('Logic with approve an approved project should fail', async () => {
    const params = {
      roundIndex,
      projectIndex: projectIndexes[0],
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Logic with approve a project but not in this round should fail', async () => {
    const params = {
      roundIndex,
      projectIndex: projectIndexes[1],
    };

    await shouldFail(quadraticFunding, params);
  });

  it('Logic with approve a canceled project should fail', async () => {
    const params = {
      roundIndex,
      projectIndex: projectIndexes[0],
    };

    await cancel(quadraticFunding, params);

    await shouldFail(quadraticFunding, params);
  });
});
