import config from '../config';
import UserController from '../controller/user/UserController';

const basePath = config.API_BASE_PATH + '/corp-emp/user';
const userController = new UserController();

const UserProfileRoutes = [
  {
    method: 'get',
    route: basePath + '/profile',
    controller: UserController,
    action: userController.getProfile.bind(userController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'put',
    route: basePath + '/profile',
    controller: UserController,
    action: userController.updateProfile.bind(userController)
    // middlewares: [authMiddleware]
  }
];

export default UserProfileRoutes;
