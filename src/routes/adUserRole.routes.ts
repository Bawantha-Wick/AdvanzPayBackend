import config from '../config';
import AdUserRoleController from '../controller/admin/AdUserRoleController';

const basePath = config.API_BASE_PATH + '/ad-user-role';
const adUserRoleController = new AdUserRoleController();

const AdUserRoleRoutes = [
  {
    method: 'get',
    route: basePath + '/dd',
    controller: AdUserRoleController,
    action: adUserRoleController.getAll.bind(adUserRoleController)
  },

  {
    method: 'get',
    route: basePath,
    controller: AdUserRoleController,
    action: adUserRoleController.get.bind(adUserRoleController)
  },

  {
    method: 'post',
    route: basePath,
    controller: AdUserRoleController,
    action: adUserRoleController.create.bind(adUserRoleController)
    // middlewares: [validateCreateAdUserRole]
  },

  {
    method: 'put',
    route: basePath,
    controller: AdUserRoleController,
    action: adUserRoleController.update.bind(adUserRoleController)
    // middlewares: [validateUpdateAdUserRole]
  }
];

export default AdUserRoleRoutes;
