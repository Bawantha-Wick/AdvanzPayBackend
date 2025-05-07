const constants = {
  PASSWORD_VALIDATION_REGEX: /(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[\d])(?=.*?[^\sa-zA-Z0-9]).{8,}/,

  AUTH_EXCLUDED_PATHS: [
    '/signup',
    '/login'
    //
  ]
} as const;

export default Object.freeze(constants);
