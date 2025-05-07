import * as bcrypt from 'bcrypt';
import * as htmlEntities from 'html-entities';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(htmlEntities.encode(password), hashedPassword);
};
