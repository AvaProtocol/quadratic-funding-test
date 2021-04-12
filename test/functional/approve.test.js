/* eslint-disable no-await-in-loop */
/* eslint-disable no-async-promise-executor */
const { assert } = require('chai');
const _ = require('lodash');

const OpenGrant = require('../OpenGrant');
const { matchingFund, roundDuration } = require('../constant');
const {
  createProject, scheduleRound, cleanRound, approve, cancel, finalizeRound,
} = require('../utils');

const shouldPass = async (openGrant, params) => {
  const { error, info } = await approve(openGrant, params);
  assert.strictEqual(error, null, 'approve should not catch an error');
  assert.strictEqual(_.isMatch(info, params), true, 'approve info should contain the params');
};

const shouldFail = async (openGrant, params) => {
  const { error, info } = await approve(openGrant, params);
  assert.notEqual(error, null, 'approve should catch an error');
  assert.strictEqual(_.isEmpty(info), true, 'approve info should be empty');
};

describe('Functional Test - approve', async () => {
  const openGrant = new OpenGrant();
  const projectsCount = 2;
  const projectIndexes = [];
  let roundIndex = null;
  let startBlockNumber = null;
  let endBlockNumber = null;

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

    // Schedule a new round
    const currentBlockNumber = await openGrant.getCurrentBlockNumber();
    startBlockNumber = currentBlockNumber + 20;
    endBlockNumber = startBlockNumber + roundDuration;
    const response = await scheduleRound(openGrant, {
      start: startBlockNumber,
      end: endBlockNumber, // Double roundDuration ensure run all input cases in this round
      matchingFund: 0,
      projectIndexes: [projectIndexes[0]],
    });
    assert.strictEqual(response.error, null);
    roundIndex = response.index;
  });

  after(async () => {
    await cleanRound(openGrant);
  });

  it('Logic with approve a project but this round is not start should fail', async () => {
    const params = {
      roundIndex,
      projectIndex: projectIndexes[0],
    };

    await shouldFail(openGrant, params);
  });

  it('Logic with approve a project but this round is active should fail', async () => {
    // Wait for this round start
    await openGrant.waitForBlockNumber(startBlockNumber);

    const params = {
      roundIndex,
      projectIndex: projectIndexes[0],
    };

    await shouldFail(openGrant, params);
  });

  it('Logic with approve a project in ended round should fail', async () => {
    // Wait for this round end
    await openGrant.waitForBlockNumber(endBlockNumber);

    const params = {
      roundIndex,
      projectIndex: projectIndexes[0],
    };

    await shouldFail(openGrant, params);
  });

  it('Logic with approve a project in finalized round should pass', async () => {
    // Wait for this round finalize
    await finalizeRound(openGrant, { roundIndex });

    const params = {
      roundIndex,
      projectIndex: projectIndexes[0],
    };

    await shouldPass(openGrant, params);
  });

  it('Logic with approve an approved project should fail', async () => {
    const params = {
      roundIndex,
      projectIndex: projectIndexes[0],
    };

    await shouldFail(openGrant, params);
  });

  it('Logic with approve a project but not in this round should fail', async () => {
    const params = {
      roundIndex,
      projectIndex: projectIndexes[1],
    };

    await shouldFail(openGrant, params);
  });

  it('Logic with approve a canceled project should fail', async () => {
    const params = {
      roundIndex,
      projectIndex: projectIndexes[0],
    };

    await cancel(openGrant, params);

    await shouldFail(openGrant, params);
  });
});
