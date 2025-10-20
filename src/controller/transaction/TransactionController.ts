import { NextFunction, Request, Response } from 'express';
import AppDataSource from '../../data-source';
import CorpEmp from '../../entity/CorpEmp';
import Transaction from '../../entity/Transaction';
import { TRANSACTION_TYPE, TRANSACTION_STATUS } from '../../entity/Transaction';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';

type CorpEmpTyp = InstanceType<typeof CorpEmp>;
type TransactionTyp = InstanceType<typeof Transaction>;

export default class TransactionController {
  private CorpEmpRepo = AppDataSource.getRepository(CorpEmp);
  private TransactionRepo = AppDataSource.getRepository(Transaction);
  private codes = response.CODES;
  private messages = response.MESSAGES;
  private status = constant.STATUS;

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any)?.user_code; // From auth middleware
      const { page = 1, limit = 10, type, status: filterStatus } = req.query;

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

      // Build query using query builder
      const queryBuilder = this.TransactionRepo.createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.corpEmpId', 'corpEmp')
        .leftJoinAndSelect('transaction.bankAccountId', 'bankAccount')
        .leftJoinAndSelect('transaction.goalId', 'goal')
        .where('corpEmp.corpEmpId = :userId', { userId: parseInt(userId) })
        .orderBy('transaction.createdAt', 'DESC')
        // .take(limitNum)
        // .skip(skip);
        .take(1000)
        .skip(5);

      if (type) {
        queryBuilder.andWhere('transaction.type = :type', { type });
      }

      if (filterStatus) {
        queryBuilder.andWhere('transaction.status = :status', { status: filterStatus });
      }

      const [transactions, total] = await queryBuilder.getManyAndCount();

      const formattedTransactions = transactions.map((transaction) => {
        const amount = parseFloat(transaction.amount.toString());
        return {
          id: transaction.transactionId.toString(),
          title: transaction.title,
          date: transaction.createdAt.toISOString().split('T')[0],
          amount: amount > 0 ? `+${amount.toFixed(2)}` : amount.toFixed(2),
          status:
            transaction.status === 'completed' //
              ? 'Completed'
              : transaction.status === 'pending'
              ? 'Pending'
              : transaction.status === 'cancelled'
              ? 'Cancelled'
              : 'Failed',
          type: transaction.type,
          verified: transaction.verified.toString()
        };
      });

      const totalPages = Math.ceil(total / limitNum);

      const result = {
        data: formattedTransactions,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      };

      return responseFormatter.success(req, res, 200, result, true, this.codes.SUCCESS, this.messages.TRANSACTIONS_RETRIEVED);
    } catch (error) {
      console.error('Error fetching transactions:', error);
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

      const transaction: TransactionTyp | null = await this.TransactionRepo.findOne({
        where: {
          transactionId: parseInt(id),
          corpEmpId: { corpEmpId: parseInt(userId) }
        },
        relations: ['bankAccountId', 'goalId']
      });

      if (!transaction) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.TRANSACTION_NOT_FOUND
        });
      }

      const amount = parseFloat(transaction.amount.toString());
      const formattedTransaction = {
        id: transaction.transactionId.toString(),
        title: transaction.title,
        date: transaction.createdAt.toISOString().split('T')[0],
        amount: amount > 0 ? `+${amount.toFixed(2)}` : amount.toFixed(2),
        status: transaction.status,
        type: transaction.type,
        verified: transaction.verified.toString()
      };

      return responseFormatter.success(req, res, 200, formattedTransaction, true, this.codes.SUCCESS, this.messages.TRANSACTION_RETRIEVED);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async getRecent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any)?.user_code; // From auth middleware
      const { limit = 5 } = req.query;

      if (!userId) {
        return responseFormatter.error(req, res, {
          statusCode: 401,
          status: false,
          message: 'Unauthorized'
        });
      }

      // const limitNum = parseInt(limit as string);
      const limitNum = 5;

      const transactions = await this.TransactionRepo.createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.corpEmpId', 'corpEmp')
        .leftJoinAndSelect('transaction.bankAccountId', 'bankAccount')
        .leftJoinAndSelect('transaction.goalId', 'goal')
        .where('corpEmp.corpEmpId = :userId', { userId: parseInt(userId) })
        .orderBy('transaction.createdAt', 'DESC')
        .take(limitNum)
        .getMany();

      const formattedTransactions = transactions.map((transaction) => {
        const amount = parseFloat(transaction.amount.toString());
        return {
          id: transaction.transactionId.toString(),
          title: transaction.title,
          date: transaction.createdAt.toISOString().split('T')[0],
          amount: amount > 0 ? `+${amount.toFixed(2)}` : amount.toFixed(2),
          status:
            transaction.status === 'completed' //
              ? 'Completed'
              : transaction.status === 'pending'
              ? 'Pending'
              : transaction.status === 'cancelled'
              ? 'Cancelled'
              : 'Failed',
          type: transaction.type,
          verified: transaction.verified.toString()
        };
      });

      return responseFormatter.success(req, res, 200, formattedTransactions, true, this.codes.SUCCESS, this.messages.TRANSACTIONS_RETRIEVED);
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any)?.user_code; // From auth middleware
      const { q: query, page = 1, limit = 10 } = req.query;

      if (!userId) {
        // return responseFormatter.error(req, res, {
        //   statusCode: 401,
        //   status: false,
        //   message: 'Unauthorized'
        // });
      }

      if (!query) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Search query is required'
        });
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Use query builder for search functionality
      const queryBuilder = this.TransactionRepo.createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.corpEmpId', 'corpEmp')
        .leftJoinAndSelect('transaction.bankAccountId', 'bankAccount')
        .leftJoinAndSelect('transaction.goalId', 'goal')
        .where('corpEmp.corpEmpId = :userId', { userId: parseInt(userId) })
        .andWhere('(transaction.title LIKE :query OR transaction.description LIKE :query)', {
          query: `%${query}%`
        })
        .orderBy('transaction.createdAt', 'DESC')
        .take(limitNum)
        .skip(skip);

      const [transactions, total] = await queryBuilder.getManyAndCount();

      const formattedTransactions = transactions.map((transaction) => {
        const amount = parseFloat(transaction.amount.toString());
        return {
          id: transaction.transactionId.toString(),
          title: transaction.title,
          date: transaction.createdAt.toISOString().split('T')[0],
          amount: amount > 0 ? `+${amount.toFixed(2)}` : amount.toFixed(2),
          status: transaction.status,
          type: transaction.type,
          verified: transaction.verified.toString()
        };
      });

      const totalPages = Math.ceil(total / limitNum);

      const result = {
        data: formattedTransactions,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      };

      return responseFormatter.success(req, res, 200, result, true, this.codes.SUCCESS, this.messages.TRANSACTIONS_RETRIEVED);
    } catch (error) {
      console.error('Error searching transactions:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }
}
