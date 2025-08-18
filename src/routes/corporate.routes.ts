import CorpController from '../controller/corporate/CorpController';
import ExcelController from '../controller/corporate/ExcelController';
import EmployeeBulkController from '../controller/corporate/EmployeeBulkController';
import config from '../config';

const basePath = config.API_BASE_PATH + '/corp';

const corpController = new CorpController();
const excelController = new ExcelController();
const employeeBulkController = new EmployeeBulkController();

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
  }
];

export default CorporateRoutes;
