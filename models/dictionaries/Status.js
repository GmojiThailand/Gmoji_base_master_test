'use strict';

let statuses = getStatuses();

function getStatuses(string) {
  return {
    ACTIVE: '598d9bac47217f28ba69e0f5',
    SPENT: '598d9bb147217f28ba69e0fc',
    OVERDUE: '598d9bba47217f28ba69e0fd',
    DELETED: '598d9ff947217f28ba69e10a',
    PENDING: '5a144d9f9f272c123aacf330',
    DEACTIVATED: '5a144de29f272c123aacf331',
    LOCK: '5a154ec09f272c123aacf4e1',
  };
};

module.exports = statuses;
