/* eslint-disable no-restricted-syntax */
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
const _ = require('lodash');

const config = require('./config');

async function initAccount() {
  if (_.isEmpty(global.origin)) {
    const { phrase } = config;
    await cryptoWaitReady();
    const keyring = new Keyring({ type: 'sr25519' });
    const origin = keyring.addFromUri(phrase);
    global.origin = origin;
  }
}

async function initApi() {
  if (_.isEmpty(global.api)) {
    const { endpoint, types } = config;
    const wsProvider = new WsProvider(endpoint);
    const api = await ApiPromise.create({
      provider: wsProvider,
      types,
    });

    global.api = api;
  }
}

function getResponseFromEvents(events, queryMethod) {
  let response = null;
  let error = null;
  events.forEach(({ phase, event: { data, method, section } }) => {
    console.log(`\t' ${phase}: ${section}.${method}:: ${data}`);
    if (section.toString() === 'system' && method.toString() === 'ExtrinsicFailed') {
      error = new Error('ExtrinsicFailed');
    }
    if (section.toString() === 'openGrant' && method.toString() === queryMethod) {
      response = data;
    }
  });
  return { response, error };
}

function createOpenGrantExtrinsics(method, ...args) {
  return global.api.tx.openGrant[method](...args);
}

function readOpenGrantStorage(method, ...args) {
  return global.api.query.openGrant[method](...args);
}

async function getCurrentBlockNumber() {
  const blockNumber = await global.api.query.system.number();
  return blockNumber.toNumber();
}

function getProjectCount() {
  return readOpenGrantStorage('projectCount');
}

function getProjectInfo(projectIndex) {
  return readOpenGrantStorage('projects', projectIndex);
}

function getGrantRoundCount() {
  return readOpenGrantStorage('grantRoundCount');
}

function getGrantRoundInfo(grantRoundIndex) {
  return readOpenGrantStorage('grantRounds', grantRoundIndex);
}

module.exports = {
  initAccount,
  initApi,
  getResponseFromEvents,
  createOpenGrantExtrinsics,
  readOpenGrantStorage,
  getCurrentBlockNumber,
  getProjectCount,
  getProjectInfo,
  getGrantRoundCount,
  getGrantRoundInfo,
};
