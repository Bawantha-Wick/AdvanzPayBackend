import { Request, Response, NextFunction } from 'express';
import AppDataSource from '../data-source';
import Corporate from '../entity/Corporate';
import AdUser from '../entity/AdUser';
import CorpEmp from '../entity/CorpEmp';
import CorpUser from '../entity/CorpUser';
import constant from '../constant';
import response from '../constant/response';
import responseFormatter from '../helper/response/responseFormatter';
import { verifyAccessToken } from '../helper/user/tokenHandler';

const messages = response.MESSAGES;
const excludedPaths = constant.AUTH_EXCLUDED_PATHS;
// const userStatus = constant.USER_STATUS;
// const userTypes = constant.USER_TYPES;
// const userRepository = AppDataSource.getRepository(User);
// const userTokenRepository = AppDataSource.getRepository(UserToken);

// adding userData as a custom parameter to the request header
declare global {
  namespace Express {
    export interface Request {
      user_code?: string;
      user?: CorpUser | CorpEmp | AdUser;
      corp?: Corporate;
    }
  }
}

const Authorizer = () => async (request: Request, response: Response, next: NextFunction) => {
  try {
    const isExcludedRoute: boolean = excludedPaths.some((substring) => request.path.includes(substring));

    if (isExcludedRoute) return next();

    const token = request.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return responseFormatter.error(request, response, { statusCode: 401, status: false, message: messages.UNAUTHORIZED });
    }

    const decodedData = verifyAccessToken(token);

    if (!decodedData) {
      return responseFormatter.error(request, response, { statusCode: 401, status: false, message: messages.UNAUTHORIZED });
    }

    request.user_code = decodedData['user_code'];
    const user_type = decodedData['type'];
    const user =
      user_type === 'ADMIN'
        ? await AppDataSource.getRepository(AdUser).findOne({
            where: { adUserId: Number(decodedData['user_code']) }
          })
        : user_type === 'CORP'
        ? await AppDataSource.getRepository(CorpUser).findOne({
            where: { corpUsrId: Number(decodedData['user_code']) },
            relations: ['corpId']
          })
        : await AppDataSource.getRepository(CorpEmp).findOne({
            where: { corpEmpId: Number(decodedData['user_code']) },
            relations: ['corpId']
          });

    request.user = user;
    request.corp = user_type === 'ADMIN' ? undefined : (user as CorpUser | CorpEmp).corpId;

    // const user = await userRepository.findOneBy({
    //   userCode: decodedData['user_code']
    // });

    // if (!user || (user && user.userStatus !== userStatus.APPROVED)) {
    //   return responseFormatter.error(request, response, { statusCode: 401, status: false, message: messages.USER_UNAUTHORIZED });
    // }

    // // verification is only checking for admin users
    // if (user.userType === userTypes.ADMIN && !user.userIsVerified) {
    //   return responseFormatter.error(request, response, { statusCode: 401, status: false, message: messages.USER_UNAUTHORIZED });
    // }

    // const userToken = await userTokenRepository.findOneBy({ userId: user.userId });

    // if (!userToken) {
    //   return responseFormatter.error(request, response, { statusCode: 401, status: false, message: messages.USER_UNAUTHORIZED });
    // }

    // request.userData = user;
    next();
  } catch (error) {
    console.error(error);
    return responseFormatter.error(request, response, { statusCode: 500, status: false, message: messages.INTERNAL_SERVER_ERROR });
  }
};

export default Authorizer;
