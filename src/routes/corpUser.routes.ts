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
  }
];

export default CorpUserRoutes;
