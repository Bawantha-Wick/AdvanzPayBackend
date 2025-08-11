import { NextFunction, Request, Response } from 'express';
import AppDataSource from '../../data-source';
import CorpEmp from '../../entity/CorpEmp';
import Transaction from '../../entity/Transaction';
import { TRANSACTION_TYPE, TRANSACTION_STATUS } from '../../entity/Transaction';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';

type CorpEmpTyp = InstanceType<typeof CorpEmp>;

interface DashboardResultInt {
  totalEarnings: number;
  availableToWithdraw: number;
  withdrawn: number;
}

export default class DashboardController {
  private CorpEmpRepo = AppDataSource.getRepository(CorpEmp);
  private TransactionRepo = AppDataSource.getRepository(Transaction);
  private codes = response.CODES;
  private messages = response.MESSAGES;
  private status = constant.STATUS;

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any)?.user_code; // From auth middleware

      if (!userId) {
        // return responseFormatter.error(req, res, {
        //   statusCode: 401,
        //   status: false,
        //   message: 'Unauthorized'
        // });
      }

      const employee: CorpEmpTyp | null = await this.CorpEmpRepo.findOne({
        where: { corpEmpId: parseInt(userId) },
        relations: ['corpId']
      });

      if (!employee) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.EMPLOYEE_NOT_FOUND
        });
      }

      // Calculate earnings for current cycle (month)
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Get total earnings (salary + bonuses)
      const earningsQuery = `
        SELECT 
          COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as totalEarnings,
          COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as withdrawn
        FROM apt_transaction 
        WHERE corpEmpId = ? 
        AND status = ?
        AND createdAt >= ? 
        AND createdAt <= ?
      `;

      const earningsResult: any[] = await AppDataSource.query(earningsQuery, [parseInt(userId), TRANSACTION_STATUS.COMPLETED, startOfMonth, endOfMonth]);

      const totalEarnings = parseFloat(earningsResult[0]?.totalEarnings || '0');
      const withdrawn = parseFloat(earningsResult[0]?.withdrawn || '0');
      const availableToWithdraw = Math.max(totalEarnings - withdrawn, 0);

      const monthlyGoalQuery = `
        SELECT 
            SUM(targetAmount) AS planedAmt,
            COUNT(*) AS totalGoals,
            YEAR(startDate) AS year,
            MONTH(startDate) AS month
        FROM apt_goal 
        WHERE 
            status = 1
            AND YEAR(startDate) = YEAR(CURRENT_DATE()) 
            AND MONTH(startDate) = MONTH(CURRENT_DATE())
        GROUP BY 
            YEAR(startDate), 
            MONTH(startDate)
        ORDER BY 
            year DESC, 
            month DESC;
      `;
      const monthlyGoalResult: any[] = await AppDataSource.query(monthlyGoalQuery);

      const plannedAmount = parseFloat(monthlyGoalResult[0]?.planedAmt || '0');

      const dashboardData = {
        availableToWithdraw: employee.corpEmpMonthlyRmnAmt || 0,
        cycleEarnings: plannedAmount,
        withdrawn: employee.corpEmpMonthlyWtdAmt || 0,
        attendanceCycle: {
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfMonth.toISOString().split('T')[0]
        },
        currency: 'USD',
        plannedAmount
      };

      return responseFormatter.success(req, res, 200, dashboardData, true, this.codes.SUCCESS, this.messages.DASHBOARD_DATA_RETRIEVED);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async getRecentTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any)?.user_code; // From auth middleware
      const { limit = 5 } = req.query;

      if (!userId) {
        // return responseFormatter.error(req, res, {
        //   statusCode: 401,
        //   status: false,
        //   message: 'Unauthorized'
        // });
      }

      const transactions = await this.TransactionRepo.find({
        where: { corpEmpId: { corpEmpId: parseInt(userId) } },
        order: { createdAt: 'DESC' },
        take: parseInt(limit as string)
      });

      const formattedTransactions = transactions.map((transaction) => ({
        id: transaction.transactionId.toString(),
        title: transaction.title,
        date: transaction.createdAt.toISOString().split('T')[0],
        amount: transaction.amount > 0 ? `+${transaction.amount.toFixed(2)}` : transaction.amount.toFixed(2),
        status: transaction.status,
        type: transaction.type,
        verified: transaction.verified.toString()
      }));

      return responseFormatter.success(req, res, 200, formattedTransactions, true, this.codes.SUCCESS, this.messages.RECENT_TRANSACTIONS_RETRIEVED);
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }
}
