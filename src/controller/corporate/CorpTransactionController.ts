import { NextFunction, Request, Response } from 'express';
import AppDataSource from '../../data-source';
import Transaction from '../../entity/Transaction';
import CorpEmp from '../../entity/CorpEmp';
import Corporate from '../../entity/Corporate';
import { TRANSACTION_STATUS } from '../../entity/Transaction';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';

export default class CorpTransactionController {
  private TransactionRepo = AppDataSource.getRepository(Transaction);
  private CorpEmpRepo = AppDataSource.getRepository(CorpEmp);
  private CorporateRepo = AppDataSource.getRepository(Corporate);
  private codes = response.CODES;
  private messages = response.MESSAGES;
  private status = constant.STATUS;

  /**
   * GET /corp/transactions?corpId=123&page=1&limit=10&status=pending&type=withdrawal
   * Returns all transactions for a corporate organization with pagination and filtering
   */
  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any)?.user_code; // From auth middleware
      const limit = '5';
      const { page = 1, status: filterStatus, type } = req.query;

      if (!userId) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'userId is required'
        });
      }

      const corpId = req.corp.corpId;

      const corpIdNum = Number(corpId);
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Verify corporate exists
      const corporate = await this.CorporateRepo.findOne({
        where: { corpId: corpIdNum }
      });

      if (!corporate) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: 'Corporate not found'
        });
      }

      // Build query using query builder
      const queryBuilder = this.TransactionRepo.createQueryBuilder('transaction').leftJoinAndSelect('transaction.corpEmpId', 'corpEmp').leftJoinAndSelect('transaction.bankAccountId', 'bankAccount').leftJoinAndSelect('transaction.goalId', 'goal').leftJoinAndSelect('corpEmp.corpId', 'corporate').where('corporate.corpId = :corpId', { corpId: corpIdNum }).orderBy('transaction.createdAt', 'DESC').take(limitNum).skip(skip);

      if (filterStatus) {
        queryBuilder.andWhere('transaction.status = :status', { status: filterStatus });
      }

      if (type) {
        queryBuilder.andWhere('transaction.type = :type', { type });
      }

      const [transactions, total] = await queryBuilder.getManyAndCount();

      const formattedTransactions = transactions.map((transaction) => {
        const amount = parseFloat(transaction.amount.toString());
        return {
          id: transaction.transactionId,
          title: transaction.title,
          description: transaction.description,
          amount: amount,
          type: transaction.type,
          status: transaction.status,
          verified: transaction.verified,
          referenceNumber: transaction.referenceNumber,
          notes: transaction.notes,
          employee: {
            id: transaction.corpEmpId.corpEmpId,
            name: transaction.corpEmpId.corpEmpName,
            email: transaction.corpEmpId.corpEmpEmail
          },
          bankAccount: transaction.bankAccountId
            ? {
                id: transaction.bankAccountId.bankAccountId,
                accountNumber: transaction.bankAccountId.accountNumber,
                holderName: transaction.bankAccountId.holderName,
                bankName: transaction.bankAccountId.bankName,
                branch: transaction.bankAccountId.branch
              }
            : null,
          goal: transaction.goalId
            ? {
                id: transaction.goalId.goalId,
                name: transaction.goalId.name,
                targetAmount: transaction.goalId.targetAmount,
                currentAmount: transaction.goalId.currentAmount
              }
            : null,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        };
      });

      const totalPages = Math.ceil(total / limitNum);

      const result = {
        data: formattedTransactions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages
        }
      };

      return responseFormatter.success(req, res, 200, result, true, this.codes.SUCCESS, 'Corporate transactions retrieved successfully');
    } catch (error) {
      console.error('Error fetching corporate transactions:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * PUT /corp/transactions/approve-reject
   * Approve or reject a transaction with remarks
   * Body: { transactionId: number, action: 'approve' | 'reject', remark: string }
   */
  async approveRejectTransaction(req: Request, res: Response, next: NextFunction) {
    try {
      const { transactionId, action, remark } = req.body;
      const userId = (req as any)?.user_code || 1; // From auth middleware, fallback to 1

      // Validate required fields
      if (!transactionId || !action || !remark) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'transactionId, action, and remark are required'
        });
      }

      // Validate action
      if (!['approve', 'reject'].includes(action)) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'action must be either "approve" or "reject"'
        });
      }

      // Find the transaction with employee and corporate details
      const transaction = await this.TransactionRepo.findOne({
        where: { transactionId: Number(transactionId) },
        relations: ['corpEmpId', 'corpEmpId.corpId']
      });

      if (!transaction) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: 'Transaction not found'
        });
      }

      // Check if transaction is in pending status
      if (transaction.status !== TRANSACTION_STATUS.PENDING) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Only pending transactions can be approved or rejected'
        });
      }

      // Update transaction status and add remark
      transaction.status = action === 'approve' ? TRANSACTION_STATUS.COMPLETED : TRANSACTION_STATUS.CANCELLED;
      transaction.notes = remark;
      transaction.lastUpdatedBy = Number(userId);
      transaction.verified = action === 'approve';

      const updatedTransaction = await this.TransactionRepo.save(transaction);

      const result = {
        transactionId: updatedTransaction.transactionId,
        status: updatedTransaction.status,
        verified: updatedTransaction.verified,
        notes: updatedTransaction.notes,
        action: action,
        updatedAt: updatedTransaction.updatedAt
      };

      return responseFormatter.success(req, res, 200, result, true, this.codes.SUCCESS, `Transaction ${action}d successfully`);
    } catch (error) {
      console.error('Error approving/rejecting transaction:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * GET /corp/transactions/employee/:employeeId?status=&type=&page=&limit=
   * Returns transactions for a specific employee within the corporate
   */
  async getTransactionsByEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.params;
      const { page = 1, status: filterStatus, type } = req.query;

      if (!employeeId) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'employeeId is required'
        });
      }

      const corpId = req.corp.corpId;
      const corpIdNum = Number(corpId);
      const pageNum = parseInt(page as string);
      const limitNum = parseInt((req.query.limit as string) || '5');
      const skip = (pageNum - 1) * limitNum;

      // Verify corporate exists
      const corporate = await this.CorporateRepo.findOne({ where: { corpId: corpIdNum } });
      if (!corporate) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: 'Corporate not found'
        });
      }

      // Verify employee belongs to this corporate
      const corpEmp = await this.CorpEmpRepo.findOne({ where: { corpEmpId: Number(employeeId), corpId: { corpId: corpIdNum } }, relations: ['corpId'] });
      if (!corpEmp) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: 'Employee not found for this corporate'
        });
      }

      // Build query
      const queryBuilder = this.TransactionRepo.createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.corpEmpId', 'corpEmp')
        .leftJoinAndSelect('transaction.bankAccountId', 'bankAccount')
        .leftJoinAndSelect('transaction.goalId', 'goal')
        .leftJoinAndSelect('corpEmp.corpId', 'corporate')
        .where('corporate.corpId = :corpId', { corpId: corpIdNum })
        .andWhere('corpEmp.corpEmpId = :corpEmpId', { corpEmpId: Number(employeeId) })
        .orderBy('transaction.createdAt', 'DESC')
        .take(limitNum)
        .skip(skip);

      if (filterStatus) {
        queryBuilder.andWhere('transaction.status = :status', { status: filterStatus });
      }

      if (type) {
        queryBuilder.andWhere('transaction.type = :type', { type });
      }

      const [transactions, total] = await queryBuilder.getManyAndCount();

      const formattedTransactions = transactions.map((transaction) => {
        const amount = parseFloat(transaction.amount.toString());
        return {
          id: transaction.transactionId,
          title: transaction.title,
          description: transaction.description,
          amount: amount,
          type: transaction.type,
          status: transaction.status,
          verified: transaction.verified,
          referenceNumber: transaction.referenceNumber,
          notes: transaction.notes,
          employee: {
            id: transaction.corpEmpId.corpEmpId,
            name: transaction.corpEmpId.corpEmpName,
            email: transaction.corpEmpId.corpEmpEmail
          },
          bankAccount: transaction.bankAccountId
            ? {
                id: transaction.bankAccountId.bankAccountId,
                accountNumber: transaction.bankAccountId.accountNumber,
                holderName: transaction.bankAccountId.holderName,
                bankName: transaction.bankAccountId.bankName,
                branch: transaction.bankAccountId.branch
              }
            : null,
          goal: transaction.goalId
            ? {
                id: transaction.goalId.goalId,
                name: transaction.goalId.name,
                targetAmount: transaction.goalId.targetAmount,
                currentAmount: transaction.goalId.currentAmount
              }
            : null,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        };
      });

      const totalPages = Math.ceil(total / limitNum);

      const result = {
        data: formattedTransactions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages
        }
      };

      return responseFormatter.success(req, res, 200, result, true, this.codes.SUCCESS, 'Employee transactions retrieved successfully');
    } catch (error) {
      console.error('Error fetching employee transactions:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }
}
