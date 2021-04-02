/* eslint-disable no-await-in-loop */
const { assert } = require('chai');
const _ = require('lodash');

const OpenGrant = require('../OpenGrant');
const { matchingFund, roundDuration, value } = require('../constant');
const {
  createProject, scheduleRound, contribute, cleanRound, cancel,
} = require('../utils');

const shouldPass = async (openGrant, params) => {
  const { error, info } = await contribute(openGrant, params);
  assert.strictEqual(error, null, 'Contribute should not catch an error');
  assert.strictEqual(_.isMatch(info, params), true, 'Contribute info should contain the params');
};

const shouldFail = async (openGrant, params) => {
  const { error, info } = await contribute(openGrant, params);
  assert.notEqual(error, null, 'Contribute should catch an error');
  assert.strictEqual(_.isEmpty(info), true, 'Contribute info should be empty');
};

describe('Functional Test - contribute', async () => {
  const openGrant = new OpenGrant();
  const projectsCount = 3;
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

    // Schedule a new round
    const currentBlockNumber = await openGrant.getCurrentBlockNumber();
    const startBlockNumber = currentBlockNumber + 10;
    const response = await scheduleRound(openGrant, {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration,
      matchingFund,
      projectIndexes: [projectIndexes[0], projectIndexes[1]],
    });
    assert.strictEqual(response.error, null);
    roundIndex = response.index;

    // Wait for this round start
    await openGrant.waitForBlockNumber(startBlockNumber);
  });

  after(async () => {
    await cleanRound(openGrant);
  });

  it('Logic with multiple contribute to the same project should pass', async () => {
    const params = {
      projectIndex: projectIndexes[0],
      value,
    };

    // First contribute
    await shouldPass(openGrant, params);

    // Second contribute
    await shouldPass(openGrant, params);
  });

  it('Logic with multiple contribute to the different projects should pass', async () => {
    // First contribute
    await shouldPass(openGrant, {
      projectIndex: projectIndexes[0],
      value,
    });

    // Second contribute
    await shouldPass(openGrant, {
      projectIndex: projectIndexes[1],
      value,
    });
  });

  it('Logic with contribute a project but not in this round should fail', async () => {
    const params = {
      projectIndex: projectIndexes[2],
      value,
    };

    await shouldFail(openGrant, params);
  });

  it('Logic with contribute a canceled project should fail', async () => {
    await cancel(openGrant, { roundIndex, projectIndex: projectIndexes[0] });

    const params = {
      projectIndex: projectIndexes[0],
      value,
    };

    await shouldFail(openGrant, params);
  });
});
