/* eslint-disable no-restricted-syntax */
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
const _ = require('lodash');

const config = require('./config');

async function initAccount() {
  if (_.isEmpty(global.projectOrigin)) {
    const { projectPhrase, userPhrase, sudoPhrase } = config;
    await cryptoWaitReady();
    const keyring = new Keyring({ type: 'sr25519' });
    const projectOrigin = keyring.addFromUri(projectPhrase);
    const userOrigin = keyring.addFromUri(userPhrase);
    const sudoOrigin = keyring.addFromUri(sudoPhrase);

    global.projectOrigin = projectOrigin;
    global.userOrigin = userOrigin;
    global.sudoOrigin = sudoOrigin;
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

function createOpenGrantExtrinsics(method, ...args) {
  return global.api.tx.openGrant[method](...args);
}

function readOpenGrantStorage(method, ...args) {
  return global.api.query.openGrant[method](...args);
}

function getCurrentBlockNumber() {
  return global.api.query.system.number();
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
