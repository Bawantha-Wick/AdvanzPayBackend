import config from '../config';
import WithdrawalController from '../controller/withdrawal/WithdrawalController';

const basePath = config.API_BASE_PATH + '/corp-emp/withdrawals';
const withdrawalController = new WithdrawalController();

const WithdrawalRoutes = [
  {
    method: 'post',
    route: basePath,
    controller: WithdrawalController,
    action: withdrawalController.create.bind(withdrawalController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'get',
    route: basePath,
    controller: WithdrawalController,
    action: withdrawalController.get.bind(withdrawalController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'get',
    route: basePath + '/limits',
    controller: WithdrawalController,
    action: withdrawalController.getLimits.bind(withdrawalController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'get',
    route: basePath + '/:id',
    controller: WithdrawalController,
    action: withdrawalController.getById.bind(withdrawalController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'put',
    route: basePath + '/:id/cancel',
    controller: WithdrawalController,
    action: withdrawalController.cancel.bind(withdrawalController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'post',
    route: basePath + '/deduction',
    controller: WithdrawalController,
    action: withdrawalController.getDeductionAmount.bind(withdrawalController)
    // middlewares: [authMiddleware]
  }
];

export default WithdrawalRoutes;
