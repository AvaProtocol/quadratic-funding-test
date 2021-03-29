const { assert } = require('chai');
const _ = require('lodash');

const OpenGrant = require('../OpenGrant');
const { createProject } = require('../utils');

const shouldPass = async (openGrant, params) => {
  const { error, info } = await createProject(openGrant, params);
  assert.strictEqual(error, null, 'Should not catch an error');
  assert.strictEqual(_.isMatch(info, params), true, 'Project info should contain the params');
};

const shouldFail = async (openGrant, params) => {
  const { error, info } = await createProject(openGrant, params);
  assert.notEqual(error, null, 'Should catch an error');
  assert.strictEqual(_.isEmpty(info), true, 'Project info should be empty');
};

describe('Method Test - create_project', async () => {
  const openGrant = new OpenGrant();
  before(async () => {
    await openGrant.init();
  });

  it('Input with non-empty string should pass', async () => {
    const params = {
      name: 'name',
      logo: 'https://oak.tech/_next/static/images/logo-e546db00eb163fae7f0c56424c3a2586.png',
      description: 'description',
      website: 'https://oak.tech/',
    };
    await shouldPass(openGrant, params);
  });

  it('Input with specific symbols should pass', async () => {
    const params = {
      name: '\\_?*&^%$#@~!@name',
      logo: '\\_?*&^%$#@~!https://oak.tech/_next/static/images/logo-e546db00eb163fae7f0c56424c3a2586.png',
      description: '\\_?*&^%$#@~!description',
      website: '\\_?*&^%$#@~!https://oak.tech/',
    };
    await shouldPass(openGrant, params);
  });

  it('Input with number type should fail', async () => {
    const params = {
      name: 123,
      logo: 123,
      description: 123,
      website: 123,
    };
    await shouldFail(openGrant, params);
  });

  it('Input as null should fail', async () => {
    const params = {
      name: null,
      logo: null,
      description: null,
      website: null,
    };
    await shouldFail(openGrant, params);
  });

  it('Input as empty string should fail', async () => {
    const params = {
      name: '',
      logo: '',
      description: '',
      website: '',
    };
    await shouldFail(openGrant, params);
  });

  it('Input as empty array should fail', async () => {
    const params = {
      name: [],
      logo: [],
      description: [],
      website: [],
    };
    await shouldFail(openGrant, params);
  });

  it('Input as empty object should fail', async () => {
    const params = {
      name: {},
      logo: {},
      description: {},
      website: {},
    };
    await shouldFail(openGrant, params);
  });
});
