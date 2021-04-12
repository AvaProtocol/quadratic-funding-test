const ExtrinsicsTypes = {
  fund: { method: 'fund', event: 'FundSucceed' },
  createProject: { method: 'createProject', event: 'ProjectCreated' },
  scheduleRound: { method: 'scheduleRound', event: 'RoundCreated' },
  contribute: { method: 'contribute', event: 'ContributeSucceed' },
  finalizeRound: { method: 'finalizeRound', event: 'Finalize' },
  approve: { method: 'approve', event: 'GrantApproved' },
  withdraw: { method: 'withdraw', event: 'GrantWithdrawn' },
  cancel: { method: 'cancel', event: 'GrantCanceled' },
  cancelRound: { method: 'cancelRound', event: 'RoundCanceled' },
};

module.exports = ExtrinsicsTypes;
