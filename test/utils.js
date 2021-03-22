/* eslint-disable no-restricted-syntax */
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { cryptoWaitReady } = require('@polkadot/util-crypto');

const config = require('./config');

async function initAccount() {
  const { phrase } = config;
  await cryptoWaitReady();
  const keyring = new Keyring({ type: 'sr25519' });
  const origin = keyring.addFromUri(phrase);

  global.origin = origin;
}

async function initApi() {
  const { endpoint, types } = config;
  const wsProvider = new WsProvider(endpoint);
  const api = await ApiPromise.create({
    provider: wsProvider,
    types,
  });

  global.api = api;
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

module.exports = {
  initAccount,
  initApi,
  getResponseFromEvents,
  createOpenGrantExtrinsics,
  readOpenGrantStorage,
};
