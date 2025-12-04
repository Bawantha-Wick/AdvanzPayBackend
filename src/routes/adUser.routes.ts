import config from '../config';
import AdUserController from '../controller/admin/AdUserController';

const basePath = config.API_BASE_PATH + '/ad-user';
const adUserController = new AdUserController();

const AdUserRoutes = [
  {
    method: 'get',
    route: basePath,
    controller: AdUserController,
    action: adUserController.get.bind(adUserController)
  },

  {
    method: 'post',
    route: basePath,
    controller: AdUserController,
    action: adUserController.create.bind(adUserController)
    // middlewares: [validateCreateAdUser]
  },

  {
    method: 'put',
    route: basePath,
    controller: AdUserController,
    action: adUserController.update.bind(adUserController)
    // middlewares: [validateUpdateAdUser]
  },

  {
    method: 'post',
    route: basePath + '/login',
    controller: AdUserController,
    action: adUserController.login.bind(adUserController)
  },

  {
    method: 'post',
    route: basePath + '/refresh-token',
    controller: AdUserController,
    action: adUserController.refreshToken.bind(adUserController)
  },

  {
    method: 'post',
    route: basePath + '/signup',
    controller: AdUserController,
    action: adUserController.signup.bind(adUserController)
  },

  {
    method: 'put',
    route: basePath + '/toggle-status',
    controller: AdUserController,
    action: adUserController.toggleStatus.bind(adUserController)
  }
];

export default AdUserRoutes;
