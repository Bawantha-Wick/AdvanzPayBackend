import config from '../config';
import AdminController from '../controller/admin/AdminController';
import AdminAnalyticsController from '../controller/admin/AdminAnalyticsController';

const basePath = config.API_BASE_PATH + '/admin';
const adminController = new AdminController();
const analyticsController = new AdminAnalyticsController();

const AdminRoutes = [
  // Admin User Routes
  {
    method: 'get',
    route: basePath + '/users',
    controller: AdminController,
    action: adminController.getUsers.bind(adminController)
  },

  {
    method: 'get',
    route: basePath + '/users/:id',
    controller: AdminController,
    action: adminController.getUserById.bind(adminController)
  },

  {
    method: 'post',
    route: basePath + '/users',
    controller: AdminController,
    action: adminController.createUser.bind(adminController)
  },

  {
    method: 'put',
    route: basePath + '/users/:id',
    controller: AdminController,
    action: adminController.updateUser.bind(adminController)
  },

  {
    method: 'delete',
    route: basePath + '/users/:id',
    controller: AdminController,
    action: adminController.deleteUser.bind(adminController)
  },

  // Admin Role Routes
  {
    method: 'get',
    route: basePath + '/roles',
    controller: AdminController,
    action: adminController.getRoles.bind(adminController)
  },

  {
    method: 'get',
    route: basePath + '/roles/:id',
    controller: AdminController,
    action: adminController.getRoleById.bind(adminController)
  },

  {
    method: 'post',
    route: basePath + '/roles',
    controller: AdminController,
    action: adminController.createRole.bind(adminController)
  },

  {
    method: 'put',
    route: basePath + '/roles/:id',
    controller: AdminController,
    action: adminController.updateRole.bind(adminController)
  },

  {
    method: 'delete',
    route: basePath + '/roles/:id',
    controller: AdminController,
    action: adminController.deleteRole.bind(adminController)
  },

  // Authentication Routes
  {
    method: 'post',
    route: basePath + '/auth/login',
    controller: AdminController,
    action: adminController.login.bind(adminController)
  },

  {
    method: 'post',
    route: basePath + '/auth/refresh-token',
    controller: AdminController,
    action: adminController.refreshToken.bind(adminController)
  },

  {
    method: 'post',
    route: basePath + '/auth/signup',
    controller: AdminController,
    action: adminController.signup.bind(adminController)
  },

  // Analytics Routes
  {
    method: 'get',
    route: basePath + '/analytics/dashboard',
    controller: AdminAnalyticsController,
    action: analyticsController.getDashboard.bind(analyticsController)
  },

  {
    method: 'get',
    route: basePath + '/analytics/overview',
    controller: AdminAnalyticsController,
    action: analyticsController.getOverview.bind(analyticsController)
  },

  {
    method: 'get',
    route: basePath + '/analytics/recent-activity',
    controller: AdminAnalyticsController,
    action: analyticsController.getRecentActivity.bind(analyticsController)
  },

  {
    method: 'get',
    route: basePath + '/analytics/trends',
    controller: AdminAnalyticsController,
    action: analyticsController.getTrends.bind(analyticsController)
  }
];

export default AdminRoutes;
