/* eslint-disable max-len */
const { assert } = require('chai');
const BigNumber = require('bignumber.js');
const _ = require('lodash');

const OpenGrant = require('../OpenGrant');
const { matchingFund, roundDuration } = require('../constant');
const {
  createProject, scheduleRound, cleanRound,
} = require('../utils');

const shouldPass = async (openGrant, params) => {
  const { error, info } = await scheduleRound(openGrant, params);
  assert.strictEqual(error, null, 'Schedule round should not catch an error');
  assert.strictEqual(_.isEmpty(info), false, 'Round info should not be empty');

  const roundCount = await openGrant.getGrantRoundCount();
  assert.strictEqual(roundCount, 1, 'After pass case, grant round count should be 1');
};

const shouldFail = async (openGrant, params) => {
  const { error, info } = await scheduleRound(openGrant, params);
  assert.notEqual(error, null, 'Schedule round should catch an error');
  assert.strictEqual(_.isEmpty(info), true, 'Round info should be empty');

  const roundCount = await openGrant.getGrantRoundCount();
  assert.strictEqual(roundCount, 0, 'After fail case, grant round count should be 0');
};

describe('Method Test - schedule_round', async () => {
  const openGrant = new OpenGrant();
  let projectIndex = null;
  let currentBlockNumber = null;
  let startBlockNumber = null;

  before(async () => {
    await openGrant.init();

    // Need create project first before schedule round
    const { index, error } = await createProject(openGrant, {
      name: 'name',
      logo: 'https://oak.tech/_next/static/images/logo-e546db00eb163fae7f0c56424c3a2586.png',
      description: 'description',
      website: 'https://oak.tech/',
    });
    assert.strictEqual(error, null);
    projectIndex = index;
  });

  beforeEach(async () => {
    await cleanRound(openGrant);
    currentBlockNumber = await openGrant.getCurrentBlockNumber();
    startBlockNumber = currentBlockNumber + 1000;
  });

  afterEach(async () => {
    await cleanRound(openGrant);
  });

  it('Input with correct params should pass', async () => {
    const params = {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration,
      matchingFund,
      projectIndexes: [projectIndex],
    };

    await shouldPass(openGrant, params);
  });

  it('Input matchingFund as 0 should pass', async () => {
    const params = {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration,
      matchingFund: 0,
      projectIndexes: [projectIndex],
    };

    await shouldPass(openGrant, params);
  });

  it('Input start > end should fail', async () => {
    const params = {
      start: startBlockNumber + roundDuration + 10,
      end: startBlockNumber + roundDuration,
      matchingFund,
      projectIndexes: [projectIndex],
    };

    await shouldFail(openGrant, params);
  });

  it('Input as < 0 should fail', async () => {
    const params = {
      start: -100,
      end: -1,
      matchingFund: -matchingFund,
      projectIndexes: [projectIndex],
    };

    await shouldFail(openGrant, params);
  });

  it('Input start/end as 0 should fail', async () => {
    const params = {
      start: 0,
      end: 0,
      matchingFund,
      projectIndexes: [projectIndex],
    };

    await shouldFail(openGrant, params);
  });

  it('Input start/end < currentBlockNumber shoud fail', async () => {
    const params = {
      start: currentBlockNumber - 100 - roundDuration,
      end: currentBlockNumber - 100,
      matchingFund,
      projectIndexes: [projectIndex],
    };

    await shouldFail(openGrant, params);
  });

  it('Input projectIndexes contains invalid array index should fail', async () => {
    const params = {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration,
      matchingFund,
      projectIndexes: [-1, projectIndex],
    };

    await shouldFail(openGrant, params);
  });

  it('Input projectIndexes contains not exsit project index should fail', async () => {
    const params = {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration,
      matchingFund,
      projectIndexes: [projectIndex + 10],
    };

    await shouldFail(openGrant, params);
  });

  it('Input projectIndexes as empty should fail', async () => {
    const params = {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration,
      matchingFund,
      projectIndexes: [],
    };

    await shouldFail(openGrant, params);
  });

  // // TODO: Need get per round max projects length (Storage has no such maxLength filed)
  // it('Error case with the length of projects > per round max projects length', async () => {
  //   const params = {
  //     start: global.blockNumber + 100,
  //     end: global.blockNumber + 100000,
  //     matchingFund: 100,
  //     projectIndexes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  //   };

  //   let error = null;
  //   await scheduleRound(params).catch((err) => {
  //     error = err.message;
  //   });
  //   assert.notEqual(error, null);
  // });

  it('Input as null should fail', async () => {
    const params = {
      start: null,
      end: null,
      matchingFund: null,
      projectIndexes: null,
    };

    await shouldFail(openGrant, params);
  });

  it('Input with string type should fail', async () => {
    const params = {
      start: `${startBlockNumber}`,
      end: `${startBlockNumber + roundDuration}`,
      matchingFund: `${matchingFund}`,
      projectIndexes: `${projectIndex}`,
    };

    await shouldFail(openGrant, params);
  });

  it('Input as empty string should fail', async () => {
    const params = {
      start: '',
      end: '',
      matchingFund: '',
      projectIndexes: '',
    };

    await shouldFail(openGrant, params);
  });

  it('Input with BigNumber type should fail', async () => {
    const params = {
      start: BigNumber(startBlockNumber),
      end: BigNumber(startBlockNumber + roundDuration),
      matchingFund: BigNumber(matchingFund),
      projectIndexes: [BigNumber(projectIndex)],
    };

    await shouldFail(openGrant, params);
  });

  it('Logic with schedule round when there is already another scheduled round should fail', async () => {
    const params = {
      start: startBlockNumber,
      end: startBlockNumber + roundDuration,
      matchingFund,
      projectIndexes: [projectIndex],
    };

    // Schedule round A should pass
    await shouldPass(openGrant, params);

    // Schedule round B should fail
    await shouldFail(openGrant, params);
  });
});
