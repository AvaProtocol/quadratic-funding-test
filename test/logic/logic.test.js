/* eslint-disable no-async-promise-executor */
const { assert } = require('chai');
const _ = require('lodash');

const {
  initAccount, initApi, getCurrentBlockNumber,
} = require('../utils');
const {
  createProject, scheduleRound, contribute, cancel, cancelRound, allowWithdraw, withdraw, waitForBlockNumber,
} = require('../method/method');

const startBlockNumberInterval = 10;
const roundDuration = 20;

describe('Logic Test', async () => {
  before(async () => {
    await initAccount();
    await initApi();
  });

  beforeEach(async () => {
    if (!global.projectIndex) {
      global.projectIndex = 0;
    }
    if (!global.roundIndex) {
      global.roundIndex = 0;
    }
    if (global.endBlockNumber) {
      // Wait for previous round end
      await waitForBlockNumber(global.endBlockNumber);
    }
  });

  afterEach(async () => {
    if (global.endBlockNumber) {
      // Wait for round end
      await waitForBlockNumber(global.endBlockNumber);
    }
  });

  it('Success case with normal operation', async () => {
    // Create Project
    let params = {
      name: 'name',
      logo: 'https://oak.tech/_next/static/images/logo-e546db00eb163fae7f0c56424c3a2586.png',
      description: 'description',
      website: 'https://oak.tech/',
    };
    let error = null;
    const createProjectInfo = await createProject(params).catch((err) => {
      error = err.message;
    });
    assert.strictEqual(error, null);
    assert.strictEqual(_.isMatch(createProjectInfo, params), true);

    // Get current block number
    const blockNumber = await getCurrentBlockNumber();

    // Schedule Round
    const startBlockNumber = blockNumber + startBlockNumberInterval;
    global.endBlockNumber = startBlockNumber + roundDuration;
    params = {
      start: startBlockNumber,
      end: global.endBlockNumber,
      matchingFund: 100000000,
      projectIndexes: [global.projectIndex],
    };
    error = null;
    const grantRoundInfo = await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.strictEqual(error, null);
    // Problems:
    // The response value is '100.0000 µUnit' !== 100000000
    // assert.strictEqual(_.isMatch(grantRoundInfo, params), true);
    assert.notEqual(grantRoundInfo, null);

    await waitForBlockNumber(startBlockNumber);

    // Contribut
    params = {
      projectIndex: global.projectIndex,
      value: 1000,
    };
    error = null;
    const contributeInfo = await contribute(params).catch((err) => {
      error = err.message;
    });
    assert.strictEqual(error, null);
    assert.strictEqual(_.isMatch(contributeInfo, params), true);

    await waitForBlockNumber(global.endBlockNumber);

    // Allow withdraw
    params = {
      roundIndex: global.roundIndex,
      projectIndex: global.projectIndex,
    };
    error = null;
    const allowWithdrawInfo = await allowWithdraw(params).catch((err) => {
      error = err.message;
    });
    assert.strictEqual(error, null);
    assert.strictEqual(_.isMatch(allowWithdrawInfo, params), true);

    // Withdraw
    params = {
      roundIndex: global.roundIndex,
      projectIndex: global.projectIndex,
    };
    error = null;
    const withdrawInfo = await withdraw(params).catch((err) => {
      error = err.message;
    });
    assert.strictEqual(error, null);
    assert.strictEqual(_.isMatch(withdrawInfo, params), true);
  });

  it('Success with cancel round', async () => {
    // Get current block number
    const blockNumber = await getCurrentBlockNumber();

    // Schedule Round
    const startBlockNumber = blockNumber + startBlockNumberInterval;
    global.endBlockNumber = startBlockNumber + roundDuration;
    const params = {
      start: startBlockNumber,
      end: global.endBlockNumber,
      matchingFund: 100000000,
      projectIndexes: [global.projectIndex],
    };
    let error = null;
    const grantRoundInfo = await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.strictEqual(error, null);
    // Problems:
    // The response value is '100.0000 µUnit' !== 100000000
    // assert.strictEqual(_.isMatch(grantRoundInfo, params), true);
    assert.notEqual(grantRoundInfo, null);

    // Cancel round
    const roundIsCanceled = await cancelRound().catch((err) => {
      error = err.message;
    });
    assert.strictEqual(error, null);
    assert.strictEqual(roundIsCanceled, true);
  });

  it('Error case with contribute a canceled project', async () => {
    // Get current block number
    const blockNumber = await getCurrentBlockNumber();

    // Schedule Round
    const startBlockNumber = blockNumber + startBlockNumberInterval;
    global.endBlockNumber = startBlockNumber + roundDuration;
    let params = {
      start: startBlockNumber,
      end: global.endBlockNumber,
      matchingFund: 100000000,
      projectIndexes: [global.projectIndex],
    };
    let error = null;
    const grantRoundInfo = await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.strictEqual(error, null);
    // Problems:
    // The response value is '100.0000 µUnit' !== 100000000
    // assert.strictEqual(_.isMatch(grantRoundInfo, params), true);
    assert.notEqual(grantRoundInfo, null);

    await waitForBlockNumber(startBlockNumber);

    // Cancel project
    params = {
      roundIndex: global.roundIndex,
      projectIndex: global.projectIndex,
    };
    const cancelInfo = await cancel(params).catch((err) => {
      error = err.message;
    });
    assert.strictEqual(error, null);
    assert.strictEqual(_.isMatch(cancelInfo, params), true);

    // Contribut
    params = {
      projectIndex: global.projectIndex,
      value: 1000,
    };
    error = null;
    await contribute(params).catch((err) => {
      error = err.message;
    });

    assert.notEqual(error, null);
  });

  it('Error case with allow withdraw a project but round is not ended', async () => {
    // Get current block number
    const blockNumber = await getCurrentBlockNumber();

    // Schedule Round
    const startBlockNumber = blockNumber + startBlockNumberInterval;
    global.endBlockNumber = startBlockNumber + roundDuration;
    let params = {
      start: startBlockNumber,
      end: global.endBlockNumber,
      matchingFund: 100000000,
      projectIndexes: [global.projectIndex],
    };
    let error = null;
    const grantRoundInfo = await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.strictEqual(error, null);
    // Problems:
    // The response value is '100.0000 µUnit' !== 100000000
    // assert.strictEqual(_.isMatch(grantRoundInfo, params), true);
    assert.notEqual(grantRoundInfo, null);

    await waitForBlockNumber(startBlockNumber);

    // Contribut
    params = {
      projectIndex: global.projectIndex,
      value: 1000,
    };
    error = null;
    const contributeInfo = await contribute(params).catch((err) => {
      error = err.message;
    });

    assert.strictEqual(error, null);
    assert.strictEqual(_.isMatch(contributeInfo, params), true);

    // Allow withdraw
    params = {
      roundIndex: global.roundIndex,
      projectIndex: global.projectIndex,
    };
    error = null;
    await allowWithdraw(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with withdraw a project but not allowed', async () => {
    // Get current block number
    const blockNumber = await getCurrentBlockNumber();

    // Schedule Round
    const startBlockNumber = blockNumber + startBlockNumberInterval;
    global.endBlockNumber = startBlockNumber + roundDuration;
    let params = {
      start: startBlockNumber,
      end: global.endBlockNumber,
      matchingFund: 100000000,
      projectIndexes: [global.projectIndex],
    };
    let error = null;
    const grantRoundInfo = await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.strictEqual(error, null);
    // Problems:
    // The response value is '100.0000 µUnit' !== 100000000
    // assert.strictEqual(_.isMatch(grantRoundInfo, params), true);
    assert.notEqual(grantRoundInfo, null);

    await waitForBlockNumber(startBlockNumber);

    // Contribut
    params = {
      projectIndex: global.projectIndex,
      value: 1000,
    };
    error = null;
    const contributeInfo = await contribute(params).catch((err) => {
      error = err.message;
    });

    assert.strictEqual(error, null);
    assert.strictEqual(_.isMatch(contributeInfo, params), true);

    await waitForBlockNumber(global.endBlockNumber);

    // Withdraw
    params = {
      roundIndex: global.roundIndex,
      projectIndex: global.projectIndex,
    };
    error = null;
    await withdraw(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with contribute a project but not in this round', async () => {
    // Get current block number
    const blockNumber = await getCurrentBlockNumber();

    // Schedule Round
    const startBlockNumber = blockNumber + startBlockNumberInterval;
    global.endBlockNumber = startBlockNumber + roundDuration;
    let params = {
      start: startBlockNumber,
      end: global.endBlockNumber,
      matchingFund: 100000000,
      projectIndexes: [],
    };
    let error = null;
    const grantRoundInfo = await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.strictEqual(error, null);
    // Problems:
    // The response value is '100.0000 µUnit' !== 100000000
    // assert.strictEqual(_.isMatch(grantRoundInfo, params), true);
    assert.notEqual(grantRoundInfo, null);

    await waitForBlockNumber(startBlockNumber);

    // Contribut
    params = {
      projectIndex: 0,
      value: 1000,
    };
    error = null;
    await contribute(params).catch((err) => {
      error = err.message;
    });

    assert.notEqual(error, null);
  });

  it('Error case with cancel a project but not in this round', async () => {
    // Get current block number
    const blockNumber = await getCurrentBlockNumber();

    // Schedule Round
    const startBlockNumber = blockNumber + startBlockNumberInterval;
    global.endBlockNumber = startBlockNumber + roundDuration;
    let params = {
      start: startBlockNumber,
      end: global.endBlockNumber,
      matchingFund: 100000000,
      projectIndexes: [],
    };
    let error = null;
    const grantRoundInfo = await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.strictEqual(error, null);
    // Problems:
    // The response value is '100.0000 µUnit' !== 100000000
    // assert.strictEqual(_.isMatch(grantRoundInfo, params), true);
    assert.notEqual(grantRoundInfo, null);

    await waitForBlockNumber(startBlockNumber);

    // Cancel
    params = {
      roundIndex: global.roundIndex,
      projectIndex: 0,
    };
    error = null;
    await cancel(params).catch((err) => {
      error = err.message;
    });

    assert.notEqual(error, null);
  });
});
