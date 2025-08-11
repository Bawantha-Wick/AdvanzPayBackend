import config from '../config';
import BankAccountController from '../controller/bankAccount/BankAccountController';

const basePath = config.API_BASE_PATH + '/corp-emp/bank-accountsz';
const bankAccountController = new BankAccountController();

const BankAccountRoutes = [
  {
    method: 'get',
    route: basePath,
    controller: BankAccountController,
    action: bankAccountController.get.bind(bankAccountController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'get',
    route: basePath + '/:id',
    controller: BankAccountController,
    action: bankAccountController.getById.bind(bankAccountController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'post',
    route: basePath,
    controller: BankAccountController,
    action: bankAccountController.create.bind(bankAccountController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'put',
    route: basePath + '/:id',
    controller: BankAccountController,
    action: bankAccountController.update.bind(bankAccountController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'delete',
    route: basePath + '/:id',
    controller: BankAccountController,
    action: bankAccountController.delete.bind(bankAccountController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'put',
    route: basePath + '/:id/set-default',
    controller: BankAccountController,
    action: bankAccountController.setDefault.bind(bankAccountController)
    // middlewares: [authMiddleware]
  }
];

export default BankAccountRoutes;
