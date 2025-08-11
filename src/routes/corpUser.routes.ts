import config from '../config';
import CorpUserController from '../controller/corporate/CorpUserController';

const basePath = config.API_BASE_PATH + '/corp-user';
const corpUserController = new CorpUserController();

const CorpUserRoutes = [
  {
    method: 'get',
    route: basePath,
    controller: CorpUserController,
    action: corpUserController.get.bind(corpUserController)
  },

  {
    method: 'post',
    route: basePath,
    controller: CorpUserController,
    action: corpUserController.create.bind(corpUserController)
    // middlewares: [validateCreateCorpUser]
  },

  {
    method: 'put',
    route: basePath,
    controller: CorpUserController,
    action: corpUserController.update.bind(corpUserController)
    // middlewares: [validateUpdateCorpUser]
  },

  {
    method: 'post',
    route: basePath + '/login',
    controller: CorpUserController,
    action: corpUserController.login.bind(corpUserController)
  },

  {
    method: 'post',
    route: basePath + '/refresh-token',
    controller: CorpUserController,
    action: corpUserController.refreshToken.bind(corpUserController)
  },

  {
    method: 'put',
    route: basePath + '/toggle-status',
    controller: CorpUserController,
    action: corpUserController.toggleStatus.bind(corpUserController)
  }
];

export default CorpUserRoutes;
