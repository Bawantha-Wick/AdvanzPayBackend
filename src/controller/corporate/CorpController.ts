import { NextFunction, Request, Response } from 'express';
import AppDataSource from '../../data-source';
import Corporate from '../../entity/Corporate';
import CorpEmp from '../../entity/CorpEmp';
import Withdrawal from '../../entity/Withdrawal';
import config from '../../config';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';

export default class CorpController {
  private CorporateRepo = AppDataSource.getRepository(Corporate);
  private codes = response.CODES;
  private messages = response.MESSAGES;
  private status = constant.STATUS;

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [corporates, total] = await this.CorporateRepo.findAndCount({
        skip,
        take: Number(limit),
        order: { corpCreatedDate: 'DESC' }
      });

      const result = {
        corporates,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      };

      return responseFormatter.success(req, res, 200, result, true, this.codes.SUCCESS, this.messages.CORPORATE_LIST_RETRIEVED);
    } catch (error) {
      console.error('Error fetching corporates:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { corpName, corpPayDay, corpConPsnName, corpConPsnTitle, corpConPsnEmail, corpConPsnMobile, corpSalAdzMinAmt, corpSalAdzMaxAmt, corpSalAdzPercent, corpSalAdzCapAmt } = req.body;

      const corpCreatedBy = 1; // This should come from authenticated user context
      const corpLastUpdatedBy = 1; // This should come from authenticated user context

      // Check if corporate with same name already exists
      const existingCorporate = await this.CorporateRepo.findOne({
        where: { corpName: corpName }
      });

      if (existingCorporate) {
        return responseFormatter.error(req, res, {
          statusCode: 409,
          status: false,
          message: this.messages.CORPORATE_ALREADY_EXISTS
        });
      }

      const newCorporate = new Corporate();
      newCorporate.corpName = corpName;
      newCorporate.corpPayDay = corpPayDay;
      newCorporate.corpConPsnName = corpConPsnName;
      newCorporate.corpConPsnTitle = corpConPsnTitle;
      newCorporate.corpConPsnEmail = corpConPsnEmail;
      newCorporate.corpConPsnMobile = corpConPsnMobile;
      newCorporate.corpSalAdzMinAmt = corpSalAdzMinAmt || 0;
      newCorporate.corpSalAdzMaxAmt = corpSalAdzMaxAmt || 0;
      newCorporate.corpSalAdzPercent = corpSalAdzPercent || 0;
      newCorporate.corpSalAdzCapAmt = corpSalAdzCapAmt || 0;
      newCorporate.corpStatus = this.status.ACTIVE.ID;
      newCorporate.corpCreatedBy = corpCreatedBy;
      newCorporate.corpLastUpdatedBy = corpLastUpdatedBy;

      const savedCorporate = await this.CorporateRepo.save(newCorporate);

      return responseFormatter.success(req, res, 201, savedCorporate, true, this.codes.SUCCESS, this.messages.CORPORATE_CREATED);
    } catch (error) {
      console.error('Error creating corporate:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, corpName, corpPayDay, corpConPsnName, corpConPsnTitle, corpConPsnEmail, corpConPsnMobile, corpSalAdzMinAmt, corpSalAdzMaxAmt, corpSalAdzPercent, corpSalAdzCapAmt, corpStatus } = req.body;

      const corpLastUpdatedBy = 1; // This should come from authenticated user context

      const existingCorporate = await this.CorporateRepo.findOne({
        where: { corpId: Number(id) }
      });

      if (!existingCorporate) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.CORPORATE_NOT_FOUND
        });
      }

      // Check if another corporate with same name exists (exclude current one)
      if (corpName && corpName !== existingCorporate.corpName) {
        const duplicateCheck = await this.CorporateRepo.findOne({
          where: { corpName: corpName }
        });

        if (duplicateCheck && duplicateCheck.corpId !== existingCorporate.corpId) {
          return responseFormatter.error(req, res, {
            statusCode: 409,
            status: false,
            message: this.messages.CORPORATE_NAME_EXISTS
          });
        }
      }

      // Update fields if provided
      if (corpName) existingCorporate.corpName = corpName;
      if (corpPayDay) existingCorporate.corpPayDay = corpPayDay;
      if (corpConPsnName) existingCorporate.corpConPsnName = corpConPsnName;
      if (corpConPsnTitle) existingCorporate.corpConPsnTitle = corpConPsnTitle;
      if (corpConPsnEmail) existingCorporate.corpConPsnEmail = corpConPsnEmail;
      if (corpConPsnMobile) existingCorporate.corpConPsnMobile = corpConPsnMobile;
      if (corpSalAdzMinAmt !== undefined) existingCorporate.corpSalAdzMinAmt = corpSalAdzMinAmt;
      if (corpSalAdzMaxAmt !== undefined) existingCorporate.corpSalAdzMaxAmt = corpSalAdzMaxAmt;
      if (corpSalAdzPercent !== undefined) existingCorporate.corpSalAdzPercent = corpSalAdzPercent;
      if (corpSalAdzCapAmt !== undefined) existingCorporate.corpSalAdzCapAmt = corpSalAdzCapAmt;
      if (corpStatus) existingCorporate.corpStatus = corpStatus;
      existingCorporate.corpLastUpdatedBy = corpLastUpdatedBy;

      const updatedCorporate = await this.CorporateRepo.save(existingCorporate);

      return responseFormatter.success(req, res, 200, updatedCorporate, true, this.codes.SUCCESS, this.messages.CORPORATE_UPDATED);
    } catch (error) {
      console.error('Error updating corporate:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * GET /corp/analytics?corpId=123
   * Returns analytics for a corporate organization:
   * - number of employees
   * - total employees withdrawal amount
   * - total count of withdrawal requests
   * - total liability
   *
   * Note: "total liability" is interpreted as the sum of `corpEmpMonthlyWtdAmt` across
   * all employees for the corporation (amount withheld / owed per employee monthly).
   */
  async analytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { corpId } = req.query;

      if (!corpId) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'corpId is required'
        });
      }

      const corpIdNum = Number(corpId);

      // Repositories
      const CorpEmpRepo = AppDataSource.getRepository(CorpEmp);
      const WithdrawalRepo = AppDataSource.getRepository(Withdrawal);

      // Count employees for the corporate
      const employeeCount = await CorpEmpRepo.count({
        where: { corpId: { corpId: corpIdNum } }
      });

      // Sum of monthly withheld amounts (interpreted as liability)
      const liabilityResult = await CorpEmpRepo.createQueryBuilder('emp') //
        .select('COALESCE(SUM(emp.corpEmpMonthlyWtdAmt), 0)', 'totalLiability')
        .where('emp.corpId = :corpId', { corpId: corpIdNum })
        .getRawOne();

      const totalLiability = Number(liabilityResult?.totalLiability || 0);

      // Sum and count of withdrawals for employees under the corporate
      // We join withdrawal -> corp_emp to filter by corpId
      const withdrawalAgg = await WithdrawalRepo.createQueryBuilder('w') //
        .select('COALESCE(SUM(w.amount), 0)', 'totalWithdrawalAmount')
        .addSelect('COUNT(w.withdrawalId)', 'withdrawalRequestCount')
        .innerJoin('w.corpEmpId', 'emp')
        .where('emp.corpId = :corpId', { corpId: corpIdNum })
        .getRawOne();

      const totalWithdrawalAmount = Number(withdrawalAgg?.totalWithdrawalAmount || 0);
      const withdrawalRequestCount = Number(withdrawalAgg?.withdrawalRequestCount || 0);

      // Daily withdrawals for a date range. Accept optional `from` and `to` query params
      // If not provided or invalid, fallback to the past 30 days (including today).
      const { from, to } = req.query as { from?: string; to?: string };

      const parseDate = (v?: string) => {
        if (!v) return null;
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? null : d;
      };

      let fromDate: Date | null = parseDate(from);
      let toDate: Date | null = parseDate(to);

      // If only one of from/to is provided and valid, adjust the other to a sensible value
      if (fromDate && !toDate) {
        // make toDate same as fromDate (single day)
        toDate = new Date(fromDate);
      }
      if (!fromDate && toDate) {
        // make fromDate same as toDate (single day)
        fromDate = new Date(toDate);
      }

      // If both absent or invalid, use past 30 days
      const today = new Date();
      if (!fromDate || !toDate) {
        toDate = new Date(today);
        fromDate = new Date();
        fromDate.setDate(toDate.getDate() - 29);
      }

      // Normalize time to start/end of days
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);

      // Ensure fromDate <= toDate and the range isn't absurdly large (protect against abuse)
      if (fromDate.getTime() > toDate.getTime()) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: '`from` must be before or equal to `to`'
        });
      }

      const maxRangeDays = 366; // allow up to one year
      const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > maxRangeDays) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: `Date range too large. Max allowed is ${maxRangeDays} days.`
        });
      }

      const dailyRows = await WithdrawalRepo.createQueryBuilder('w') //
        .select('DATE(w.createdAt)', 'date')
        .addSelect('COALESCE(SUM(w.amount), 0)', 'amount')
        .innerJoin('w.corpEmpId', 'emp')
        .where('emp.corpId = :corpId', { corpId: corpIdNum })
        .andWhere('w.createdAt BETWEEN :from AND :to', { from: fromDate.toISOString(), to: toDate.toISOString() })
        .groupBy('DATE(w.createdAt)')
        .orderBy('DATE(w.createdAt)', 'ASC')
        .getRawMany();

      const rowsMap: Record<string, number> = {};
      const toDateStr = (val: any) => {
        if (!val && val !== 0) return '';
        if (typeof val === 'string') return val.slice(0, 10);
        if (val instanceof Date) return val.toISOString().slice(0, 10);
        if (val && typeof (val as any).toISOString === 'function') return (val as any).toISOString().slice(0, 10);
        return String(val).slice(0, 10);
      };

      for (const r of dailyRows) {
        const d = toDateStr(r.date);
        if (!d) continue;
        rowsMap[d] = Number(r.amount || 0);
      }

      // Build list of days between fromDate(start) and toDate(end) inclusive
      const dailyWithdrawals: Array<{ date: string; amount: number }> = [];
      const iterDate = new Date(fromDate);
      iterDate.setHours(0, 0, 0, 0);
      while (iterDate.getTime() <= toDate.getTime()) {
        const dateStr = iterDate.toISOString().slice(0, 10);
        dailyWithdrawals.push({ date: dateStr, amount: rowsMap[dateStr] || 0 });
        iterDate.setDate(iterDate.getDate() + 1);
      }

      // --- Monthly liabilities for past 6 months (exclude current month) ---
      // Assumptions:
      // - "Liability" for a month = sum of `corpEmpMonthlyWtdAmt` for employees of the corp
      //   who had transactions during that specific month.
      // - "balance" for a month = liability - total withdrawals made in that month.
      // These choices are best-effort given available schema (no termination date).

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyLiabilities: Array<{ billingMonth: string; type: string; lastDate: string; totalLiability: number; balance: number }> = [];
      const todayForMonths = new Date();

      // Start from i=6 (6 months ago) to i=1 (last month), excluding i=0 (current month)
      for (let i = 6; i >= 1; i--) {
        const dt = new Date(todayForMonths.getFullYear(), todayForMonths.getMonth() - i, 1);
        const year = dt.getFullYear();
        const month = dt.getMonth();

        // month start and end
        const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999); // last day of month

        // Sum of employee monthly withheld amounts for employees who had transactions during this month
        // First, get the employee IDs that had transactions in this month
        const empIdsWithTransactions = await WithdrawalRepo.createQueryBuilder('w').select('DISTINCT emp.corpEmpId', 'corpEmpId').innerJoin('w.corpEmpId', 'emp').where('emp.corpId = :corpId', { corpId: corpIdNum }).andWhere('w.createdAt BETWEEN :start AND :end', { start: monthStart.toISOString(), end: monthEnd.toISOString() }).getRawMany();

        const empIds = empIdsWithTransactions.map((row) => row.corpEmpId);

        let totalForMonth = 0;
        if (empIds.length > 0) {
          // Sum corpEmpMonthlyWtdAmt for these employees
          const empLiabilityRes = await CorpEmpRepo.createQueryBuilder('emp').select('COALESCE(SUM(emp.corpEmpMonthlyWtdAmt), 0)', 'total').where('emp.corpEmpId IN (:...empIds)', { empIds }).getRawOne();

          totalForMonth = Number(empLiabilityRes?.total || 0);
        }

        // Sum of withdrawals for this corp in that month
        const monthWithdrawalRes = await WithdrawalRepo.createQueryBuilder('w').select('COALESCE(SUM(w.amount), 0)', 'total').innerJoin('w.corpEmpId', 'emp').where('emp.corpId = :corpId', { corpId: corpIdNum }).andWhere('w.createdAt BETWEEN :start AND :end', { start: monthStart.toISOString(), end: monthEnd.toISOString() }).getRawOne();

        const withdrawalsForMonth = Number(monthWithdrawalRes?.total || 0);

        const billingMonth = `${year}-${monthNames[month]}`;
        const lastDate = `${year}.${String(monthEnd.getMonth() + 1).padStart(2, '0')}.${String(monthEnd.getDate()).padStart(2, '0')}`;

        if (totalForMonth > 0) {
          // If lastDate is greater than today, use today's date instead
          const todayStr = `${todayForMonths.getFullYear()}.${String(todayForMonths.getMonth() + 1).padStart(2, '0')}.${String(todayForMonths.getDate()).padStart(2, '0')}`;
          const useLastDate = new Date(lastDate.replace(/\./g, '-')) > todayForMonths ? todayStr : lastDate;

          monthlyLiabilities.push({
            billingMonth,
            type: 'Invoice',
            lastDate: useLastDate,
            totalLiability: totalForMonth,
            balance: Number((totalForMonth - withdrawalsForMonth).toFixed(2))
          });
        }
      }

      const result = {
        employeeCount,
        totalWithdrawalAmount,
        withdrawalRequestCount,
        totalLiability,
        dailyWithdrawals,
        monthlyLiabilities
      };

      return responseFormatter.success(req, res, 200, result, true, this.codes.SUCCESS, this.messages.CORPORATE_LIST_RETRIEVED || 'Corporate analytics retrieved');
    } catch (error) {
      console.error('Error fetching corporate analytics:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }
}
