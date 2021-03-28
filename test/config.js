/* eslint-disable max-len */
module.exports = {
  endpoint: 'ws://127.0.0.1:9944',
  phrase: 'spider orange arena large bench input south tornado cost imitate shift sentence', // This account just for test
  types: {
    ProjectIndex: 'u32',
    ProjectOf: 'Project',
    GrantRoundIndex: 'u32',
    GrantRoundOf: 'GrantRound',
    GrantRound: {
      start: 'BlockNumber',
      end: 'BlockNumber',
      matching_fund: 'Balance',
      grants: 'Vec<Grant>',
      funder: 'AccountId',
    },
    Grant: {
      project_index: 'ProjectIndex',
      contributions: 'Vec<Contribution>',
      is_allowed_withdraw: 'bool',
      is_canceled: 'bool',
      is_withdrawn: 'bool',
    },
    Contribution: {
      account_id: 'AccountId',
      value: 'Balance',
    },
    Project: {
      name: 'Vec<u8>',
      logo: 'Vec<u8>',
      description: 'Vec<u8>',
      website: 'Vec<u8>',
      owner: 'AccountId',
    },
  },
  rpc: {
    getProjects: {
      description: 'getProjects',
      params: [],
      type: 'Vec<Project>',
    },
  },
};
