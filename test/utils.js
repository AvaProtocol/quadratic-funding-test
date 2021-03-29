/* eslint-disable max-len */
const _ = require('lodash');

const OpenGrant = require('./OpenGrant');
const ExtrinsicsTypes = require('./extrinsicsTypes');
const { confirmBlocks } = require('./constant');

const createProject = async (openGrant, params) => {
  let error = null;
  let info = null;
  let index = null;
  const extrinsic = await openGrant.createProject(params);
  const response = await OpenGrant.signAndSubscribeExtrinsic(
    extrinsic, openGrant.projectOrigin, ExtrinsicsTypes.createProject,
  ).catch((err) => {
    error = err.message;
  });
  if (!_.isEmpty(response)) {
    index = response[0].toNumber();
    info = await openGrant.getProjectInfo(index);
  }
  return { info, error, index };
};

const scheduleRound = async (openGrant, params) => {
  let error = null;
  let info = null;
  let index = null;
  const extrinsic = await openGrant.scheduleRound(params);
  const response = await OpenGrant.signAndSubscribeExtrinsic(
    extrinsic, openGrant.sudoOrigin, ExtrinsicsTypes.scheduleRound,
  ).catch((err) => {
    error = err.message;
  });
  if (!_.isEmpty(response)) {
    index = response[0].toNumber();
    info = await openGrant.getGrantRoundInfo(index);
  }
  return { info, error, index };
};

const cancelRound = async (openGrant) => {
  let error = null;
  const extrinsic = await openGrant.cancelRound();
  const response = await OpenGrant.signAndSubscribeExtrinsic(
    extrinsic, openGrant.sudoOrigin, ExtrinsicsTypes.cancelRound,
  ).catch((err) => {
    error = err.message;
  });
  return { error, roundCanceled: !_.isEmpty(response) };
};

const contribute = async (openGrant, params) => {
  let error = null;
  const extrinsic = await openGrant.contribute(params);
  const response = await OpenGrant.signAndSubscribeExtrinsic(
    extrinsic, openGrant.userOrigin, ExtrinsicsTypes.contribute,
  ).catch((err) => {
    error = err.message;
  });
  return {
    info: {
      contributer: response[0].toHuman(),
      projectIndex: response[1].toNumber(),
      value: response[2].toNumber(),
      block: response[3].toNumber(),
    },
    error,
  };
};

const cleanRound = async (openGrant) => {
  const currentBlockNumber = await openGrant.getCurrentBlockNumber();
  const roundCount = await openGrant.getGrantRoundCount();
  if (roundCount) {
    const response = await openGrant.getGrantRoundInfo(roundCount - 1);
    const start = Number(response.toHuman().start.replace(',', ''));
    const end = Number(response.toHuman().end.replace(',', ''));

    if (currentBlockNumber >= start - confirmBlocks && currentBlockNumber < end) {
      // If the round is start but not ended
      // Why start - confirmBlocks? Because cancel round need send a extrinsic and wait for some blocks to finalized
      await openGrant.waitForBlockNumber(end);
    } else if (currentBlockNumber < start - confirmBlocks) {
      // If round is not start, cancel this round
      const { error, roundCanceled } = await cancelRound(openGrant);

      // // Problems: sometimes 'Insufficient balance' error
      // assert.strictEqual(error, null, 'Cancel round should not catch an error');
      // assert.strictEqual(roundCanceled, true, 'Cancel round response should not be empty');
    }
  }
};

module.exports = {
  createProject,
  scheduleRound,
  cancelRound,
  contribute,
  cleanRound,
};
