/* eslint-disable no-async-promise-executor */
/* eslint-disable no-console */

const { assert } = require('chai');
const _ = require('lodash');

const { describe, it } = require('./testModule');
const {
  initAccount, initApi, createOpenGrantExtrinsics, getResponseFromEvents, readOpenGrantStorage,
} = require('./utils');

function createProject(params) {
  return new Promise(async (resolve, reject) => {
    const {
      name, logo, description, website,
    } = params;
    const create = createOpenGrantExtrinsics('createProject', name, logo, description, website);
    const unsub = await create.signAndSend(global.origin, async ({ events = [], status }) => {
      if (status.isFinalized) {
        unsub();
        const { response, error } = getResponseFromEvents(events, 'ProjectCreated');
        if (error) {
          reject(error);
        } else {
          const projectIndex = response ? response[0] : null;
          if (projectIndex) {
            let projectInfo = await readOpenGrantStorage('projects', Number(projectIndex));
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
  await initAccount();
  await initApi();

  describe('Method(createProject) Test', async () => {
    await it('Success test', async () => {
      const params = {
        name: 'name',
        logo: 'https://oak.tech/_next/static/images/logo-e546db00eb163fae7f0c56424c3a2586.png',
        description: 'description',
        website: 'https://oak.tech/',
      };
      let error = null;
      const projectInfo = await createProject(params).catch((err) => {
        error = err.message;
      });
      assert.strictEqual(error, null);
      assert.strictEqual(_.isMatch(projectInfo, params), true);
    });

    await it('Success test with value has some specific symbols', async () => {
      const params = {
        name: '\\_?*&^%$#@~!@name',
        logo: '\\_?*&^%$#@~!https://oak.tech/_next/static/images/logo-e546db00eb163fae7f0c56424c3a2586.png',
        description: '\\_?*&^%$#@~!description',
        website: '\\_?*&^%$#@~!https://oak.tech/',
      };
      let error = null;
      const projectInfo = await createProject(params).catch((err) => {
        error = err.message;
      });
      assert.strictEqual(error, null);
      assert.strictEqual(_.isMatch(projectInfo, params), true);
    });

    await it('Error test with value type is number', async () => {
      const params = {
        name: 123,
        logo: 123,
        description: 123,
        website: 123,
      };
      let error = null;
      await createProject(params).catch((err) => {
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
      await createProject(params).catch((err) => {
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
      await createProject(params).catch((err) => {
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
      await createProject(params).catch((err) => {
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
      await createProject(params).catch((err) => {
        error = err.message;
      });
      assert.notEqual(error, null);
    });
  });
}

test();
