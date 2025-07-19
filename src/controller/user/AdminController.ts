import { MoreThan } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import * as moment from 'moment';
import { AppDataSource } from '../../data-source';
import AdUser from '../../entity/AdUser';
import  AdUserToken  from '../../entity/AdUserLogin';
import config from '../../config';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';


export default class AdminController {
  private AdUserRepo = AppDataSource.getRepository(AdUser);
  private AdUserTokenRepo = AppDataSource.getRepository(AdUserToken);
  private codes = response.CODES;
  private messages = response.MESSAGES;


  // async login(req: Request, res: Response, next: NextFunction) {
    
  //   try {
  //     const { email, password } = req.body;

  //     const user = await this.AdUserRepo.findOne({
  //       where: {
  //         adUserEmail: email,
  //         adUserPassword: password,
  //         adUserStatus: constant.STATUS.ACTIVE.ID,
  //       }
  //     });

  //     if (!user) {
  //       return responseFormatter.error(req, res, { statusCode: 401, tag: false,  message: this.messages.USER_NOT_FOUND });
  //     }

  //     const token = await this.AdUserTokenRepo.findOne({
  //       where: {
  //         adUserId: user.adUserId,
  //         adUserTokenCreatedDate: MoreThan(moment().subtract(1, 'days').toDate())
  //       }
  //     });

  //     if (token) {
  //       return responseFormatter.error(res, this.codes.ERROR, this.messages.USER_ALREADY_LOGGED_IN);
  //     }

  //     const newToken = new AdUserToken();
  //     newToken.adUserId = user.adUserId;
  //     newToken.adUserRefreshToken = password; // This should be a generated token
  //     await this.AdUserTokenRepo.save(newToken);

  //     return responseFormatter.success(res, this.codes.ERROR, this.messages.LOGIN_SUCCESS, { token: newToken });
  //   } catch (error) {
  //     return responseFormatter.error(res, this.codes.ERROR, this.messages.INTERNAL_SERVER_ERROR);
  //   }

  // }
}
