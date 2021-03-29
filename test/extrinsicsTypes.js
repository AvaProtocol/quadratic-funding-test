const ExtrinsicsTypes = {
  createProject: { method: 'createProject', event: 'ProjectCreated' },
  scheduleRound: { method: 'scheduleRound', event: 'GrantRoundCreated' },
  contribute: { method: 'contribute', event: 'ContributeSucceed' },
  allowWithdraw: { method: 'allowWithdraw', event: 'GrantAllowedWithdraw' },
  withdraw: { method: 'withdraw', event: 'GrantWithdrawn' },
  cancel: { method: 'cancel', event: 'GrantCanceled' },
  cancelRound: { method: 'cancelRound', event: 'RoundCanceled' },
};

module.exports = ExtrinsicsTypes;
