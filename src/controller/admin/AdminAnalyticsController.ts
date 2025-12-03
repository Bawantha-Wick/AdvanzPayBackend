import { NextFunction, Request, Response } from 'express';
import AppDataSource from '../../data-source';
import Corporate from '../../entity/Corporate';
import CorpEmp from '../../entity/CorpEmp';
import CorpEmpReq from '../../entity/CorpEmpReqs';
import Withdrawal from '../../entity/Withdrawal';
import { TRANSACTION_STATUS } from '../../entity/Transaction';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';
import KobbleApiService from '../../services/KobbleApiService';

export default class AdminAnalyticsController {
  private CorporateRepo = AppDataSource.getRepository(Corporate);
  private CorpEmpRepo = AppDataSource.getRepository(CorpEmp);
  private CorpEmpReqRepo = AppDataSource.getRepository(CorpEmpReq);
  private WithdrawalRepo = AppDataSource.getRepository(Withdrawal);
  private codes = response.CODES;
  private messages = response.MESSAGES;
  private status = constant.STATUS;
  private kobbleApiService = KobbleApiService.getInstance();

  /**
   * GET /admin/analytics/dashboard - Get admin dashboard analytics
   * Returns:
   * - Account Balance (sum of all corporate account balances or a single admin balance)
   * - Total Corporates count
   * - Total Employees count
   * - Total Requests count (withdrawal requests)
   * - Total Disbursed amount (approved/completed withdrawals)
   */
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      // Count total corporates (active only)
      const totalCorporates = await this.CorporateRepo.count({
        where: { corpStatus: this.status.ACTIVE.ID }
      });

      // Count total employees (active only)
      const totalEmployees = await this.CorpEmpRepo.count({
        where: { corpEmpStatus: this.status.ACTIVE.ID }
      });

      // Count total withdrawal requests (all statuses)
      const totalRequests = await this.WithdrawalRepo.count();

      // Calculate total disbursed amount (approved/completed withdrawals only)
      const disbursedResult = await this.WithdrawalRepo.createQueryBuilder('withdrawal').select('COALESCE(SUM(withdrawal.amount), 0)', 'totalDisbursed').where('withdrawal.status = :status', { status: TRANSACTION_STATUS.COMPLETED }).getRawOne();

      const totalDisbursed = Number(disbursedResult?.totalDisbursed || 0);

      // Get account balance from Kobble wallet API
      let accountBalance = 0.0;
      try {
        accountBalance = await this.kobbleApiService.getWalletBalance();
        console.log('Kobble wallet balance retrieved:', accountBalance);
      } catch (walletError: any) {
        // Log the error but don't fail the entire request
        console.error('Failed to fetch wallet balance from Kobble:', walletError.message);
        // accountBalance remains 0.00 as fallback
      }

      const dashboardData = {
        accountBalance: Number(accountBalance.toFixed(2)),
        totalCorporates,
        totalEmployees,
        totalRequests,
        totalDisbursed: Number(totalDisbursed.toFixed(2))
      };

      return responseFormatter.success(req, res, 200, dashboardData, true, this.codes.SUCCESS, 'Dashboard analytics retrieved successfully');
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * GET /admin/analytics/overview - Get detailed analytics overview
   * Includes additional metrics and breakdowns
   */
  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      // Get date range from query params (default to current month)
      const { startDate, endDate } = req.query;

      const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate ? new Date(endDate as string) : new Date();

      // Total corporates breakdown
      const activeCorporates = await this.CorporateRepo.count({
        where: { corpStatus: this.status.ACTIVE.ID }
      });

      const inactiveCorporates = await this.CorporateRepo.count({
        where: { corpStatus: this.status.INACTIVE.ID }
      });

      // Total employees breakdown
      const activeEmployees = await this.CorpEmpRepo.count({
        where: { corpEmpStatus: this.status.ACTIVE.ID }
      });

      const inactiveEmployees = await this.CorpEmpRepo.count({
        where: { corpEmpStatus: this.status.INACTIVE.ID }
      });

      // Withdrawal requests breakdown by status
      const pendingRequests = await this.WithdrawalRepo.count({
        where: { status: TRANSACTION_STATUS.PENDING }
      });

      const approvedRequests = await this.WithdrawalRepo.count({
        where: { status: TRANSACTION_STATUS.COMPLETED }
      });

      const rejectedRequests = await this.WithdrawalRepo.count({
        where: { status: TRANSACTION_STATUS.FAILED }
      });

