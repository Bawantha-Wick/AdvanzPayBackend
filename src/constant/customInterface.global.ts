declare global {
  var tablePrefix: string;

  function getSystemTimestamp(): string;

  function isValidPassword(password: string): boolean;
}

globalThis.tablePrefix = 'apt_';

globalThis.getSystemTimestamp = (): string => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo' })).toISOString();

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

globalThis.isValidPassword = (password: string): boolean => passwordRegex.test(password);

export default global;
