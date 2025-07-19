import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../data-source';
// import { User } from '../entity/CorpUser';
// import { UserToken } from '../entity/UserToken';
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
      // userData?: User;
    }
  }
}

export const Authorizer = () => async (request: Request, response: Response, next: NextFunction) => {
  try {
    const isExcludedRoute: boolean = excludedPaths.some((substring) => request.path.includes(substring));

    if (isExcludedRoute) return next();

    const token = request.header('Authorization')?.replace('Bearer ', '');

    // if (!token) {
    //   return responseFormatter.error(request, response, { statusCode: 401, status: false, message: messages.USER_UNAUTHORIZED });
    // }

    // const decodedData = verifyAccessToken(token);

    // if (!decodedData) {
    //   return responseFormatter.error(request, response, { statusCode: 401, status: false, message: messages.USER_UNAUTHORIZED });
    // }

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
