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
    UNAUTHORIZED: 'Unauthorized access',

    // Authentication specific messages
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    SIGNUP_SUCCESS: 'Account created successfully. Pending approval.',
    PASSWORD_RESET_SUCCESS: 'Password reset successfully',
    PASSWORD_CHANGED_SUCCESS: 'Password changed successfully',
    OTP_SENT_SUCCESS: 'OTP sent to your email',
    OTP_VERIFIED_SUCCESS: 'OTP verified successfully',
    OTP_RESENT_SUCCESS: 'OTP resent successfully',
    TOKEN_REFRESHED_SUCCESS: 'Token refreshed successfully',
    FORGOT_PASSWORD_REQUEST_SUCCESS: 'Password reset request sent successfully',

    // User Profile specific messages
    PROFILE_RETRIEVED: 'Profile retrieved successfully',
    PROFILE_UPDATED: 'Profile updated successfully',

    // Dashboard specific messages
    DASHBOARD_DATA_RETRIEVED: 'Dashboard data retrieved successfully',
    RECENT_TRANSACTIONS_RETRIEVED: 'Recent transactions retrieved successfully',

    // Bank Account specific messages
    BANK_ACCOUNT_CREATED: 'Bank account created successfully',
    BANK_ACCOUNT_UPDATED: 'Bank account updated successfully',
    BANK_ACCOUNT_DELETED: 'Bank account deleted successfully',
    BANK_ACCOUNT_NOT_FOUND: 'Bank account not found',
    BANK_ACCOUNTS_RETRIEVED: 'Bank accounts retrieved successfully',
    DEFAULT_ACCOUNT_SET: 'Default account set successfully',

    // Goal specific messages
    GOAL_CREATED: 'Goal created successfully',
    GOAL_UPDATED: 'Goal updated successfully',
    GOAL_DELETED: 'Goal deleted successfully',
    GOAL_NOT_FOUND: 'Goal not found',
    GOALS_RETRIEVED: 'Goals retrieved successfully',
    PRIORITY_GOALS_RETRIEVED: 'Priority goals retrieved successfully',
    GOAL_PROGRESS_UPDATED: 'Goal progress updated successfully',

    // Transaction specific messages
    TRANSACTIONS_RETRIEVED: 'Transactions retrieved successfully',
    TRANSACTION_RETRIEVED: 'Transaction retrieved successfully',
    TRANSACTION_NOT_FOUND: 'Transaction not found',

    // Withdrawal specific messages
    WITHDRAWAL_CREATED: 'Withdrawal request created successfully',
    WITHDRAWAL_CANCELLED: 'Withdrawal cancelled successfully',
    WITHDRAWAL_NOT_FOUND: 'Withdrawal not found',
    WITHDRAWALS_RETRIEVED: 'Withdrawals retrieved successfully',
    WITHDRAWAL_LIMITS_RETRIEVED: 'Withdrawal limits retrieved successfully',

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
    EMPLOYEE_LOGIN_SUCCESS: 'Employee logged in successfully',
    EMPLOYEE_SIGNUP_SUCCESS: 'Employee signed up successfully',
    EMPLOYEE_ACCOUNT_NOT_ACTIVE: 'Employee account is not active'
  }
};

export default Object.freeze(constants);
