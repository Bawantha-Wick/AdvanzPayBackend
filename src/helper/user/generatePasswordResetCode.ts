import * as crypto from 'crypto';
import AppDataSource from '../../data-source';
import CorpUser from '../../entity/CorpUser';

const userRepository = AppDataSource.getRepository(CorpUser);

const generateRandomString = (len: number): string => {
  return crypto.randomBytes(len).toString('hex').toUpperCase();
};

export default async () => {
  let userPwResetToken: string = generateRandomString(15);

  let existingUser = await userRepository.findOne({ where: {} });

  let count = 0;
  while (existingUser) {
    const len = count < 6 ? 10 : 15;
    userPwResetToken = generateRandomString(len);
    existingUser = await userRepository.findOne({ where: {} });
    count += 1;
  }

  return userPwResetToken;
};
