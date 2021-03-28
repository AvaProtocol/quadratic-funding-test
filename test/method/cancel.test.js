/* eslint-disable no-async-promise-executor */
const { assert } = require('chai');
const _ = require('lodash');
const BigNumber = require('bignumber.js');

const {
  initAccount, initApi,
  getProjectCount, getGrantRoundCount,
} = require('../utils');
const { cancel } = require('./method');

describe('Method Test - cancel', async () => {
  before(async () => {
    await initAccount();
    await initApi();
  });

  beforeEach(async () => {
    const projectCount = await getProjectCount();
    global.projectCount = projectCount.toNumber();

    const grantRoundCount = await getGrantRoundCount();
    global.grantRoundCount = grantRoundCount.toNumber();
  });

  it('Success case', async () => {
    const params = {
      roundIndex: 0,
      projectIndex: 0,
    };

    let error = null;
    const cancelInfo = await cancel(params).catch((err) => {
      error = err.message;
    });
    assert.strictEqual(error, null);
    assert.strictEqual(_.isMatch(cancelInfo, params), true);
  });

  it('Error case with invalid round index (invalid array index)', async () => {
    const params = {
      roundIndex: -1,
      projectIndex: 0,
    };

    let error = null;
    await cancel(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with invalid round index (round is not exist)', async () => {
    const params = {
      roundIndex: global.grantRoundCount + 10,
      projectIndex: 0,
    };

    let error = null;
    await cancel(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with invalid project index (invalid array index)', async () => {
    const params = {
      roundIndex: 0,
      projectIndex: -1,
    };

    let error = null;
    await cancel(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with invalid project index (project is not exist)', async () => {
    const params = {
      roundIndex: 0,
      projectIndex: global.projectCount + 10,
    };

    let error = null;
    await cancel(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with value is null', async () => {
    const params = {
      roundIndex: null,
      projectIndex: null,
    };

    let error = null;
    await cancel(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with value is empty string', async () => {
    const params = {
      roundIndex: '',
      projectIndex: '',
    };

    let error = null;
    await cancel(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with value type is array', async () => {
    const params = {
      roundIndex: [0],
      projectIndex: [0],
    };

    let error = null;
    await cancel(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with value type is BigNumber', async () => {
    const params = {
      roundIndex: BigNumber(0),
      projectIndex: BigNumber(0),
    };

    let error = null;
    await cancel(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });
});
