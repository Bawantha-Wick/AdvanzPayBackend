import constant from './';
declare global {
  var tablePrefix: string;
  var pageLimit: number;

  var activeId: number;
  var activeTag: string;
  var activeDescription: string;
  var inactiveId: number;
  var inactiveTag: string;
  var inactiveDescription: string;
  var blockedId: number;
  var blockedTag: string;
  var blockedDescription: string;

  interface CountResultInt {
    total: number;
  }

  function getSystemTimestamp(): string;

  function isValidPassword(password: string): boolean;

  function isEmptyString(value: string): boolean;
}

globalThis.tablePrefix = 'apt_';

globalThis.pageLimit = 8;

globalThis.activeId = constant.STATUS.ACTIVE.ID;
globalThis.activeTag = constant.STATUS.ACTIVE.TAG;
globalThis.activeDescription = constant.STATUS.ACTIVE.DESCRIPTION;
globalThis.inactiveId = constant.STATUS.INACTIVE.ID;
globalThis.inactiveTag = constant.STATUS.INACTIVE.TAG;
globalThis.inactiveDescription = constant.STATUS.INACTIVE.DESCRIPTION;
globalThis.blockedId = constant.STATUS.BLOCKED.ID;
globalThis.blockedTag = constant.STATUS.BLOCKED.TAG;
globalThis.blockedDescription = constant.STATUS.BLOCKED.DESCRIPTION;

globalThis.getSystemTimestamp = (): string => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' })).toISOString();

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

globalThis.isValidPassword = (password: string): boolean => passwordRegex.test(password);

globalThis.isEmptyString = (value: string): boolean => !value || value.trim() === '';

export default global;
