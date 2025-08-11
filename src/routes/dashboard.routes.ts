import config from '../config';
import DashboardController from '../controller/dashboard/DashboardController';
import TransactionController from '../controller/transaction/TransactionController';

const basePath = config.API_BASE_PATH + '/corp-emp/dashboard';
const dashboardController = new DashboardController();
const transactionController = new TransactionController();

const DashboardRoutes = [
  {
    method: 'get',
    route: basePath,
    controller: DashboardController,
    action: dashboardController.getDashboard.bind(dashboardController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'get',
    route: basePath + '/recent-transactions',
    controller: DashboardController,
    // action: dashboardController.getRecentTransactions.bind(dashboardController)
    action: transactionController.getRecent.bind(transactionController)
    // middlewares: [authMiddleware]
  }
];

export default DashboardRoutes;
