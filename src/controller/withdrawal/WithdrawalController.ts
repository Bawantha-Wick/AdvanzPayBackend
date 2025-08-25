import { NextFunction, Request, Response } from 'express';
import AppDataSource from '../../data-source';
import Goal from '../../entity/Goal';
import CorpEmp from '../../entity/CorpEmp';
import BankAccount from '../../entity/BankAccount';
import Withdrawal from '../../entity/Withdrawal';
import Transaction from '../../entity/Transaction';
import { WITHDRAWAL_PURPOSE } from '../../entity/Withdrawal';
import { TRANSACTION_TYPE, TRANSACTION_STATUS } from '../../entity/Transaction';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';

type CorpEmpTyp = InstanceType<typeof CorpEmp>;
type BankAccountTyp = InstanceType<typeof BankAccount>;
type WithdrawalTyp = InstanceType<typeof Withdrawal>;
type TransactionTyp = InstanceType<typeof Transaction>;

export default class WithdrawalController {
  private CorpEmpRepo = AppDataSource.getRepository(CorpEmp);
  private BankAccountRepo = AppDataSource.getRepository(BankAccount);
  private WithdrawalRepo = AppDataSource.getRepository(Withdrawal);
  private TransactionRepo = AppDataSource.getRepository(Transaction);
  private GoalRepo = AppDataSource.getRepository(Goal);
  private codes = response.CODES;
  private messages = response.MESSAGES;
  private status = constant.STATUS;

