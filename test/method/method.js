/* eslint-disable no-async-promise-executor */
const _ = require('lodash');

const {
  createOpenGrantExtrinsics, getResponseFromEvents, getProjectInfo, getGrantRoundInfo,
} = require('../utils');
const EventTypes = require('../eventTypes');
const Methods = require('../methods');

function createProject(params) {
  return new Promise(async (resolve, reject) => {
    const {
      name, logo, description, website,
    } = params;
    const create = createOpenGrantExtrinsics(Methods.createProject, name, logo, description, website);
    const unsub = await create.signAndSend(global.origin, async ({ events = [], status }) => {
      if (status.isFinalized) {
        unsub();
        const { response, error } = getResponseFromEvents(events, EventTypes.ProjectCreated);
        if (error) {
          reject(error);
        } else {
          const projectIndex = response ? response[0].toNumber() : null;
          global.projectIndex = projectIndex;
          if (projectIndex !== null) {
            let projectInfo = await getProjectInfo(projectIndex);
            projectInfo = projectInfo.toHuman();
            resolve(projectInfo);
          } else {
            reject(new Error(`${Methods.createProject} method has no response event`));
          }
        }
      } else if (status.type === 'Invalid') {
        unsub();
        reject(new Error(`${Methods.createProject} is invalid`));
      }
    }).catch((error) => {
      reject(error);
    });
  });
}

function scheduleRound(params) {
  return new Promise(async (resolve, reject) => {
    const {
      start, end, matchingFund, projectIndexes,
    } = params;

    const round = createOpenGrantExtrinsics(Methods.scheduleRound, start, end, matchingFund, projectIndexes);
    const unsub = await round.signAndSend(global.origin, async ({ events = [], status }) => {
      if (status.isFinalized) {
        unsub();
        const { response, error } = getResponseFromEvents(events, EventTypes.GrantRoundCreated);
        if (error) {
          reject(error);
        } else {
          const roundIndex = response ? response[0].toNumber() : null;
          global.roundIndex = roundIndex;
          if (roundIndex !== null) {
            const roundInfo = await getGrantRoundInfo(roundIndex);
            resolve(roundInfo.toHuman());
          } else {
            reject(new Error(`${Methods.scheduleRound} method has no response event`));
          }
        }
      } else if (status.type === 'Invalid') {
        unsub();
        reject(new Error(`${Methods.scheduleRound} is invalid`));
      }
    }).catch((error) => {
      reject(error);
    });
  });
}

function contribute(params) {
  return new Promise(async (resolve, reject) => {
    const {
      value, projectIndex,
    } = params;

    const round = createOpenGrantExtrinsics(Methods.contribute, projectIndex, value);
    const unsub = await round.signAndSend(global.origin, async ({ events = [], status }) => {
      if (status.isFinalized) {
        unsub();
        const { response, error } = getResponseFromEvents(events, EventTypes.ContributeSucceed);
        if (error) {
          reject(error);
        } else if (response) {
          resolve({
            contributer: response[0].toHuman(),
            projectIndex: response[1].toNumber(),
            value: response[2].toNumber(),
            block: response[3].toNumber(),
          });
        } else {
          reject(new Error(`${Methods.contribute} method has no response event`));
        }
      } else if (status.type === 'Invalid') {
        unsub();
        reject(new Error(`${Methods.contribute} is invalid`));
      }
    }).catch((error) => {
      reject(error);
    });
  });
}

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
            roundIndex: response[0].toNumber(),
            projectIndex: response[1].toNumber(),
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

function cancelRound() {
  return new Promise(async (resolve, reject) => {
    const round = createOpenGrantExtrinsics(Methods.cancelRound);
    const unsub = await round.signAndSend(global.origin, async ({ events = [], status }) => {
      if (status.isFinalized) {
        unsub();
        const { response, error } = getResponseFromEvents(events, EventTypes.RoundCanceled);
        if (error) {
          reject(error);
        } else if (response) {
          resolve(true);
        } else {
          reject(new Error(`${Methods.cancelRound} method has no response event`));
        }
      } else if (status.type === 'Invalid') {
        unsub();
        reject(new Error(`${Methods.cancelRound} is invalid`));
      }
    }).catch((error) => {
      reject(error);
    });
  });
}

function allowWithdraw(params) {
  return new Promise(async (resolve, reject) => {
    const {
      roundIndex, projectIndex,
    } = params;

    const round = createOpenGrantExtrinsics(Methods.allowWithdraw, roundIndex, projectIndex);
    const unsub = await round.signAndSend(global.origin, async ({ events = [], status }) => {
      if (status.isFinalized) {
        unsub();
        const { response, error } = getResponseFromEvents(events, EventTypes.GrantAllowedWithdraw);
        if (error) {
          reject(error);
        } else if (response) {
          resolve({
            roundIndex: response[0].toNumber(),
            projectIndex: response[1].toNumber(),
          });
        } else {
          reject(new Error(`${Methods.allowWithdraw} method has no response event`));
        }
      } else if (status.type === 'Invalid') {
        unsub();
        reject(new Error(`${Methods.allowWithdraw} is invalid`));
      }
    }).catch((error) => {
      reject(error);
    });
  });
}

function withdraw(params) {
  return new Promise(async (resolve, reject) => {
    const {
      roundIndex, projectIndex,
    } = params;

    const round = createOpenGrantExtrinsics(Methods.withdraw, roundIndex, projectIndex);
    const unsub = await round.signAndSend(global.origin, async ({ events = [], status }) => {
      if (status.isFinalized) {
        unsub();
        const { response, error } = getResponseFromEvents(events, EventTypes.GrantWithdrawn);
        if (error) {
          reject(error);
        } else if (response) {
          resolve({
            roundIndex: response[0].toNumber(),
            projectIndex: response[1].toNumber(),
            matchingFund: response[2].toNumber(),
            contributionFund: response[3].toNumber(),
          });
        } else {
          reject(new Error(`${Methods.withdraw} method has no response event`));
        }
      } else if (status.type === 'Invalid') {
        unsub();
        reject(new Error(`${Methods.withdraw} is invalid`));
      }
    }).catch((error) => {
      reject(error);
    });
  });
}

function waitForBlockNumber(waitBlockNumber) {
  return new Promise(async (resolve) => {
    const unsub = await global.api.rpc.chain.subscribeNewHeads((header) => {
      const blockNumber = header.number.toNumber();
      console.log('current blockNumber: ', blockNumber);
      console.log('waitForBlockNumber: ', waitBlockNumber);

      if (blockNumber > waitBlockNumber) {
        unsub();
        resolve(true);
      }
    });
  });
}

module.exports = {
  createProject,
  scheduleRound,
  contribute,
  cancel,
  cancelRound,
  allowWithdraw,
  withdraw,
  waitForBlockNumber,
};
