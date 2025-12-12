import CorpController from '../controller/corporate/CorpController';
import ExcelController from '../controller/corporate/ExcelController';
import EmployeeBulkController from '../controller/corporate/EmployeeBulkController';
import CorpEmpTimeLogBulkController from '../controller/corporate/CorpEmpTimeLogBulkController';
import CorpTransactionController from '../controller/corporate/CorpTransactionController';
import config from '../config';

const basePath = config.API_BASE_PATH + '/corp';

const corpController = new CorpController();
const excelController = new ExcelController();
const employeeBulkController = new EmployeeBulkController();
const corpTransactionController = new CorpTransactionController();
const corpEmpTimeLogBulkController = new CorpEmpTimeLogBulkController();

const CorporateRoutes = [
  {
    method: 'get',
    route: basePath,
    controller: CorpController,
    action: corpController.get.bind(corpController)
  },

  {
    method: 'get',
    route: basePath + '/dd',
    controller: CorpController,
    action: corpController.dropdown.bind(corpController)
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
  },

  {
    method: 'get',
    route: basePath + '/analytics',
    controller: CorpController,
    action: corpController.analytics.bind(corpController)
  },

  // Excel routes
  {
    method: 'post',
    route: basePath + '/upload-employees',
    controller: ExcelController,
    action: excelController.handleUploadEmployeeExcel.bind(excelController)
  },

  {
    method: 'get',
    route: basePath + '/employee-template',
    controller: ExcelController,
    action: excelController.downloadTemplate.bind(excelController)
  },

  // Employee bulk operations
  {
    method: 'post',
    route: basePath + '/employees/bulk-create',
    controller: EmployeeBulkController,
    action: employeeBulkController.bulkCreate.bind(employeeBulkController)
  },

  // Employee time log bulk operations

  {
    method: 'get',
    route: basePath + '/time-logs',
    controller: CorpEmpTimeLogBulkController,
    action: corpEmpTimeLogBulkController.getTimeLogsByDateRange.bind(corpEmpTimeLogBulkController)
  },

  {
    method: 'post',
    route: basePath + '/employee-time-logs/bulk-create',
    controller: CorpEmpTimeLogBulkController,
    action: corpEmpTimeLogBulkController.bulkCreate.bind(corpEmpTimeLogBulkController)
  },

  // Transaction management routes
  {
    method: 'get',
    route: basePath + '/transactions',
    controller: CorpTransactionController,
    action: corpTransactionController.getTransactions.bind(corpTransactionController)
  },

  {
    method: 'get',
    route: basePath + '/transactions/all',
    controller: CorpTransactionController,
    action: corpTransactionController.getAllTransactions.bind(corpTransactionController)
  },

  {
    method: 'get',
    route: basePath + '/transactions/employee/:employeeId',
    controller: CorpTransactionController,
    action: corpTransactionController.getTransactionsByEmployee.bind(corpTransactionController)
  },

  {
    method: 'put',
    route: basePath + '/transactions/approve-reject',
    controller: CorpTransactionController,
    action: corpTransactionController.approveRejectTransaction.bind(corpTransactionController)
  }
];

export default CorporateRoutes;
