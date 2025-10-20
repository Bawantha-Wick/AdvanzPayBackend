import constant from '.';

enum STATUS_ENUM {
  ACTIVE = constant.STATUS.ACTIVE.ID,
  INACTIVE = constant.STATUS.INACTIVE.ID,
  BLOCKED = constant.STATUS.BLOCKED.ID
}

enum PAY_TYPE_ENUM {
  MONTHLY = constant.PAY_TYPE.MONTHLY.ID,
  HOURLY = constant.PAY_TYPE.HOURLY.ID
}

export {
  STATUS_ENUM,
  PAY_TYPE_ENUM
  //
};
