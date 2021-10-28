const { assert } = require('chai');
const _ = require('lodash');

const QuadraticFunding = require('../QuadraticFunding');
const { createProject, preFund } = require('../utils');

const shouldPass = async (quadraticFunding, params) => {
  const { error, info } = await createProject(quadraticFunding, params);
  assert.strictEqual(error, null, 'Should not catch an error');
  assert.strictEqual(_.isMatch(info, params), true, 'Project info should contain the params');
};

const shouldFail = async (quadraticFunding, params) => {
  const { error, info } = await createProject(quadraticFunding, params);
  assert.notEqual(error, null, 'Should catch an error');
  assert.strictEqual(_.isEmpty(info), true, 'Project info should be empty');
};

describe('Unit Test - create_project', async () => {
  const quadraticFunding = new QuadraticFunding();
  before(async () => {
    await quadraticFunding.init();

    await preFund(quadraticFunding);
  });

  it('Input with non-empty string should pass', async () => {
    const params = {
      name: 'name',
      logo: 'https://oak.tech/_next/static/images/logo-e546db00eb163fae7f0c56424c3a2586.png',
      description: 'description',
      website: 'https://oak.tech/',
    };
    await shouldPass(quadraticFunding, params);
  });

  it('Input with specific symbols should pass', async () => {
    const params = {
      name: '\\_?*&^%$#@~!@name',
      logo: '\\_?*&^%$#@~!https://oak.tech/_next/static/images/logo-e546db00eb163fae7f0c56424c3a2586.png',
      description: '\\_?*&^%$#@~!description',
      website: '\\_?*&^%$#@~!https://oak.tech/',
    };
    await shouldPass(quadraticFunding, params);
  });

  it('Input as empty string should fail', async () => {
    const params = {
      name: '',
      logo: '',
      description: '',
      website: '',
    };
    await shouldFail(quadraticFunding, params);
  });
});
