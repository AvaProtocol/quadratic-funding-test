/* eslint-disable no-async-promise-executor */
const { assert } = require('chai');
const _ = require('lodash');
const BigNumber = require('bignumber.js');

const {
  initAccount, initApi, createOpenGrantExtrinsics, getResponseFromEvents,
  getProjectCount, getGrantRoundCount,
} = require('../utils');
const EventTypes = require('../eventTypes');
const Methods = require('../methods');

function cancel(params) {
  return new Promise(async (resolve, reject) => {
    const {
      roundIndex, projectIndex,
    } = params;

    const round = createOpenGrantExtrinsics(Methods.cancel, roundIndex, projectIndex);
    const unsub = await round.signAndSend(global.origin, async ({ events = [], status }) => {
      if (status.isFinalized) {
        unsub();
        const { response, error } = getResponseFromEvents(events, EventTypes.GrantCanceled);
        if (error) {
          reject(error);
        } else if (response) {
          resolve({
            roundIndex: Number(response[0]),
            projectIndex: Number(response[1]),
          });
        } else {
          reject(new Error(`${Methods.cancel} method has no response event`));
        }
      } else if (status.type === 'Invalid') {
        unsub();
        reject(new Error(`${Methods.cancel} is invalid`));
      }
    }).catch((error) => {
      reject(error);
    });
  });
}

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
