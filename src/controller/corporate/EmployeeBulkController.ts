import { NextFunction, Request, Response } from 'express';
import AppDataSource from '../../data-source';
import Corporate from '../../entity/Corporate';
import CorpEmp from '../../entity/CorpEmp';
import BankAccount from '../../entity/BankAccount';
import config from '../../config';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';
import { hashPassword } from '../../helper/user/passwordHandler';

interface BulkEmployeeData {
  id: string;
  name: string;
  email: string;
  mobile: string;
  basicSalAmt: number;
  accNo: string;
  accName: string;
  accBank: string;
  accBranch: string;
}

interface BulkCreateRequest {
  employees: BulkEmployeeData[];
  corpId?: number;
}

interface BulkCreateResult {
  successful: BulkEmployeeData[];
  failed: {
    employee: BulkEmployeeData;
    reason: string;
  }[];
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export default class EmployeeBulkController {
  private CorpEmpRepo = AppDataSource.getRepository(CorpEmp);
  private CorporateRepo = AppDataSource.getRepository(Corporate);
  private BankAccountRepo = AppDataSource.getRepository(BankAccount);
  private codes = response.CODES;
  private messages = response.MESSAGES;
  private status = constant.STATUS;

  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const { employees }: BulkCreateRequest = req.body;
      const corpEmpCreatedBy = 1; // This should come from authenticated user context

      const corp = req.corp;

      //   console.log('Corporate from request:', corp.corpId);

      const corpId = corp.corpId;

      // Validate request structure
      if (!employees || !Array.isArray(employees) || employees.length === 0) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Invalid request: employees array is required and must not be empty'
        });
      }

      // Get corporate ID - either from body or extract from context/auth
      let targetCorpId = corpId;
      if (!targetCorpId) {
        // You might want to get this from authenticated user context
        // For now, we'll require it in the request
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Corporate ID is required'
        });
      }

      // Verify corporate exists
      const corporate = await this.CorporateRepo.findOne({
        where: { corpId: targetCorpId }
      });

      if (!corporate) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.CORPORATE_NOT_FOUND
        });
      }

      const result: BulkCreateResult = {
        successful: [],
        failed: [],
        summary: {
          total: employees.length,
          successful: 0,
          failed: 0
        }
      };

      // Process each employee
      for (const employeeData of employees) {
        try {
          await this.createSingleEmployee(employeeData, corporate, corpEmpCreatedBy);
          result.successful.push(employeeData);
          result.summary.successful++;
        } catch (error) {
          result.failed.push({
            employee: employeeData,
            reason: error instanceof Error ? error.message : 'Unknown error occurred'
          });
          result.summary.failed++;
        }
      }

      // Determine response status based on results
      const statusCode = result.summary.failed === 0 ? 201 : result.summary.successful === 0 ? 400 : 207; // 207 = Multi-Status

      const message = result.summary.failed === 0 ? 'All employees created successfully' : result.summary.successful === 0 ? 'Failed to create any employees' : `Partial success: ${result.summary.successful} created, ${result.summary.failed} failed`;

      return responseFormatter.success(req, res, statusCode, result, true, this.codes.SUCCESS, message);
    } catch (error) {
      console.error('Error in bulk employee creation:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  private async createSingleEmployee(employeeData: BulkEmployeeData, corporate: Corporate, createdBy: number): Promise<CorpEmp> {
    // Validate required fields
    if (!employeeData.name || !employeeData.email) {
      throw new Error(`Missing required fields for employee: ${employeeData.id || 'unknown'}`);
    }

    // Check if employee already exists with same email in this corporate
    const existingEmployee = await this.CorpEmpRepo.findOne({
      where: {
        corpEmpEmail: employeeData.email,
        corpId: { corpId: corporate.corpId }
      }
    });

    if (existingEmployee) {
      throw new Error(`Employee with email ${employeeData.email} already exists in this corporate`);
    }

    // Check if mobile number already exists in this corporate (if provided)
    if (employeeData.mobile) {
      const existingMobile = await this.CorpEmpRepo.findOne({
        where: {
          corpEmpMobile: employeeData.mobile,
          corpId: { corpId: corporate.corpId }
        }
      });

      if (existingMobile) {
        throw new Error(`Employee with mobile ${employeeData.mobile} already exists in this corporate`);
      }
    }

    // Generate a default password (you might want to customize this)
    const defaultPassword = 'Pass@123'; // Consider generating random passwords
    const hashedPassword = await hashPassword(defaultPassword);

    // Create new employee
    const newCorpEmp = new CorpEmp();
    newCorpEmp.corpId = corporate;
    newCorpEmp.corpEmpName = employeeData.name;
    newCorpEmp.corpEmpEmail = employeeData.email;
    newCorpEmp.corpEmpPassword = hashedPassword;
    newCorpEmp.corpEmpMobile = employeeData.mobile || '';
    newCorpEmp.corpEmpBasicSalAmt = employeeData.basicSalAmt || 0;
    newCorpEmp.corpEmpMonthlyWtdAmt = 0;
    newCorpEmp.corpEmpMonthlyRmnAmt = employeeData.basicSalAmt ? employeeData.basicSalAmt / 2 : 0;
    newCorpEmp.corpEmpAccNo = employeeData.accNo || '';
    newCorpEmp.corpEmpAccName = employeeData.accName || '';
    newCorpEmp.corpEmpAccBank = employeeData.accBank || '';
    newCorpEmp.corpEmpAccBranch = employeeData.accBranch || '';
    newCorpEmp.corpEmpStatus = this.status.ACTIVE.ID; // Set as inactive initially
    newCorpEmp.corpEmpIsInitiallyApproved = false; // Requires approval
    newCorpEmp.corpEmpCreatedBy = createdBy;
    newCorpEmp.corpEmpLastUpdatedBy = createdBy;

    // Save to database
    const savedEmployee = await this.CorpEmpRepo.save(newCorpEmp);

    const newBankAccount = new BankAccount();
    newBankAccount.corpEmpId = savedEmployee;
    newBankAccount.accountNumber = employeeData.accNo || '';
    newBankAccount.holderName = employeeData.accName || '';
    newBankAccount.bankName = employeeData.accBank || '';
    newBankAccount.branch = 'N/A';
    newBankAccount.nickname = employeeData.name || '';
    newBankAccount.isDefault = true;
    newBankAccount.isActive = true;
    newBankAccount.status = this.status.ACTIVE.ID;
    newBankAccount.createdBy = 0;
    newBankAccount.lastUpdatedBy = 0;

    await this.BankAccountRepo.save(newBankAccount);

    return savedEmployee;
  }
}
