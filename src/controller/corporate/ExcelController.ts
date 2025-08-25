import { NextFunction, Request, Response } from 'express';
import * as multer from 'multer';
import * as XLSX from 'xlsx';
import AppDataSource from '../../data-source';
import CorpEmp from '../../entity/CorpEmp';
import Corporate from '../../entity/Corporate';
import config from '../../config';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';
import { STATUS_ENUM } from '../../constant/enums.global';
import * as bcrypt from 'bcrypt';

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Check if file is Excel
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

interface ExcelEmployeeData {
  employeeId?: string;
  name: string;
  email: string;
  mobile: string;
  basicSalary: number;
  accountStatus: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  branch: string;
}

export default class ExcelController {
  private CorpEmpRepo = AppDataSource.getRepository(CorpEmp);
  private CorporateRepo = AppDataSource.getRepository(Corporate);
  private codes = response.CODES;
  private messages = response.MESSAGES;
  private status = constant.STATUS;

  // Multer middleware for file upload
  uploadMiddleware = upload.single('excelFile');

  // Wrapper method that includes multer middleware
  async handleUploadEmployeeExcel(req: Request, res: Response, next: NextFunction) {
    this.uploadMiddleware(req, res, (err) => {
      if (err) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: err.message || 'File upload failed'
        });
      }
      return this.uploadEmployeeExcel(req, res, next);
    });
  }

  async uploadEmployeeExcel(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'No file uploaded. Please upload an Excel file.'
        });
      }

      // Additional file type validation
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ];

      if (!allowedTypes.includes(req.file.mimetype)) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Only Excel files (.xlsx, .xls) and CSV files are allowed'
        });
      }

      const { corpId } = req.body;

      if (!corpId) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Corporate ID is required.'
        });
      }

      // Verify corporate exists
      const corporate = await this.CorporateRepo.findOne({
        where: { corpId: Number(corpId) }
      });

      if (!corporate) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: 'Corporate not found.'
        });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Excel file must contain at least a header row and one data row.'
        });
      }

      // Parse employee data
      const employeeData = await this.parseEmployeeData(jsonData as any[][], corpId);

      if (employeeData.length === 0) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'No valid employee data found in the Excel file.'
        });
      }

      // Insert employees to database
      const result = await this.insertEmployees(employeeData, corporate);

      return responseFormatter.success(req, res, 200, result, true, this.codes.SUCCESS, 'Employee data uploaded successfully from Excel');
    } catch (error) {
      console.error('Error uploading employee Excel:', error);

      if (error instanceof Error && error.message.includes('Only Excel files')) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: error.message
        });
      }

      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  private async parseEmployeeData(jsonData: any[][], corpId: number): Promise<ExcelEmployeeData[]> {
    const employees: ExcelEmployeeData[] = [];

    // Skip header row (index 0)
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];

      // Skip empty rows
      if (!row || row.length === 0 || !row[1]) continue;

      try {
        const employee: ExcelEmployeeData = {
          employeeId: row[0]?.toString() || '',
          name: row[1]?.toString() || '',
          email: row[2]?.toString() || '',
          mobile: row[3]?.toString() || '',
          basicSalary: parseFloat(row[4]) || 0,
          accountStatus: row[5]?.toString() || 'Active',
          accountName: row[6]?.toString() || '',
          accountNumber: row[7]?.toString() || '',
          bankName: row[8]?.toString() || '',
          branch: row[9]?.toString() || ''
        };

        // Basic validation
        if (employee.name && employee.email && employee.mobile && employee.accountNumber) {
          employees.push(employee);
        }
      } catch (error) {
        console.warn(`Error parsing row ${i + 1}:`, error);
        continue;
      }
    }

    return employees;
  }

  private async insertEmployees(employees: ExcelEmployeeData[], corporate: Corporate): Promise<any> {
    const results = {
      total: employees.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    const createdBy = 1; // This should come from authenticated user context

    for (const empData of employees) {
      try {
        // Check if employee already exists with same email in this corporate
        const existingEmployee = await this.CorpEmpRepo.findOne({
          where: {
            corpEmpEmail: empData.email,
            corpId: { corpId: corporate.corpId }
          }
        });

        if (existingEmployee) {
          results.failed++;
          results.errors.push(`Employee with email ${empData.email} already exists`);
          continue;
        }

        // Generate a temporary password (should be changed on first login)
        const tempPassword = 'Pass@123';
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Create new employee
        const newEmployee = new CorpEmp();
        newEmployee.corpId = corporate;
        newEmployee.corpEmpName = empData.name;
        newEmployee.corpEmpEmail = empData.email;
        newEmployee.corpEmpPassword = hashedPassword;
        newEmployee.corpEmpMobile = empData.mobile;
        newEmployee.corpEmpBasicSalAmt = empData.basicSalary;
        newEmployee.corpEmpMonthlyWtdAmt = 0;
        newEmployee.corpEmpMonthlyRmnAmt = empData.basicSalary / 2;
        newEmployee.corpEmpAccName = empData.accountName;
        newEmployee.corpEmpAccNo = empData.accountNumber;
        newEmployee.corpEmpAccBank = empData.bankName;
        newEmployee.corpEmpAccBranch = empData.branch;
        newEmployee.corpEmpStatus = empData.accountStatus.toLowerCase() === 'active' ? STATUS_ENUM.ACTIVE : STATUS_ENUM.INACTIVE;
        newEmployee.corpEmpIsInitiallyApproved = false;
        newEmployee.corpEmpCreatedBy = createdBy;
        newEmployee.corpEmpLastUpdatedBy = createdBy;

        await this.CorpEmpRepo.save(newEmployee);
        results.successful++;
      } catch (error) {
        console.error(`Error inserting employee ${empData.name}:`, error);
        results.failed++;
        results.errors.push(`Failed to insert employee ${empData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  private generateTempPassword(): string {
    // Generate a temporary password that meets the system requirements
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';

    // Ensure at least one of each required character type
    password += 'A'; // Uppercase
    password += 'a'; // Lowercase
    password += '1'; // Digit
    password += '!'; // Special character

    // Fill remaining characters randomly
    for (let i = 4; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  async downloadTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      // Create a sample Excel template with the expected headers
      const templateData = [
        ['Employee ID', 'Name', 'Email', 'Mobile Number', 'Basic Salary (USD)', 'Account Status', 'Account Name', 'Account Number', 'Bank Name', 'Branch'],
        ['101', 'Alice Smith', 'alice@example.com', '123-456-7890', '5000.00', 'Active', 'Alice Smith', '100123456', 'Bank A', 'New York'],
        ['102', 'Bob Johnson', 'bob@example.com', '234-567-8901', '6000.00', 'Inactive', 'Bob Johnson', '200234567', 'Bank B', 'Los Angeles'],
        ['103', 'Clara Brown', 'clara@example.com', '345-678-9012', '5500.00', 'Active', 'Clara Brown', '300345678', 'Bank C', 'Chicago']
      ];

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(templateData);

      // Set column widths
      const colWidths = [
        { wch: 12 }, // Employee ID
        { wch: 20 }, // Name
        { wch: 25 }, // Email
        { wch: 15 }, // Mobile
        { wch: 18 }, // Basic Salary
        { wch: 15 }, // Account Status
        { wch: 20 }, // Account Name
        { wch: 15 }, // Account Number
        { wch: 15 }, // Bank Name
        { wch: 15 } // Branch
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Employees');

      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      // Set response headers
      res.setHeader('Content-Disposition', 'attachment; filename="employee_template.xlsx"');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

      return res.send(buffer);
    } catch (error) {
      console.error('Error generating template:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }
}
