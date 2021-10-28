/* eslint-disable max-len */
const _ = require('lodash');

const QuadraticFunding = require('./QuadraticFunding');
const ExtrinsicsTypes = require('./extrinsicsTypes');
const { confirmBlocks, fundAmount } = require('./constant');

const fund = async (quadraticFunding, params) => {
  let error = null;
  try {
    const extrinsic = await quadraticFunding.fund(params);
    await QuadraticFunding.signAndSubscribeExtrinsic(
      extrinsic, quadraticFunding.projectOrigin, ExtrinsicsTypes.fund,
    ).catch((err) => {
      error = err;
    });
  } catch (err) {
    error = err;
  }

  return { error };
};

const createProject = async (quadraticFunding, params) => {
  let error = null;
  let info = null;
  let index = null;
  try {
    const extrinsic = await quadraticFunding.createProject(params);
    const response = await QuadraticFunding.signAndSubscribeExtrinsic(
      extrinsic, quadraticFunding.projectOrigin, ExtrinsicsTypes.createProject,
    ).catch((err) => {
      error = err;
    });
    if (!_.isEmpty(response)) {
      index = response[0].toNumber();
      info = await quadraticFunding.getProjectInfo(index);
    }
  } catch (err) {
    error = err;
  }

  return { info: (info && info.toHuman()), error, index };
};

const scheduleRound = async (quadraticFunding, params) => {
  let error = null;
  let info = null;
  let index = null;
  try {
    const extrinsic = await quadraticFunding.scheduleRound(params);
    const response = await QuadraticFunding.signAndSubscribeExtrinsic(
      extrinsic, quadraticFunding.sudoOrigin, ExtrinsicsTypes.scheduleRound,
    ).catch((err) => {
      error = err;
    });
    if (!_.isEmpty(response)) {
      index = response[0].toNumber();
      info = await quadraticFunding.getGrantRoundInfo(index);
    }
  } catch (err) {
    error = err;
  }

  return { info, error, index };
};

const cancel = async (quadraticFunding, params) => {
  let error = null;
  let info = null;
  try {
    const extrinsic = await quadraticFunding.cancel(params);
    const response = await QuadraticFunding.signAndSubscribeExtrinsic(
      extrinsic, quadraticFunding.sudoOrigin, ExtrinsicsTypes.cancel,
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

const cancelRound = async (quadraticFunding, params) => {
  let error = null;
  let response = null;
  try {
    const extrinsic = await quadraticFunding.cancelRound(params);
    response = await QuadraticFunding.signAndSubscribeExtrinsic(
      extrinsic, quadraticFunding.sudoOrigin, ExtrinsicsTypes.cancelRound,
    ).catch((err) => {
      error = err;
    });
  } catch (err) {
    error = err;
  }

  return { error, roundCanceled: !_.isEmpty(response) };
};

const contribute = async (quadraticFunding, params) => {
  let error = null;
  let info = null;
  try {
    const extrinsic = await quadraticFunding.contribute(params);
    const response = await QuadraticFunding.signAndSubscribeExtrinsic(
      extrinsic, quadraticFunding.userOrigin, ExtrinsicsTypes.contribute,
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

const finalizeRound = async (quadraticFunding, params) => {
  let error = null;
  let response = null;
  try {
    const extrinsic = await quadraticFunding.finalizeRound(params);
    response = await QuadraticFunding.signAndSubscribeExtrinsic(
      extrinsic, quadraticFunding.sudoOrigin, ExtrinsicsTypes.finalizeRound,
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

const approve = async (quadraticFunding, params) => {
  let error = null;
  let info = null;
  try {
    const extrinsic = await quadraticFunding.approve(params);
    const response = await QuadraticFunding.signAndSubscribeExtrinsic(
      extrinsic, quadraticFunding.sudoOrigin, ExtrinsicsTypes.approve,
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

const withdraw = async (quadraticFunding, params) => {
  let error = null;
  let info = null;
  try {
    const extrinsic = await quadraticFunding.withdraw(params);
    const response = await QuadraticFunding.signAndSubscribeExtrinsic(
      extrinsic, quadraticFunding.projectOrigin, ExtrinsicsTypes.withdraw,
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

const cleanRound = async (quadraticFunding) => {
  const currentBlockNumber = await quadraticFunding.getCurrentBlockNumber();
  const roundCount = await quadraticFunding.getGrantRoundCount();
  if (roundCount) {
    const roundIndex = roundCount - 1;
    const response = await quadraticFunding.getGrantRoundInfo(roundIndex);
    const start = Number(response.toHuman().start.replace(',', ''));
    const end = Number(response.toHuman().end.replace(',', ''));

    if (currentBlockNumber >= start - confirmBlocks && currentBlockNumber < end) {
      // If the round is start but not ended
      // Why start - confirmBlocks? Because cancel round need send a extrinsic and wait for some blocks to finalized
      await quadraticFunding.waitForBlockNumber(end);
    } else if (currentBlockNumber < start - confirmBlocks) {
      // If round is not start, cancel this round
      await cancelRound(quadraticFunding, { roundIndex });
    }
  }
};

// Fund before run the test cases
const preFund = async (quadraticFunding) => {
  await fund(quadraticFunding, { fundBalance: fundAmount });
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
  preFund,
};
