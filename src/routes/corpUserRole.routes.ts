import config from '../config';
import CorpUserRoleController from '../controller/corporate/CorpUserRoleController';

const basePath = config.API_BASE_PATH + '/corp-user-role';
const corpUserRoleController = new CorpUserRoleController();

const CorpUserRoleRoutes = [
  {
    method: 'get',
    route: basePath + '/dd',
    controller: CorpUserRoleController,
    action: corpUserRoleController.getAll.bind(corpUserRoleController)
  },

  {
    method: 'get',
    route: basePath,
    controller: CorpUserRoleController,
    action: corpUserRoleController.get.bind(corpUserRoleController)
  },

  {
    method: 'post',
    route: basePath,
    controller: CorpUserRoleController,
    action: corpUserRoleController.create.bind(corpUserRoleController)
    // middlewares: [validateCreateCorpUserRole]
  },

  {
    method: 'put',
    route: basePath,
    controller: CorpUserRoleController,
    action: corpUserRoleController.update.bind(corpUserRoleController)
    // middlewares: [validateUpdateCorpUserRole]
  }
];

export default CorpUserRoleRoutes;
