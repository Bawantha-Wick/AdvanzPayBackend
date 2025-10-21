import { MoreThan } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import * as moment from 'moment';
import AppDataSource from '../../data-source';
import Corporate from '../../entity/Corporate';
import CorpEmp from '../../entity/CorpEmp';
import BankAccount from '../../entity/BankAccount';
import config from '../../config';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';
import { hashPassword, verifyPassword } from '../../helper/user/passwordHandler';
import { createTokens } from '../../helper/user/tokenHandler';

type CorpEmpTyp = InstanceType<typeof CorpEmp>;
type CorporateTyp = InstanceType<typeof Corporate>;

interface CorpEmpResultInt {
  id: number;
  name: string;
  email: string;
  mobile: string;
  basicSalAmt: number;
  accNo: string;
  accName: string;
  accBank: string;
  accBranch: string;
  status: string;
  cId: number;
  corp: string;
}

interface CountResultInt {
  total: number;
}

export default class EmployeeController {
  private CorpEmpRepo = AppDataSource.getRepository(CorpEmp);
  private CorporateRepo = AppDataSource.getRepository(Corporate);
  private BankAccountRepo = AppDataSource.getRepository(BankAccount);
  private codes = response.CODES;
  private messages = response.MESSAGES;
  private status = constant.STATUS;
  private payType = constant.PAY_TYPE;

