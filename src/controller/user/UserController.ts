import { MoreThan } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import * as moment from 'moment';
import { AppDataSource } from '../../data-source';
import { User } from '../../entity/User';
import { UserToken } from '../../entity/UserToken';
import config from '../../config';
import constant from '../../constant';
import response from '../../constant/response';

export class UserController {
  private userRepository = AppDataSource.getRepository(User);
  private userTokenRepository = AppDataSource.getRepository(UserToken);
  private codes = response.CODES;
  private messages = response.MESSAGES;
}
