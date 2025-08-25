import config from '../config';
import EmployeeController from '../controller/employee/EmployeeController';

const basePath = config.API_BASE_PATH + '/corp-emp';
const employeeController = new EmployeeController();

const CorpEmpRoutes = [
  {
    method: 'get',
    route: basePath,
    controller: EmployeeController,
    action: employeeController.get.bind(employeeController)
  },

  {
    method: 'post',
    route: basePath,
    controller: EmployeeController,
    action: employeeController.create.bind(employeeController)
    // middlewares: [validateCreateCorpUser]
  },

  {
    method: 'put',
    route: basePath,
    controller: EmployeeController,
    action: employeeController.update.bind(employeeController)
    // middlewares: [validateUpdateCorpUser]
  },

  {
    method: 'post',
    route: basePath + '/signup',
    controller: EmployeeController,
    action: employeeController.signup.bind(employeeController)
    // middlewares: [validateCreateCorpUser]
  },

  {
    method: 'post',
    route: basePath + '/login',
    controller: EmployeeController,
    action: employeeController.login.bind(employeeController)
    // middlewares: [validateCreateCorpUser]
  },

  {
    method: 'put',
    route: basePath + '/toggle-status',
    controller: EmployeeController,
    action: employeeController.toggleStatus.bind(employeeController)
  },

  {
    method: 'put',
    route: basePath + '/setPwd',
    controller: EmployeeController,
    action: employeeController.setPwd.bind(employeeController)
  },

  {
    method: 'post',
    route: basePath + '/support',
    controller: EmployeeController,
    action: employeeController.sendSupport.bind(employeeController)
  }
];

export default CorpEmpRoutes;
