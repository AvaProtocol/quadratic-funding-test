/* eslint-disable no-async-promise-executor */
/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
const { assert } = require('chai');

let caseCount = 1;
let passedCount = 0;
let failedCount = 0;

function isContainedIn(a, b) {
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    let i = 0;
    const la = a.length;
    for (let j = 0, lb = b.length; i < la && j < lb; j += 1) {
      if (isContainedIn(a[i], b[j])) {
        i += 1;
      }
    }
    return i === la;
  } if (Object(a) === a) {
    for (const p in a) {
      if (!(p in b && isContainedIn(a[p], b[p]))) {
        return false;
      }
    }
    return true;
  } return a === b;
}

async function describe(title, callback) {
  console.log(title);
  caseCount = 1;
  await callback();
  if (passedCount) console.log('Passed Count: ', passedCount);
  if (failedCount) console.log('Failed Count: ', failedCount);
}

async function it(title, callback) {
  console.log('\t', `#Case ${caseCount}: ${title}`);
  try {
    await callback();
    console.log('\t\tPassed');
    passedCount += 1;
  } catch (error) {
    console.log('\t\tFailed');
    failedCount += 1;
  }

  caseCount += 1;
}

function createOpenGrantExtrinsics(api, method, ...args) {
  return api.tx.openGrant[method](...args);
}

function readOpenGrantStorage(api, method, ...args) {
  return api.query.openGrant[method](...args);
}

function getResponseFromEvents(events, queryMethod) {
  let response = null;
  let error = null;
  events.forEach(({ event: { data, method, section } }) => {
    if (section === 'system' && method === 'ExtrinsicFailed') {
      error = new Error('ExtrinsicFailed');
    }
    if (section === 'openGrant' && method === queryMethod) {
      response = data.toHuman();
    }
  });
  return { response, error };
}

function createProject(api, params, origin) {
  return new Promise(async (resolve, reject) => {
    const {
      name, logo, description, website,
    } = params;
    const create = createOpenGrantExtrinsics(api, 'createProject', name, logo, description, website);
    const unsub = await create.signAndSend(origin, async ({ events = [], status }) => {
      if (status.isFinalized) {
        unsub();
        const { response, error } = getResponseFromEvents(events, 'ProjectCreated');
        if (error) {
          reject(error);
        } else {
          const projectIndex = response ? response[0] : null;
          if (projectIndex) {
            let projectInfo = await readOpenGrantStorage(api, 'projects', Number(projectIndex));
            projectInfo = projectInfo.toHuman();
            resolve(projectInfo);
          } else {
            reject(new Error('Create project method has no response event'));
          }
        }
      }
    }).catch((error) => {
      reject(error);
    });
  });
}

async function test() {
  const endpoint = 'ws://127.0.0.1:9944';
  const wsProvider = new WsProvider(endpoint);
  const api = await ApiPromise.create({
    provider: wsProvider,
    types: {
      ProjectIndex: 'u32',
      ProjectOf: 'Project',
      GrantRoundIndex: 'u32',
      GrantRoundOf: 'GrantRound',
      GrantRound: {
        start: 'BlockNumber',
        end: 'BlockNumber',
        matching_fund: 'Balance',
        grants: 'Vec<Grant>',
      },
      Grant: {
        project_index: 'ProjectIndex',
        contributions: 'Vec<Contribution>',
        is_allowed_withdraw: 'bool',
        is_canceled: 'bool',
        is_withdrawn: 'bool',
      },
      Contribution: {
        account_id: 'AccountId',
        value: 'Balance',
      },
      Project: {
        name: 'Vec<u8>',
        logo: 'Vec<u8>',
        description: 'Vec<u8>',
        website: 'Vec<u8>',
        owner: 'AccountId',
      },
    },
  });
  await cryptoWaitReady();
  const keyring = new Keyring({ type: 'sr25519' });
  // Just for test
  const PHRASE = 'island soul total still tank jaguar grit evolve ladder pelican this alert';
  const alice = keyring.addFromUri(PHRASE);

  describe('Method(createProject) Test', async () => {
    await it('Success test', async () => {
      const params = {
        name: 'name',
        logo: 'https://oak.tech/_next/static/images/logo-e546db00eb163fae7f0c56424c3a2586.png',
        description: 'description',
        website: 'https://oak.tech/',
      };
      let error = null;
      const projectInfo = await createProject(api, params, alice).catch((err) => {
        error = err.message;
      });
      assert.strictEqual(error, null);
      assert.strictEqual(isContainedIn(params, projectInfo), true);
    });

    await it('Success test with value has some specific symbols', async () => {
      const params = {
        name: '\\_?*&^%$#@~!@name',
        logo: '\\_?*&^%$#@~!https://oak.tech/_next/static/images/logo-e546db00eb163fae7f0c56424c3a2586.png',
        description: '\\_?*&^%$#@~!description',
        website: '\\_?*&^%$#@~!https://oak.tech/',
      };
      let error = null;
      const projectInfo = await createProject(api, params, alice).catch((err) => {
        error = err.message;
      });
      assert.strictEqual(error, null);
      assert.strictEqual(isContainedIn(params, projectInfo), true);
    });

    await it('Error test with value type is number', async () => {
      const params = {
        name: 123,
        logo: 123,
        description: 123,
        website: 123,
      };
      let error = null;
      await createProject(api, params, alice).catch((err) => {
        error = err.message;
      });
      assert.notEqual(error, null);
    });

    await it('Error test with value is null', async () => {
      const params = {
        name: null,
        logo: null,
        description: null,
        website: null,
      };
      let error = null;
      await createProject(api, params, alice).catch((err) => {
        error = err.message;
      });
      assert.notEqual(error, null);
    });

    await it('Error test with value is empty string', async () => {
      const params = {
        name: '',
        logo: '',
        description: '',
        website: '',
      };
      let error = null;
      await createProject(api, params, alice).catch((err) => {
        error = err.message;
      });
      assert.notEqual(error, null);
    });

    await it('Error test with value is empty array', async () => {
      const params = {
        name: [],
        logo: [],
        description: [],
        website: [],
      };
      let error = null;
      await createProject(api, params, alice).catch((err) => {
        error = err.message;
      });
      assert.notEqual(error, null);
    });

    await it('Error test with value is empty object', async () => {
      const params = {
        name: {},
        logo: {},
        description: {},
        website: {},
      };
      let error = null;
      await createProject(api, params, alice).catch((err) => {
        error = err.message;
      });
      assert.notEqual(error, null);
    });
  });
}

test();
