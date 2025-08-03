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
  }
];

export default CorpEmpRoutes;
