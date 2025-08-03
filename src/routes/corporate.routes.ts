import CorpController from '../controller/corporate/CorpController';
import config from '../config';

const basePath = config.API_BASE_PATH + '/corp';

const corpController = new CorpController();

const CorporateRoutes = [
  {
    method: 'get',
    route: basePath,
    controller: CorpController,
    action: corpController.get.bind(corpController)
  },

  {
    method: 'post',
    route: basePath,
    controller: CorpController,
    action: corpController.create.bind(corpController)
  },

  {
    method: 'put',
    route: basePath,
    controller: CorpController,
    action: corpController.update.bind(corpController)
  }
];

export default CorporateRoutes;
