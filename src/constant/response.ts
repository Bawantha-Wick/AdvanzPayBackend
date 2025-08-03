const constants = {
  CODES: {
    SUCCESS: 'SUCCESS',
    ERROR: 'ERROR'
  },
  MESSAGES: {
    // General
    SUCCESS_MESSAGE: 'Success',
    INVALID_TOKEN: 'Invalid token',
    UPDATE_SUCCESS: 'Update successfully',
    RETRIEVED_SUCCESS: 'Data retrieved successfully',
    INTERNAL_SERVER_ERROR: 'Something went wrong!',
    INVALID_CREDENTIALS: 'Invalid credentials',

    // CorpUser specific messages
    CORP_USER_CREATED: 'Corporate user created successfully',
    CORP_USER_UPDATED: 'Corporate user updated successfully',
    CORP_USER_DELETED: 'Corporate user deleted successfully',
    CORP_USER_NOT_FOUND: 'Corporate user not found',
    CORP_USER_ALREADY_EXISTS: 'Corporate user already exists',
    CORP_USER_LIST_RETRIEVED: 'Corporate users retrieved successfully',
    CORP_USER_EMAIL_MOBILE_EXISTS: 'User with this email or mobile already exists in the corporate',
    CORP_USER_LOGIN_SUCCESS: 'Corporate user logged in successfully',

    // Corporate specific messages
    CORPORATE_NOT_FOUND: 'Corporate not found',
    CORPORATE_USER_ROLE_NOT_FOUND: 'Corporate user role not found',
    CORPORATE_CREATED: 'Corporate created successfully',
    CORPORATE_UPDATED: 'Corporate updated successfully',
    CORPORATE_DELETED: 'Corporate deleted successfully',
    CORPORATE_ALREADY_EXISTS: 'Corporate with this name already exists',
    CORPORATE_NAME_EXISTS: 'Corporate with this name already exists',
    CORPORATE_LIST_RETRIEVED: 'Corporates retrieved successfully',

    // Employee specific messages
    EMPLOYEE_CREATED: 'Employee created successfully',
    EMPLOYEE_UPDATED: 'Employee updated successfully',
    EMPLOYEE_DELETED: 'Employee deleted successfully',
    EMPLOYEE_NOT_FOUND: 'Employee not found',
    EMPLOYEE_ALREADY_EXISTS: 'Employee already exists',
    EMPLOYEE_LIST_RETRIEVED: 'Employees retrieved successfully',
    EMPLOYEE_EMAIL_MOBILE_EXISTS: 'Employee with this email or mobile already exists in the corporate',
    EMPLOYEE_LOGIN_SUCCESS: 'Employee logged in successfully'
  }
};

export default Object.freeze(constants);