      // Disbursement metrics for the date range
      const disbursementInRange = await this.WithdrawalRepo.createQueryBuilder('withdrawal')
        .select('COALESCE(SUM(withdrawal.amount), 0)', 'totalAmount')
        .addSelect('COUNT(*)', 'totalCount')
        .where('withdrawal.status = :status', { status: TRANSACTION_STATUS.COMPLETED })
        .andWhere('withdrawal.processedAt BETWEEN :start AND :end', {
          start: start.toISOString(),
          end: end.toISOString()
        })
        .getRawOne();

      // Average withdrawal amount
      const avgWithdrawal = await this.WithdrawalRepo.createQueryBuilder('withdrawal').select('COALESCE(AVG(withdrawal.amount), 0)', 'avgAmount').where('withdrawal.status = :status', { status: TRANSACTION_STATUS.COMPLETED }).getRawOne();

      const overviewData = {
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        corporates: {
          total: activeCorporates + inactiveCorporates,
          active: activeCorporates,
          inactive: inactiveCorporates
        },
        employees: {
          total: activeEmployees + inactiveEmployees,
          active: activeEmployees,
          inactive: inactiveEmployees
        },
        requests: {
          total: pendingRequests + approvedRequests + rejectedRequests,
          pending: pendingRequests,
          approved: approvedRequests,
          rejected: rejectedRequests
        },
        disbursements: {
          totalAmount: Number(disbursementInRange?.totalAmount || 0),
          totalCount: Number(disbursementInRange?.totalCount || 0),
          averageAmount: Number(avgWithdrawal?.avgAmount || 0),
          periodStart: start.toISOString(),
          periodEnd: end.toISOString()
        }
      };

      return responseFormatter.success(req, res, 200, overviewData, true, this.codes.SUCCESS, 'Analytics overview retrieved successfully');
    } catch (error) {
      console.error('Error fetching analytics overview:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * GET /admin/analytics/recent-activity - Get recent activity feed
   */
  async getRecentActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit = 10 } = req.query;

      // Get recent withdrawal requests
      const recentWithdrawals = await this.WithdrawalRepo.createQueryBuilder('withdrawal').leftJoinAndSelect('withdrawal.corpEmpId', 'employee').leftJoinAndSelect('withdrawal.bankAccountId', 'bankAccount').orderBy('withdrawal.createdAt', 'DESC').limit(Number(limit)).getMany();

      const activities = recentWithdrawals.map((withdrawal) => ({
        id: withdrawal.withdrawalId,
        type: 'withdrawal_request',
        employeeName: withdrawal.corpEmpId?.corpEmpName || 'Unknown',
        employeeEmail: withdrawal.corpEmpId?.corpEmpEmail || '',
        amount: Number(withdrawal.amount),
        status: withdrawal.status,
        purpose: withdrawal.purpose,
        createdAt: withdrawal.createdAt.toISOString()
      }));

      return responseFormatter.success(req, res, 200, { activities }, true, this.codes.SUCCESS, 'Recent activity retrieved successfully');
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * GET /admin/analytics/trends - Get trends data for charts
   */
  async getTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const { period = '30' } = req.query; // days
      const days = Number(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get daily withdrawal trends
      const dailyWithdrawals = await this.WithdrawalRepo.createQueryBuilder('withdrawal').select('DATE(withdrawal.createdAt)', 'date').addSelect('COUNT(*)', 'count').addSelect('COALESCE(SUM(withdrawal.amount), 0)', 'totalAmount').where('withdrawal.createdAt >= :startDate', { startDate: startDate.toISOString() }).groupBy('DATE(withdrawal.createdAt)').orderBy('DATE(withdrawal.createdAt)', 'ASC').getRawMany();

      // Get daily employee registrations
      const dailyEmployees = await this.CorpEmpRepo.createQueryBuilder('employee').select('DATE(employee.corpEmpCreatedDate)', 'date').addSelect('COUNT(*)', 'count').where('employee.corpEmpCreatedDate >= :startDate', { startDate: startDate.toISOString() }).groupBy('DATE(employee.corpEmpCreatedDate)').orderBy('DATE(employee.corpEmpCreatedDate)', 'ASC').getRawMany();

      const trendsData = {
        period: days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        withdrawals: dailyWithdrawals.map((row) => ({
          date: row.date,
          count: Number(row.count),
          totalAmount: Number(row.totalAmount)
        })),
        employees: dailyEmployees.map((row) => ({
          date: row.date,
          count: Number(row.count)
        }))
      };

      return responseFormatter.success(req, res, 200, trendsData, true, this.codes.SUCCESS, 'Trends data retrieved successfully');
    } catch (error) {
      console.error('Error fetching trends data:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }
}
