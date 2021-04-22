/* eslint-disable max-len */
const _ = require('lodash');

const OpenGrant = require('./OpenGrant');
const ExtrinsicsTypes = require('./extrinsicsTypes');
const { confirmBlocks, fundAmount } = require('./constant');

const fund = async (openGrant, params) => {
  let error = null;
  try {
    const extrinsic = await openGrant.fund(params);
    await OpenGrant.signAndSubscribeExtrinsic(
      extrinsic, openGrant.projectOrigin, ExtrinsicsTypes.fund,
    ).catch((err) => {
      error = err;
    });
  } catch (err) {
    error = err;
  }

  return { error };
};

const createProject = async (openGrant, params) => {
  let error = null;
  let info = null;
  let index = null;
  try {
    const extrinsic = await openGrant.createProject(params);
    const response = await OpenGrant.signAndSubscribeExtrinsic(
      extrinsic, openGrant.projectOrigin, ExtrinsicsTypes.createProject,
    ).catch((err) => {
      error = err;
    });
    if (!_.isEmpty(response)) {
      index = response[0].toNumber();
      info = await openGrant.getProjectInfo(index);
    }
  } catch (err) {
    error = err;
  }

  return { info: (info && info.toHuman()), error, index };
};

const scheduleRound = async (openGrant, params) => {
  let error = null;
  let info = null;
  let index = null;
  try {
    const extrinsic = await openGrant.scheduleRound(params);
    const response = await OpenGrant.signAndSubscribeExtrinsic(
      extrinsic, openGrant.sudoOrigin, ExtrinsicsTypes.scheduleRound,
    ).catch((err) => {
      error = err;
    });
    if (!_.isEmpty(response)) {
      index = response[0].toNumber();
      info = await openGrant.getGrantRoundInfo(index);
    }
  } catch (err) {
    error = err;
  }

  return { info, error, index };
};

const cancel = async (openGrant, params) => {
  let error = null;
  let info = null;
  try {
    const extrinsic = await openGrant.cancel(params);
    const response = await OpenGrant.signAndSubscribeExtrinsic(
      extrinsic, openGrant.sudoOrigin, ExtrinsicsTypes.cancel,
    ).catch((err) => {
      error = err;
    });
    info = response ? {
      roundIndex: response[0].toNumber(),
      projectIndex: response[1].toNumber(),
    } : null;
  } catch (err) {
    error = err;
  }
  return {
    info,
    error,
  };
};

const cancelRound = async (openGrant, params) => {
  let error = null;
  let response = null;
  try {
    const extrinsic = await openGrant.cancelRound(params);
    response = await OpenGrant.signAndSubscribeExtrinsic(
      extrinsic, openGrant.sudoOrigin, ExtrinsicsTypes.cancelRound,
    ).catch((err) => {
      error = err;
    });
  } catch (err) {
    error = err;
  }

  return { error, roundCanceled: !_.isEmpty(response) };
};

const contribute = async (openGrant, params) => {
  let error = null;
  let info = null;
  try {
    const extrinsic = await openGrant.contribute(params);
    const response = await OpenGrant.signAndSubscribeExtrinsic(
      extrinsic, openGrant.userOrigin, ExtrinsicsTypes.contribute,
    ).catch((err) => {
      error = err;
    });
    info = response ? {
      contributer: response[0].toHuman(),
      projectIndex: response[1].toNumber(),
      value: response[2].toNumber(),
      block: response[3].toNumber(),
    } : null;
  } catch (err) {
    error = err;
  }

  return {
    info,
    error,
  };
};

const finalizeRound = async (openGrant, params) => {
  let error = null;
  let response = null;
  try {
    const extrinsic = await openGrant.finalizeRound(params);
    response = await OpenGrant.signAndSubscribeExtrinsic(
      extrinsic, openGrant.sudoOrigin, ExtrinsicsTypes.finalizeRound,
    ).catch((err) => {
      error = err;
    });
  } catch (err) {
    error = err;
  }

  return {
    response: !!response,
    error,
  };
};

const approve = async (openGrant, params) => {
  let error = null;
  let info = null;
  try {
    const extrinsic = await openGrant.approve(params);
    const response = await OpenGrant.signAndSubscribeExtrinsic(
      extrinsic, openGrant.sudoOrigin, ExtrinsicsTypes.approve,
    ).catch((err) => {
      error = err;
    });
    info = response ? {
      roundIndex: response[0].toNumber(),
      projectIndex: response[1].toNumber(),
    } : null;
  } catch (err) {
    error = err;
  }

  return {
    info,
    error,
  };
};

const withdraw = async (openGrant, params) => {
  let error = null;
  let info = null;
  try {
    const extrinsic = await openGrant.withdraw(params);
    const response = await OpenGrant.signAndSubscribeExtrinsic(
      extrinsic, openGrant.projectOrigin, ExtrinsicsTypes.withdraw,
    ).catch((err) => {
      error = err;
    });
    info = response ? {
      roundIndex: response[0].toNumber(),
      projectIndex: response[1].toNumber(),
      matchingFund: response[2].toNumber(),
      contributionFund: response[3].toNumber(),
    } : null;
  } catch (err) {
    error = err;
  }

  return {
    info,
    error,
  };
};

const cleanRound = async (openGrant) => {
  const currentBlockNumber = await openGrant.getCurrentBlockNumber();
  const roundCount = await openGrant.getGrantRoundCount();
  if (roundCount) {
    const roundIndex = roundCount - 1;
    const response = await openGrant.getGrantRoundInfo(roundIndex);
    const start = Number(response.toHuman().start.replace(',', ''));
    const end = Number(response.toHuman().end.replace(',', ''));

    if (currentBlockNumber >= start - confirmBlocks && currentBlockNumber < end) {
      // If the round is start but not ended
      // Why start - confirmBlocks? Because cancel round need send a extrinsic and wait for some blocks to finalized
      await openGrant.waitForBlockNumber(end);
    } else if (currentBlockNumber < start - confirmBlocks) {
      // If round is not start, cancel this round
      await cancelRound(openGrant, { roundIndex });
    }
  }
};

// Check the unused fund, if <= fundAmount, add new fund to pool
const checkAndFund = async (openGrant) => {
  const unusedFund = await openGrant.getUnusedFund();
  if (unusedFund <= fundAmount) {
    await fund(openGrant, { fundBalance: fundAmount });
  }
};

module.exports = {
  fund,
  createProject,
  scheduleRound,
  cancel,
  cancelRound,
  contribute,
  finalizeRound,
  approve,
  withdraw,
  cleanRound,
  checkAndFund,
};
