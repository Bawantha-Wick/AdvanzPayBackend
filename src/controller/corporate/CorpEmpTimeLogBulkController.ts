import { NextFunction, Request, Response } from 'express';
import AppDataSource from '../../data-source';
import Corporate from '../../entity/Corporate';
import CorpEmp from '../../entity/CorpEmp';
import CorpEmpTimeLog from '../../entity/CorpEmpTimeLog';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';
import * as moment from 'moment';

interface BulkTimeLogData {
  employeeId: number;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut: string;
  hoursWorked: number;
  notes?: string;
}

interface BulkCreateTimeLogRequest {
  timeLogs: BulkTimeLogData[];
  corpId?: number;
}

interface BulkCreateTimeLogResult {
  successful: BulkTimeLogData[];
  failed: {
    timeLog: BulkTimeLogData;
    reason: string;
  }[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalEarnings: number;
  };
}

export default class CorpEmpTimeLogBulkController {
  private CorpEmpTimeLogRepo = AppDataSource.getRepository(CorpEmpTimeLog);
  private CorpEmpRepo = AppDataSource.getRepository(CorpEmp);
  private CorporateRepo = AppDataSource.getRepository(Corporate);
  private codes = response.CODES;
  private messages = response.MESSAGES;

  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const { timeLogs }: BulkCreateTimeLogRequest = req.body;

      const corp = req.corp;
      const corpId = corp.corpId;

