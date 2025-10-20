const constants = {
  PASSWORD_VALIDATION_REGEX: /(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[\d])(?=.*?[^\sa-zA-Z0-9]).{8,}/,

  STATUS: {
    ACTIVE: {
      ID: 1,
      TAG: 'ACTV',
      DESCRIPTION: 'Active'
    },
    INACTIVE: {
      ID: 2,
      TAG: 'INAC',
      DESCRIPTION: 'Inactive'
    },
    BLOCKED: {
      ID: 3,
      TAG: 'BLKD',
      DESCRIPTION: 'Blocked'
    }
  },

  PAY_TYPE: {
    MONTHLY: {
      ID: 1,
      TAG: 'MNTH',
      DESCRIPTION: 'Monthly'
    },
    HOURLY: {
      ID: 2,
      TAG: 'HRLY',
      DESCRIPTION: 'Hourly'
    }
  },

  AUTH_EXCLUDED_PATHS: [
    '/signup',
    '/login',
    'refresh-token'
    //
  ]
} as const;

export default Object.freeze(constants);
