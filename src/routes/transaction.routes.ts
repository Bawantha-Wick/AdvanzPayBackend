import config from '../config';
import TransactionController from '../controller/transaction/TransactionController';

const basePath = config.API_BASE_PATH + '/corp-emp/transactions';
const transactionController = new TransactionController();

const TransactionRoutes = [
  {
    method: 'get',
    route: basePath,
    controller: TransactionController,
    action: transactionController.get.bind(transactionController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'get',
    route: basePath + '/recent',
    controller: TransactionController,
    action: transactionController.getRecent.bind(transactionController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'get',
    route: basePath + '/search',
    controller: TransactionController,
    action: transactionController.search.bind(transactionController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'get',
    route: basePath + '/:id',
    controller: TransactionController,
    action: transactionController.getById.bind(transactionController)
    // middlewares: [authMiddleware]
  }
];

export default TransactionRoutes;