      // Validate request structure
      if (!timeLogs || !Array.isArray(timeLogs) || timeLogs.length === 0) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Invalid request: timeLogs array is required and must not be empty'
        });
      }

      // Get corporate ID
      let targetCorpId = corpId;
      if (!targetCorpId) {
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

      const result: BulkCreateTimeLogResult = {
        successful: [],
        failed: [],
        summary: {
          total: timeLogs.length,
          successful: 0,
          failed: 0,
          totalEarnings: 0
        }
      };

      // Process each time log
      for (const timeLogData of timeLogs) {
        try {
          const earnings = await this.createSingleTimeLog(timeLogData, corporate);
          result.successful.push(timeLogData);
          result.summary.successful++;
          result.summary.totalEarnings += earnings;
        } catch (error) {
          result.failed.push({
            timeLog: timeLogData,
            reason: error instanceof Error ? error.message : 'Unknown error occurred'
          });
          result.summary.failed++;
        }
      }

      // Update monthly withdrawn and remaining amounts for affected employees
      await this.updateMonthlyAmounts(corporate.corpId);

      // Determine response status based on results
      const statusCode = result.summary.failed === 0 ? 201 : result.summary.successful === 0 ? 400 : 207; // 207 = Multi-Status

      const message = result.summary.failed === 0 ? 'All time logs created successfully' : result.summary.successful === 0 ? 'Failed to create any time logs' : `Partial success: ${result.summary.successful} created, ${result.summary.failed} failed`;

      return responseFormatter.success(req, res, statusCode, result, true, this.codes.SUCCESS, message);
    } catch (error) {
      console.error('Error in bulk time log creation:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  private async createSingleTimeLog(timeLogData: BulkTimeLogData, corporate: Corporate): Promise<number> {
    // Validate required fields
    if (!timeLogData.employeeId || !timeLogData.date || !timeLogData.clockIn) {
      throw new Error(`Missing required fields for time log`);
    }

    // Get employee details
    const employee = await this.CorpEmpRepo.findOne({
      where: {
        corpEmpId: timeLogData.employeeId,
        corpId: { corpId: corporate.corpId }
      }
    });

    if (!employee) {
      throw new Error(`Employee with ID ${timeLogData.employeeId} not found in this corporate`);
    }

    // Calculate earnings: corpEmpEarnings = corpEmpHoursWorked * corpEmpHourlyRate
    const earnings = timeLogData.hoursWorked * employee.corpEmpHourlyRate;

    // Create new time log
    const newTimeLog = new CorpEmpTimeLog();
    newTimeLog.corpId = corporate;
    newTimeLog.corpEmpId = employee;
    newTimeLog.corpEmpName = employee.corpEmpName; // TODO - Shouldn't store employee name
    newTimeLog.corpEmpTimeLogDate = new Date(timeLogData.date);
    newTimeLog.corpEmpClockIn = timeLogData.clockIn;
    newTimeLog.corpEmpClockOut = timeLogData.clockOut || null;
    newTimeLog.corpEmpHoursWorked = timeLogData.hoursWorked;
    newTimeLog.corpEmpEarnings = earnings;
    newTimeLog.corpEmpTimeLogNotes = timeLogData.notes || null;

    // Save to database
    await this.CorpEmpTimeLogRepo.save(newTimeLog);

    return earnings;
  }

  private async updateMonthlyAmounts(corpId: number): Promise<void> {
    try {
      // Get current month's start and end dates
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get all employees for this corporate
      const employees = await this.CorpEmpRepo.find({
        where: { corpId: { corpId: corpId } }
      });

      for (const employee of employees) {
        // Calculate total earnings for the current month from time logs
        // Both HOURLY and MONTHLY employees earn based on hours worked * hourly rate
        const monthlyTimeLogs = await this.CorpEmpTimeLogRepo.createQueryBuilder('timeLog') //
          .where('timeLog.corpEmpId = :corpEmpId', { corpEmpId: employee.corpEmpId })
          .andWhere('timeLog.corpEmpTimeLogDate >= :startOfMonth', { startOfMonth })
          .andWhere('timeLog.corpEmpTimeLogDate <= :endOfMonth', { endOfMonth })
          .getMany();

        // Sum up all earnings for the month so far
        const totalMonthlyEarnings = monthlyTimeLogs.reduce((sum, log) => sum + Number(log.corpEmpEarnings), 0);

        // Calculate 50% of total earnings as available for withdrawal
        const halfOfEarnings = totalMonthlyEarnings / 2;

        // Check if we're in the first week of the month (days 1-7)
        const currentDayOfMonth = now.getDate();
        const isFirstWeekOfMonth = currentDayOfMonth <= 7;

        if (isFirstWeekOfMonth) {
          // First week: Reset and set to current half of earnings
          employee.corpEmpMonthlyCycleAmt = totalMonthlyEarnings;
          employee.corpEmpMonthlyRmnAmt = halfOfEarnings;
        } else {
          // Subsequent weeks: Add to existing amounts (accumulate)
          employee.corpEmpMonthlyCycleAmt = Number(employee.corpEmpMonthlyCycleAmt) + totalMonthlyEarnings;
          employee.corpEmpMonthlyRmnAmt = Number(employee.corpEmpMonthlyRmnAmt) + halfOfEarnings;
        }

        await this.CorpEmpRepo.save(employee);
      }
    } catch (error) {
      console.error('Error updating monthly amounts:', error);
      // Don't throw error to prevent transaction rollback for time log creation
    }
  }

  /**
   * GET /corp/time-logs?startDate=2025-10-01&endDate=2025-10-31&page=1&limit=10
   * Returns time logs for a given date range with pagination
   * If startDate and endDate are not provided, defaults to last 30 days
   */
  async getTimeLogsByDateRange(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, page = 1, limit = 10 } = req.query;

      const corp = req.corp;
      const corpId = corp.corpId;

      if (!corpId) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Corporate ID is required'
        });
      }

      // Verify corporate exists
      const corporate = await this.CorporateRepo.findOne({
        where: { corpId: corpId }
      });

      if (!corporate) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.CORPORATE_NOT_FOUND
        });
      }

      // Validate and parse pagination params
      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 10); // Max 10 items per page
      const skip = (pageNum - 1) * limitNum;

      // Parse dates - default to last 30 days if not provided
      let start: Date;
      let end: Date;

      if (!startDate || !endDate) {
        // Default to last 30 days
        end = moment().endOf('day').toDate();
        start = moment().subtract(30, 'days').startOf('day').toDate();
      } else {
        start = moment(startDate as string)
          .startOf('day')
          .toDate();
        end = moment(endDate as string)
          .endOf('day')
          .toDate();
      }

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
      }

      if (start > end) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'startDate must be before or equal to endDate'
        });
      }

      // Build query
      const queryBuilder = this.CorpEmpTimeLogRepo.createQueryBuilder('timeLog').leftJoinAndSelect('timeLog.corpEmpId', 'corpEmp').leftJoinAndSelect('timeLog.corpId', 'corporate').where('corporate.corpId = :corpId', { corpId: corpId }).andWhere('timeLog.corpEmpTimeLogDate >= :startDate', { startDate: start }).andWhere('timeLog.corpEmpTimeLogDate <= :endDate', { endDate: end }).orderBy('timeLog.corpEmpTimeLogDate', 'DESC').addOrderBy('timeLog.corpEmpTimeLogId', 'DESC').take(limitNum).skip(skip);

      const [timeLogs, total] = await queryBuilder.getManyAndCount();

      // Format response
      const formattedTimeLogs = timeLogs.map((timeLog) => {
        const hoursWorked = parseFloat(timeLog.corpEmpHoursWorked.toString());
        const earnings = parseFloat(timeLog.corpEmpEarnings.toString());

        // Calculate overtime hours (hours beyond 8 hours per day)
        const standardHours = 8;
        const overtimeHours = hoursWorked > standardHours ? hoursWorked - standardHours : 0;

        return {
          id: timeLog.corpEmpTimeLogId,
          employeeId: timeLog.corpEmpId.corpEmpId,
          employeeName: timeLog.corpEmpName,
          date: timeLog.corpEmpTimeLogDate,
          clockIn: timeLog.corpEmpClockIn,
          clockOut: timeLog.corpEmpClockOut,
          hoursWorked: hoursWorked,
          breakHours: 0, // Not tracked in current schema
          overtimeHours: overtimeHours,
          earnings: earnings,
          notes: timeLog.corpEmpTimeLogNotes
        };
      });

      const totalPages = Math.ceil(total / limitNum);

      const result = {
        timeLogs: formattedTimeLogs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages
        }
      };

      return responseFormatter.success(req, res, 200, result, true, this.codes.SUCCESS, 'Time logs retrieved successfully');
    } catch (error) {
      console.error('Error fetching time logs by date range:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }
}
