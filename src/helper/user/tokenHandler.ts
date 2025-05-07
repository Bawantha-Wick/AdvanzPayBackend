import * as jwt from 'jsonwebtoken';

import config from '../../config';
const atSecretKey = config.ACCESS_TOKEN_SECRET;
const rtSecretKey = config.REFRESH_TOKEN_SECRET;
const accessTokenExpiration = config.ACCESS_TOKEN_EXPIRATION_TIME;
const refreshTokenExpiration = config.REFRESH_TOKEN_EXPIRATION_TIME;

interface TokenPayload {
  user_code: string;
}

export const createTokens = (user_code: string): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign({ user_code }, atSecretKey, { expiresIn: accessTokenExpiration });
  const refreshToken = jwt.sign({ user_code }, rtSecretKey, { expiresIn: refreshTokenExpiration });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (accessToken: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(accessToken, atSecretKey) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

export const decodeRefreshToken = (refreshToken: string): object | null => {
  try {
    const decoded = jwt.verify(refreshToken, rtSecretKey) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

export const refreshAccessToken = (refreshToken: string): string | null => {
  try {
    const decoded = jwt.verify(refreshToken, rtSecretKey) as TokenPayload;
    const newAccessToken = jwt.sign({ user_code: decoded.user_code }, atSecretKey, { expiresIn: accessTokenExpiration });
    return newAccessToken;
  } catch (error) {
    return null;
  }
};