  // Configuration constants
  private readonly MIN_WITHDRAWAL = 50;
  private readonly MAX_WITHDRAWAL = 5000;

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any)?.user_code; // From auth middleware
      const { purpose, amount, accountId, notes } = req.body;

      if (!userId) {
        // return responseFormatter.error(req, res, {
        //   statusCode: 401,
        //   status: false,
        //   message: 'Unauthorized'
        // });
      }

      if (!purpose || !amount || !accountId) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Purpose, amount, and account ID are required'
        });
      }

      const withdrawalAmount = parseFloat(amount);

      // Validate withdrawal amount
      // if (withdrawalAmount < this.MIN_WITHDRAWAL || withdrawalAmount > this.MAX_WITHDRAWAL) {
      //   return responseFormatter.error(req, res, {
      //     statusCode: 400,
      //     status: false,
      //     message: `Withdrawal amount must be between ${this.MIN_WITHDRAWAL} and ${this.MAX_WITHDRAWAL}`
      //   });
      // }

      const employee: CorpEmpTyp | null = await this.CorpEmpRepo.findOne({
        where: { corpEmpId: parseInt(userId) }
      });

      if (!employee) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.EMPLOYEE_NOT_FOUND
        });
      }

      const bankAccount: BankAccountTyp | null = await this.BankAccountRepo.createQueryBuilder('bankAccount')
        .where('bankAccount.bankAccountId = :accountId', { accountId: parseInt(accountId) })
        .andWhere('bankAccount.corpEmpId = :userId', { userId: parseInt(userId) })
        .andWhere('bankAccount.status = :status', { status: this.status.ACTIVE.ID })
        .getOne();

      if (!bankAccount) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.BANK_ACCOUNT_NOT_FOUND
        });
      }

      // Check available balance
      // const availableAmount = await this.getAvailableBalance(parseInt(userId));
      const availableAmount = employee.corpEmpMonthlyRmnAmt;

      if (withdrawalAmount > availableAmount) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Insufficient available balance for withdrawal'
        });
      }

      // Generate reference number
      const referenceNumber = this.generateReferenceNumber();

      // Create withdrawal record
      const newWithdrawal = new Withdrawal();
      newWithdrawal.corpEmpId = employee;
      newWithdrawal.bankAccountId = bankAccount;
      newWithdrawal.amount = withdrawalAmount;
      newWithdrawal.purpose = purpose as WITHDRAWAL_PURPOSE;
      newWithdrawal.status = TRANSACTION_STATUS.COMPLETED;
      newWithdrawal.notes = notes;
      newWithdrawal.referenceNumber = referenceNumber;
      newWithdrawal.createdBy = parseInt(userId);
      newWithdrawal.lastUpdatedBy = parseInt(userId);

      const savedWithdrawal = await this.WithdrawalRepo.save(newWithdrawal);

      // Create corresponding transaction record
      const newTransaction = new Transaction();
      newTransaction.corpEmpId = employee;
      newTransaction.bankAccountId = bankAccount;
      newTransaction.title = `Withdrawal - ${purpose}`;
      newTransaction.description = notes;
      newTransaction.amount = withdrawalAmount; // Negative amount for withdrawal
      newTransaction.type = TRANSACTION_TYPE.WITHDRAWAL;
      newTransaction.status = TRANSACTION_STATUS.COMPLETED;
      newTransaction.verified = false;
      newTransaction.referenceNumber = referenceNumber;
      newTransaction.notes = notes;
      newTransaction.createdBy = parseInt(userId);
      newTransaction.lastUpdatedBy = parseInt(userId);

      const savedTransaction = await this.TransactionRepo.save(newTransaction);

      const formattedTransaction = {
        id: savedTransaction.transactionId.toString(),
        title: savedTransaction.title,
        date: savedTransaction.createdAt.toISOString().split('T')[0],
        amount: savedTransaction.amount.toFixed(2),
        status: savedTransaction.status,
        type: savedTransaction.type,
        verified: savedTransaction.verified.toString()
      };

      const isNumeric = (value: string) => (isNaN(Number(value)) ? false : true);

      if (isNumeric(purpose)) {
        const goalInfo = await this.GoalRepo.findOne({
          where: { goalId: parseInt(purpose) },
          order: { createdAt: 'DESC' }
        });

        if (goalInfo) {
          goalInfo.currentAmount = Number(goalInfo.currentAmount) + withdrawalAmount;
          await this.GoalRepo.save(goalInfo);
        }
      }

      // Update employee's monthly withdrawn amount and remaining amount
      employee.corpEmpMonthlyWtdAmt = Number(employee.corpEmpMonthlyWtdAmt) + withdrawalAmount;
      employee.corpEmpMonthlyRmnAmt = Number(employee.corpEmpMonthlyRmnAmt) - withdrawalAmount;

      await this.CorpEmpRepo.save(employee);

      return responseFormatter.success(req, res, 201, formattedTransaction, true, this.codes.SUCCESS, this.messages.WITHDRAWAL_CREATED);
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any)?.user_code; // From auth middleware
      const { page = 1, limit = 10 } = req.query;

      if (!userId) {
        // return responseFormatter.error(req, res, {
        //   statusCode: 401,
        //   status: false,
        //   message: 'Unauthorized'
        // });
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const [withdrawals, total] = await this.WithdrawalRepo.findAndCount({
        where: { corpEmpId: { corpEmpId: parseInt(userId) } },
        relations: ['bankAccountId'],
        order: { createdAt: 'DESC' },
        take: limitNum,
        skip: skip
      });

      const formattedWithdrawals = withdrawals.map((withdrawal) => ({
        id: withdrawal.withdrawalId.toString(),
        title: `Withdrawal - ${withdrawal.purpose}`,
        date: withdrawal.createdAt.toISOString().split('T')[0],
        amount: `-${withdrawal.amount.toFixed(2)}`,
        status: withdrawal.status,
        type: 'withdrawal',
        verified: 'false' // Withdrawals are not verified until processed
      }));

      const totalPages = Math.ceil(total / limitNum);

      const result = {
        data: formattedWithdrawals,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      };

      return responseFormatter.success(req, res, 200, result, true, this.codes.SUCCESS, this.messages.WITHDRAWALS_RETRIEVED);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any)?.user_code; // From auth middleware
      const { id } = req.params;

      if (!userId) {
        // return responseFormatter.error(req, res, {
        //   statusCode: 401,
        //   status: false,
        //   message: 'Unauthorized'
        // });
      }

      const withdrawal: WithdrawalTyp | null = await this.WithdrawalRepo.findOne({
        where: {
          withdrawalId: parseInt(id),
          corpEmpId: { corpEmpId: parseInt(userId) }
        },
        relations: ['bankAccountId']
      });

      if (!withdrawal) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.WITHDRAWAL_NOT_FOUND
        });
      }

      const formattedWithdrawal = {
        id: withdrawal.withdrawalId.toString(),
        title: `Withdrawal - ${withdrawal.purpose}`,
        date: withdrawal.createdAt.toISOString().split('T')[0],
        amount: `-${withdrawal.amount.toFixed(2)}`,
        status: withdrawal.status,
        type: 'withdrawal',
        verified: 'false'
      };

      return responseFormatter.success(req, res, 200, formattedWithdrawal, true, this.codes.SUCCESS, this.messages.WITHDRAWALS_RETRIEVED);
    } catch (error) {
      console.error('Error fetching withdrawal:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any)?.user_code; // From auth middleware
      const { id } = req.params;

      if (!userId) {
        // return responseFormatter.error(req, res, {
        //   statusCode: 401,
        //   status: false,
        //   message: 'Unauthorized'
        // });
      }

      const withdrawal: WithdrawalTyp | null = await this.WithdrawalRepo.findOne({
        where: {
          withdrawalId: parseInt(id),
          corpEmpId: { corpEmpId: parseInt(userId) }
        },
        relations: ['bankAccountId']
      });

      if (!withdrawal) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.WITHDRAWAL_NOT_FOUND
        });
      }

      // Can only cancel pending withdrawals
      if (withdrawal.status !== TRANSACTION_STATUS.PENDING) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Only pending withdrawals can be cancelled'
        });
      }

      // Update withdrawal status
      withdrawal.status = TRANSACTION_STATUS.CANCELLED;
      withdrawal.lastUpdatedBy = parseInt(userId);
      await this.WithdrawalRepo.save(withdrawal);

      // Update corresponding transaction
      const transaction = await this.TransactionRepo.findOne({
        where: {
          referenceNumber: withdrawal.referenceNumber,
          corpEmpId: { corpEmpId: parseInt(userId) }
        }
      });

      if (transaction) {
        transaction.status = TRANSACTION_STATUS.CANCELLED;
        transaction.lastUpdatedBy = parseInt(userId);
        await this.TransactionRepo.save(transaction);
      }

      const formattedWithdrawal = {
        id: withdrawal.withdrawalId.toString(),
        title: `Withdrawal - ${withdrawal.purpose}`,
        date: withdrawal.createdAt.toISOString().split('T')[0],
        amount: `-${withdrawal.amount.toFixed(2)}`,
        status: withdrawal.status,
        type: 'withdrawal',
        verified: 'false'
      };

      return responseFormatter.success(req, res, 200, formattedWithdrawal, true, this.codes.SUCCESS, this.messages.WITHDRAWAL_CANCELLED);
    } catch (error) {
      console.error('Error cancelling withdrawal:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async getLimits(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any)?.user_code; // From auth middleware

      if (!userId) {
        // return responseFormatter.error(req, res, {
        //   statusCode: 401,
        //   status: false,
        //   message: 'Unauthorized'
        // });
      }

      const availableAmount = await this.getAvailableBalance(parseInt(userId));

      const limits = {
        min: this.MIN_WITHDRAWAL,
        max: this.MAX_WITHDRAWAL,
        available: availableAmount
      };

      return responseFormatter.success(req, res, 200, limits, true, this.codes.SUCCESS, this.messages.WITHDRAWAL_LIMITS_RETRIEVED);
    } catch (error) {
      console.error('Error fetching withdrawal limits:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  private async getAvailableBalance(userId: number): Promise<number> {
    try {
      // Calculate available balance from completed transactions
      const result = await AppDataSource.query(
        `
        SELECT 
          COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as totalEarnings,
          COALESCE(SUM(CASE WHEN amount < 0 AND status = ? THEN ABS(amount) ELSE 0 END), 0) as withdrawn
        FROM apt_transaction 
        WHERE corpEmpId = ? 
        AND status = ?
      `,
        [TRANSACTION_STATUS.COMPLETED, userId, TRANSACTION_STATUS.COMPLETED]
      );

      const totalEarnings = parseFloat(result[0]?.totalEarnings || '0');
      const withdrawn = parseFloat(result[0]?.withdrawn || '0');

      return Math.max(totalEarnings - withdrawn, 0);
    } catch (error) {
      console.error('Error calculating available balance:', error);
      return 0;
    }
  }

  private generateReferenceNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `WD${timestamp}${random}`;
  }
}