  private activeId = this.status.ACTIVE.ID;
  private activeTag = this.status.ACTIVE.TAG;
  private activeDescription = this.status.ACTIVE.DESCRIPTION;
  private inactiveId = this.status.INACTIVE.ID;
  private inactiveTag = this.status.INACTIVE.TAG;
  private inactiveDescription = this.status.INACTIVE.DESCRIPTION;
  private blockedId = this.status.BLOCKED.ID;
  private blockedTag = this.status.BLOCKED.TAG;
  private blockedDescription = this.status.BLOCKED.DESCRIPTION;
  private monPayTypId = this.payType.MONTHLY.ID;
  private monPayTypTag = this.payType.MONTHLY.TAG;
  private monPayTypDescription = this.payType.MONTHLY.DESCRIPTION;
  private houPayTypId = this.payType.HOURLY.ID;
  private houPayTypTag = this.payType.HOURLY.TAG;
  private houPayTypDescription = this.payType.HOURLY.DESCRIPTION;

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, page } = req.query;

      console.log('User from request: ', req.corp?.corpId);

      const corpId = req.corp?.corpId;
      console.log('Corporate ID from request: ', corpId);

      const pageNo: number = page ? Number(page) : 1;
      const skip: number = (pageNo - 1) * pageLimit;

      let whereClause: string = `WHERE ce.corpId = ${Number(corpId)}`;
      if (!isEmptyString(search as string)) {
        whereClause += ` AND (ce.corpEmpName LIKE '%${search}%' OR ce.corpEmpEmail LIKE '%${search}%' OR ce.corpEmpMobile LIKE '%${search}%')`;
      }

      const countQuery: string = `
        SELECT COUNT(*) as total FROM apt_corp_emp ce ${whereClause}
      `;
      const countResult: CountResultInt[] = await AppDataSource.query(countQuery);
      const total: number = Number(countResult[0].total);

      const getQuery: string = `
        SELECT 
          ce.corpEmpId as no,
          ce.corpEmpName as name,
          ce.corpEmpEmail as email,
          ce.corpEmpMobile as mobile,
          ce.corpEmpBasicSalAmt as basicSalAmt,
          ce.corpEmpAccNo as accNo,
          ce.corpEmpAccName as accName,
          ce.corpEmpAccBank as accBank,
          ce.corpEmpAccBranch as accBranch,
          CASE
            WHEN ce.corpEmpIsInitiallyApproved THEN 0
            ELSE 1
          END as isNew,
          CASE 
            WHEN ce.corpEmpStatus = ${this.activeId} THEN '${this.activeTag}'
            WHEN ce.corpEmpStatus = ${this.inactiveId} THEN '${this.inactiveTag}'
            WHEN ce.corpEmpStatus = ${this.blockedId} THEN '${this.blockedTag}'
            ELSE 'Unknown'
          END as status, 
          CASE 
            WHEN ce.corpEmpStatus = ${this.activeId} THEN '${this.activeDescription}'
            WHEN ce.corpEmpStatus = ${this.inactiveId} THEN '${this.inactiveDescription}'
            WHEN ce.corpEmpStatus = ${this.blockedId} THEN '${this.blockedDescription}'
            ELSE 'Unknown'
          END as statusLabel,
          CASE 
            WHEN ce.corpEmpStatus = ${this.activeId} THEN '${this.activeTag}'
            WHEN ce.corpEmpStatus = ${this.inactiveId} THEN '${this.inactiveTag}'
            WHEN ce.corpEmpStatus = ${this.blockedId} THEN '${this.blockedTag}'
            ELSE 'Unknown'
          END as apStatus, 
          CASE 
            WHEN ce.corpEmpStatus = ${this.activeId} THEN '${this.activeDescription}'
            WHEN ce.corpEmpStatus = ${this.inactiveId} THEN '${this.inactiveDescription}'
            WHEN ce.corpEmpStatus = ${this.blockedId} THEN '${this.blockedDescription}'
            ELSE 'Unknown'
          END as apStatusLabel,
          CASE 
            WHEN ce.corpEmpPayType = ${this.monPayTypId} THEN '${this.monPayTypTag}'
            WHEN ce.corpEmpPayType = ${this.houPayTypId} THEN '${this.houPayTypTag}'
            ELSE '${this.monPayTypTag}'
          END as paymentType,
          CASE 
            WHEN ce.corpEmpPayType = ${this.monPayTypId} THEN '${this.monPayTypDescription}'
            WHEN ce.corpEmpPayType = ${this.houPayTypId} THEN '${this.houPayTypDescription}'
            ELSE '${this.monPayTypDescription}'
          END as paymentTypeLabel,
          ce.corpEmpNoOfHours as noOfHours,
          ce.corpEmpHourlyRate as hourlyRate
        FROM apt_corp_emp ce 
        LEFT JOIN apt_corp c ON ce.corpId = c.corpId 
        ${whereClause}
        ORDER BY ce.corpEmpCreatedDate DESC 
        LIMIT ${pageLimit} 
        OFFSET ${skip}
      `;

      const paginatedEmployees: CorpEmpResultInt[] = await AppDataSource.query(getQuery);

      const pages: number = Math.ceil(total / pageLimit);

      const result = {
        pagination: {
          page,
          total,
          pages
        },
        employees: paginatedEmployees
      };

      return responseFormatter.success(req, res, 200, result, true, this.codes.SUCCESS, this.messages.EMPLOYEE_LIST_RETRIEVED);
    } catch (error) {
      console.error('Error fetching employees:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, mobile, basicSalAmt, accNo, accName, accBank, hourlyRate, noOfHours, paymentType } = req.body;

      if (!name || !email || !mobile || !basicSalAmt || !accNo || !accName || !accBank || !hourlyRate || !noOfHours || !paymentType) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Name, email, mobile, basic salary amount, account number, account name, account bank, hourly rate, number of hours, and payment type are required'
        });
      }

      const corpId = req.corp?.corpId;
      console.log('Corporate ID from request: ', corpId);

      const corpEmpName = name;
      const corpEmpEmail = email;
      const corpEmpPassword = await hashPassword('Pass@123');
      const corpEmpMobile = mobile;
      const corpEmpBasicSalAmt = basicSalAmt;
      const corpEmpAccNo = accNo;
      const corpEmpAccName = accName;
      const corpEmpAccBank = accBank;
      const corpEmpAccBranch = 'N/A';
      const corpEmpCreatedBy = 1;

      const corporate: CorporateTyp | null = await this.CorporateRepo.findOne({
        where: { corpId: corpId }
      });

      if (!corporate) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.CORPORATE_NOT_FOUND
        });
      }

      const existingEmployee: CorpEmpTyp | null = await this.CorpEmpRepo.findOne({
        where: [
          { corpEmpEmail: corpEmpEmail, corpId: { corpId: corporate.corpId } },
          { corpEmpMobile: corpEmpMobile, corpId: { corpId: corporate.corpId } }
        ]
      });

      if (existingEmployee) {
        return responseFormatter.error(req, res, {
          statusCode: 409,
          status: false,
          message: this.messages.EMPLOYEE_ALREADY_EXISTS
        });
      }

      const payTypId =
        paymentType === this.houPayTypTag //
          ? this.houPayTypId
          : this.monPayTypId;

      const newCorpEmp = new CorpEmp();
      newCorpEmp.corpId = corporate;
      newCorpEmp.corpEmpName = corpEmpName;
      newCorpEmp.corpEmpEmail = corpEmpEmail;
      newCorpEmp.corpEmpPassword = corpEmpPassword;
      newCorpEmp.corpEmpMobile = corpEmpMobile;
      newCorpEmp.corpEmpBasicSalAmt = corpEmpBasicSalAmt;
      newCorpEmp.corpEmpAccNo = corpEmpAccNo;
      newCorpEmp.corpEmpAccName = corpEmpAccName;
      newCorpEmp.corpEmpAccBank = corpEmpAccBank;
      newCorpEmp.corpEmpAccBranch = corpEmpAccBranch;
      newCorpEmp.corpEmpStatus = this.status.ACTIVE.ID;
      newCorpEmp.corpEmpCreatedBy = corpEmpCreatedBy;
      newCorpEmp.corpEmpLastUpdatedBy = corpEmpCreatedBy;
      newCorpEmp.corpEmpMonthlyRmnAmt = corpEmpBasicSalAmt / 2;
      newCorpEmp.corpEmpPayType = payTypId;
      newCorpEmp.corpEmpNoOfHours = noOfHours;
      newCorpEmp.corpEmpHourlyRate = hourlyRate;

      const savedEmployee = await this.CorpEmpRepo.save(newCorpEmp);

      const newBankAccount = new BankAccount();
      newBankAccount.corpEmpId = savedEmployee;
      newBankAccount.accountNumber = corpEmpAccNo || '';
      newBankAccount.holderName = corpEmpAccName || '';
      newBankAccount.bankName = corpEmpAccBank || '';
      newBankAccount.branch = 'N/A';
      newBankAccount.nickname = corpEmpName || '';
      newBankAccount.isDefault = true;
      newBankAccount.isActive = true;
      newBankAccount.status = this.status.ACTIVE.ID;
      newBankAccount.createdBy = 0;
      newBankAccount.lastUpdatedBy = 0;

      await this.BankAccountRepo.save(newBankAccount);

      return responseFormatter.success(req, res, 201, {}, true, this.codes.SUCCESS, this.messages.EMPLOYEE_CREATED);
    } catch (error) {
      console.error('Error creating employee:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { no, name, email, mobile, basicSalAmt, accNo, accName, accBank, accBranch, status, hourlyRate, noOfHours, paymentType } = req.body;

      if (!no) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Employee id is required'
        });
      }

      const corpEmpName = name;
      const corpEmpEmail = email;
      const corpEmpMobile = mobile;
      const corpEmpBasicSalAmt = basicSalAmt;
      const corpEmpAccNo = accNo;
      const corpEmpAccName = accName;
      const corpEmpAccBank = accBank;
      const corpEmpAccBranch = 'N/A';
      const corpEmpStatus = status;
      const corpEmpLastUpdatedBy = 1;

      const existingEmployee: CorpEmpTyp | null = await this.CorpEmpRepo.findOne({
        where: { corpEmpId: no },
        relations: ['corpId']
      });

      if (!existingEmployee) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.EMPLOYEE_NOT_FOUND
        });
      }

      if (corpEmpEmail || corpEmpMobile) {
        const duplicateCheck = await this.CorpEmpRepo.findOne({
          where: [
            { corpEmpEmail: corpEmpEmail || existingEmployee.corpEmpEmail, corpId: { corpId: existingEmployee.corpId.corpId } },
            { corpEmpMobile: corpEmpMobile || existingEmployee.corpEmpMobile, corpId: { corpId: existingEmployee.corpId.corpId } }
          ]
        });

        if (duplicateCheck && duplicateCheck.corpEmpId !== existingEmployee.corpEmpId) {
          return responseFormatter.error(req, res, {
            statusCode: 409,
            status: false,
            message: this.messages.EMPLOYEE_EMAIL_MOBILE_EXISTS
          });
        }
      }

      const payTypId =
        paymentType === this.houPayTypTag //
          ? this.houPayTypId
          : this.monPayTypId;

      const isMonthlyPay = payTypId === this.monPayTypId;

      existingEmployee.corpEmpName = corpEmpName;
      existingEmployee.corpEmpEmail = corpEmpEmail;
      existingEmployee.corpEmpMobile = corpEmpMobile;
      existingEmployee.corpEmpBasicSalAmt = isMonthlyPay ? corpEmpBasicSalAmt : 0;
      existingEmployee.corpEmpAccNo = corpEmpAccNo;
      existingEmployee.corpEmpAccName = corpEmpAccName;
      existingEmployee.corpEmpAccBank = corpEmpAccBank;
      existingEmployee.corpEmpAccBranch = 'N/A';
      existingEmployee.corpEmpIsInitiallyApproved = true;
      existingEmployee.corpEmpStatus =
        corpEmpStatus === this.activeTag //
          ? this.activeId
          : corpEmpStatus === this.inactiveTag
          ? this.inactiveId
          : this.blockedId;
      existingEmployee.corpEmpMonthlyRmnAmt = isMonthlyPay ? corpEmpBasicSalAmt / 2 : 0;
      existingEmployee.corpEmpPayType = payTypId;
      existingEmployee.corpEmpNoOfHours = isMonthlyPay ? noOfHours : 0;
      existingEmployee.corpEmpHourlyRate = hourlyRate;
      existingEmployee.corpEmpLastUpdatedBy = corpEmpLastUpdatedBy;

      // if (Number(existingEmployee.corpEmpMonthlyRmnAmt) === 0) {
      const currentAmt = existingEmployee.corpEmpMonthlyRmnAmt;

      const basAmt = existingEmployee.corpEmpBasicSalAmt;

      const newAmt = basAmt / 2;

      existingEmployee.corpEmpMonthlyRmnAmt =
        newAmt > currentAmt //
          ? newAmt - existingEmployee.corpEmpMonthlyWtdAmt
          : currentAmt;
      // }

      await this.CorpEmpRepo.save(existingEmployee);

      const bankAccountExists: BankAccount | null = await this.BankAccountRepo.findOne({
        where: { corpEmpId: { corpEmpId: existingEmployee.corpEmpId }, accountNumber: accNo || '' }
      });

      if (!bankAccountExists) {
        const newBankAccount = new BankAccount();
        newBankAccount.corpEmpId = existingEmployee;
        newBankAccount.accountNumber = accNo || '';
        newBankAccount.holderName = accName || '';
        newBankAccount.bankName = accBank || '';
        newBankAccount.branch = 'N/A';
        newBankAccount.nickname = name || '';
        newBankAccount.isDefault = true;
        newBankAccount.isActive = true;
        newBankAccount.status = this.status.ACTIVE.ID;
        newBankAccount.createdBy = corpEmpLastUpdatedBy;
        newBankAccount.lastUpdatedBy = 0;
        await this.BankAccountRepo.save(newBankAccount);
      } else {
        bankAccountExists.holderName = accName || bankAccountExists.holderName;
        bankAccountExists.bankName = accBank || bankAccountExists.bankName;
        bankAccountExists.lastUpdatedBy = corpEmpLastUpdatedBy;
        await this.BankAccountRepo.save(bankAccountExists);
      }

      return responseFormatter.success(req, res, 200, {}, true, this.codes.SUCCESS, this.messages.EMPLOYEE_UPDATED);
    } catch (error) {
      console.error('Error updating employee:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Email and password are required'
        });
      }

      const employee: CorpEmpTyp | null = await this.CorpEmpRepo.findOne({
        where: { corpEmpEmail: email },
        relations: ['corpId']
      });

      if (!employee) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.EMPLOYEE_NOT_FOUND
        });
      }

      if (employee.corpEmpStatus !== this.status.ACTIVE.ID) {
        return responseFormatter.error(req, res, {
          statusCode: 403,
          status: false,
          message: this.messages.EMPLOYEE_ACCOUNT_NOT_ACTIVE
        });
      }

      // Validate password
      const isPasswordValid = await verifyPassword(password, employee.corpEmpPassword);
      if (!isPasswordValid) {
        return responseFormatter.error(req, res, {
          statusCode: 401,
          status: false,
          message: this.messages.INVALID_CREDENTIALS
        });
      }

      const tokens = await createTokens(employee.corpEmpId.toString(), 'EMP');

      return responseFormatter.success(req, res, 200, { user: employee, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }, true, this.codes.SUCCESS, this.messages.EMPLOYEE_LOGIN_SUCCESS);
    } catch (error) {
      console.error('Error during employee login:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, confirmPassword } = req.body;

      if (!email || !password || !confirmPassword) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Email, password, and confirm password are required'
        });
      }

      if (password !== confirmPassword) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Passwords do not match'
        });
      }

      const emailDomain = email.substring(email.lastIndexOf('@') + 1);
      const name = email.substring(0, email.lastIndexOf('@'));

      const corporate: CorporateTyp | null = await this.CorporateRepo.findOne({
        where: { corpEmailDomain: emailDomain }
      });

      if (!corporate) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.CORPORATE_NOT_FOUND
        });
      }

      const employee: CorpEmpTyp | null = await this.CorpEmpRepo.findOne({
        where: { corpEmpEmail: email }
      });

      if (employee) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.EMPLOYEE_ALREADY_EXISTS
        });
      }

      const hashedPassword = await hashPassword(password);

      const newCorpEmp = new CorpEmp();
      newCorpEmp.corpId = corporate;
      newCorpEmp.corpEmpName = name || '';
      newCorpEmp.corpEmpEmail = email;
      newCorpEmp.corpEmpPassword = hashedPassword;
      newCorpEmp.corpEmpMobile = '';
      newCorpEmp.corpEmpBasicSalAmt = 0;
      newCorpEmp.corpEmpAccNo = '';
      newCorpEmp.corpEmpAccName = '';
      newCorpEmp.corpEmpAccBank = '';
      newCorpEmp.corpEmpAccBranch = 'N/A';
      newCorpEmp.corpEmpStatus = this.status.INACTIVE.ID;
      newCorpEmp.corpEmpIsInitiallyApproved = false;
      newCorpEmp.corpEmpCreatedBy = 0;
      newCorpEmp.corpEmpLastUpdatedBy = 0;

      await this.CorpEmpRepo.save(newCorpEmp);

      return responseFormatter.success(req, res, 200, {}, true, this.codes.SUCCESS, this.messages.EMPLOYEE_SIGNUP_SUCCESS);
    } catch (error) {
      console.error('Error during employee signup:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.body;

      const no = id;

      if (!no) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Employee id is required'
        });
      }

      const existingEmployee: CorpEmpTyp | null = await this.CorpEmpRepo.findOne({
        where: { corpEmpId: no },
        relations: ['corpId']
      });

      if (!existingEmployee) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.EMPLOYEE_NOT_FOUND
        });
      }

      // Toggle status logic: if active, make inactive; if inactive, make active; if blocked, make active
      let newStatus: number;
      let newStatusDescription: string;

      if (existingEmployee.corpEmpStatus === this.activeId) {
        newStatus = this.inactiveId;
        newStatusDescription = this.inactiveDescription;
      } else if (existingEmployee.corpEmpStatus === this.inactiveId) {
        newStatus = this.activeId;
        newStatusDescription = this.activeDescription;
      } else {
        // if blocked, activate
        newStatus = this.activeId;
        newStatusDescription = this.activeDescription;
      }

      if (Number(existingEmployee.corpEmpMonthlyRmnAmt) === 0) {
        existingEmployee.corpEmpMonthlyRmnAmt = existingEmployee.corpEmpBasicSalAmt / 2;
      }

      existingEmployee.corpEmpStatus = newStatus;
      existingEmployee.corpEmpIsInitiallyApproved = true;
      existingEmployee.corpEmpLastUpdatedBy = 1; // You may want to get this from the authenticated user

      await this.CorpEmpRepo.save(existingEmployee);

      const result = {
        id: existingEmployee.corpEmpId,
        name: existingEmployee.corpEmpName,
        email: existingEmployee.corpEmpEmail,
        status: newStatus,
        statusDescription: newStatusDescription
      };

      const message = newStatus === this.activeId ? 'Employee activated successfully' : 'Employee deactivated successfully';

      return responseFormatter.success(req, res, 200, result, true, this.codes.SUCCESS, message);
    } catch (error) {
      console.error('Error toggling employee status:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async setPwd(req: Request, res: Response, next: NextFunction) {
    try {
      const empUser = req.user;

      const { currentPwd, newPwd } = req.body;

      if (!currentPwd || !newPwd) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Current password and new password are required'
        });
      }

      if (!('corpEmpId' in empUser)) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Invalid employee user object'
        });
      }

      const isPasswordValid = await verifyPassword(currentPwd, empUser.corpEmpPassword);

      if (!isPasswordValid) {
        return responseFormatter.error(req, res, {
          statusCode: 401,
          status: false,
          message: 'Invalid current password'
        });
      }

      const existingEmployee: CorpEmpTyp | null = await this.CorpEmpRepo.findOne({
        where: { corpEmpId: empUser.corpEmpId }
      });

      if (!existingEmployee) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.EMPLOYEE_NOT_FOUND
        });
      }

      const hashedPassword = await hashPassword(newPwd);
      existingEmployee.corpEmpPassword = hashedPassword;

      await this.CorpEmpRepo.save(existingEmployee);

      return responseFormatter.success(req, res, 200, {}, true, this.codes.SUCCESS, 'Employee password updated successfully');
    } catch (error) {
      console.error('Error setting employee password:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async sendSupport(req: Request, res: Response, next: NextFunction) {
    try {
      const { subject, priority, message, email } = req.body;

      if (!subject || !priority || !message) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Subject, priority and message are required'
        });
      }

      // Validate priority
      const allowedPriorities = ['Low', 'Medium', 'High'];
      const chosenPriority = allowedPriorities.includes(priority) ? priority : 'Low';

      const to = 'adzpay@yopmail.com'; //config.SUPPORT_EMAIL || 'support@advanzpay.local';

      const mailData = {
        subject,
        priority: chosenPriority,
        message,
        from: email || undefined
      };

      // send email
      const { sendEmail } = await import('../../helper/user/emailHandler');
      const sendResult = await sendEmail(to, mailData, 'support');

      if (!sendResult || !sendResult.success) {
        return responseFormatter.error(req, res, {
          statusCode: 500,
          status: false,
          message: this.messages.INTERNAL_SERVER_ERROR
        });
      }

      return responseFormatter.success(req, res, 200, {}, true, this.codes.SUCCESS, 'Support request sent successfully');
    } catch (error) {
      console.error('Error sending support request:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }
}
