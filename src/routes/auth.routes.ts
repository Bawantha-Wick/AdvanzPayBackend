import config from '../config';
import AuthController from '../controller/auth/AuthController';

const basePath = config.API_BASE_PATH + '/auth';
const authController = new AuthController();

const AuthRoutes = [
  {
    method: 'post',
    route: basePath + '/login',
    controller: AuthController,
    action: authController.login.bind(authController)
  },

  {
    method: 'post',
    route: basePath + '/signup',
    controller: AuthController,
    action: authController.signup.bind(authController)
  },

  {
    method: 'post',
    route: basePath + '/forgot-password',
    controller: AuthController,
    action: authController.forgotPassword.bind(authController)
  },

  {
    method: 'post',
    route: basePath + '/verify-otp',
    controller: AuthController,
    action: authController.verifyOtp.bind(authController)
  },

  {
    method: 'post',
    route: basePath + '/resend-otp',
    controller: AuthController,
    action: authController.resendOtp.bind(authController)
  },

  {
    method: 'post',
    route: basePath + '/reset-password',
    controller: AuthController,
    action: authController.resetPassword.bind(authController)
  },

  {
    method: 'post',
    route: basePath + '/logout',
    controller: AuthController,
    action: authController.logout.bind(authController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'post',
    route: basePath + '/refresh',
    controller: AuthController,
    action: authController.refresh.bind(authController)
  },

  {
    method: 'post',
    route: basePath + '/change-password',
    controller: AuthController,
    action: authController.changePassword.bind(authController)
    // middlewares: [authMiddleware]
  }
];

export default AuthRoutes;
