/* eslint-disable no-async-promise-executor */
const { assert } = require('chai');
const _ = require('lodash');
const BigNumber = require('bignumber.js');

const {
  initAccount, initApi, getProjectCount,
} = require('../utils');
const { contribute } = require('./method');

describe('Method Test - withdraw', async () => {
  before(async () => {
    await initAccount();
    await initApi();
  });

  beforeEach(async () => {
    const projectCount = await getProjectCount();
    global.projectCount = projectCount.toNumber();
  });

  it('Success case', async () => {
    const params = {
      projectIndex: 0,
      value: 100,
    };

    let error = null;
    const contributeInfo = await contribute(params).catch((err) => {
      error = err.message;
    });
    assert.strictEqual(error, null);
    assert.strictEqual(_.isMatch(contributeInfo, params), true);
  });

  it('Error case with value = 0', async () => {
    const params = {
      projectIndex: 0,
      value: 0,
    };

    let error = null;
    await contribute(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with value < 0', async () => {
    const params = {
      projectIndex: 0,
      value: -100,
    };

    let error = null;
    await contribute(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with invalid project index (invalid array index)', async () => {
    const params = {
      projectIndex: -1,
      value: 100,
    };

    let error = null;
    await contribute(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with invalid project index (project is not exsit)', async () => {
    const params = {
      projectIndex: global.projectCount + 10,
      value: 100,
    };

    let error = null;
    await contribute(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with value is null', async () => {
    const params = {
      projectIndex: null,
      value: null,
    };

    let error = null;
    await contribute(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with value type is empty string', async () => {
    const params = {
      projectIndex: '',
      value: '',
    };

    let error = null;
    await contribute(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with value type is array', async () => {
    const params = {
      projectIndex: [0],
      value: [100],
    };

    let error = null;
    await contribute(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with value type is BigNumber', async () => {
    const params = {
      projectIndex: BigNumber(0),
      value: BigNumber(100),
    };

    let error = null;
    await contribute(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });
});
