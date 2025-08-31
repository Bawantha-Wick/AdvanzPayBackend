import { NextFunction, Request, Response } from 'express';
import AppDataSource from '../../data-source';
import CorpEmp from '../../entity/CorpEmp';
import Goal from '../../entity/Goal';
import BankAccount from '../../entity/BankAccount';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';

type CorpEmpTyp = InstanceType<typeof CorpEmp>;
type GoalTyp = InstanceType<typeof Goal>;
type BankAccountTyp = InstanceType<typeof BankAccount>;

// Goal category configurations
const GOAL_CATEGORIES = {
  emergency: { color: '#FF6B6B', icon: 'shield' },
  travel: { color: '#4ECDC4', icon: 'plane' },
  education: { color: '#45B7D1', icon: 'book' },
  house: { color: '#96CEB4', icon: 'home' },
  car: { color: '#FECA57', icon: 'car' },
  retirement: { color: '#A78BFA', icon: 'piggy-bank' },
  other: { color: '#6C757D', icon: 'target' }
};

export default class GoalController {
  private CorpEmpRepo = AppDataSource.getRepository(CorpEmp);
  private GoalRepo = AppDataSource.getRepository(Goal);
  private BankAccountRepo = AppDataSource.getRepository(BankAccount);
  private codes = response.CODES;
  private messages = response.MESSAGES;
  private status = constant.STATUS;

  async get(req: Request, res: Response, next: NextFunction) {
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

      const goals = await this.GoalRepo.createQueryBuilder('goal').leftJoinAndSelect('goal.accountId', 'bankAccount').where('goal.corpEmpId = :corpEmpId', { corpEmpId: employee.corpEmpId }).andWhere('goal.status = :status', { status: this.status.ACTIVE.ID }).orderBy('goal.createdAt', 'DESC').getMany();

      const formattedGoals = goals.map((goal) => ({
        id: goal.goalId.toString(),
        name: goal.name,
        targetAmount: parseFloat(goal.targetAmount.toString()),
        currentAmount: parseFloat(goal.currentAmount.toString()),
        startDate: new Date(goal.startDate).toISOString().split('T')[0],
        endDate: new Date(goal.endDate).toISOString().split('T')[0],
        category: goal.category,
        color: goal.color,
        icon: goal.icon,
        accountId: goal.accountId?.bankAccountId.toString() || null,
        isActive: goal.status === this.status.ACTIVE.ID,
        isArchived: parseFloat(goal.targetAmount.toString()) <= parseFloat(goal.currentAmount.toString()) ? true : false,
        repeat: goal.repeat,
        createdAt: new Date(goal.createdAt).toISOString(),
        updatedAt: new Date(goal.updatedAt).toISOString()
      }));

      return responseFormatter.success(req, res, 200, formattedGoals, true, this.codes.SUCCESS, this.messages.GOALS_RETRIEVED);
    } catch (error) {
      console.error('Error fetching goals:', error);
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

      const goal: GoalTyp | null = await this.GoalRepo.createQueryBuilder('goal')
        .leftJoinAndSelect('goal.accountId', 'bankAccount')
        .where('goal.goalId = :goalId', { goalId: parseInt(id) })
        .andWhere('goal.corpEmpId = :corpEmpId', { corpEmpId: employee.corpEmpId })
        .andWhere('goal.status = :status', { status: this.status.ACTIVE.ID })
        .getOne();

      if (!goal) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.GOAL_NOT_FOUND
        });
      }

      const formattedGoal = {
        id: goal.goalId.toString(),
        name: goal.name,
        targetAmount: parseFloat(goal.targetAmount.toString()),
        currentAmount: parseFloat(goal.currentAmount.toString()),
        startDate: new Date(goal.startDate).toISOString().split('T')[0],
        endDate: new Date(goal.endDate).toISOString().split('T')[0],
        category: goal.category,
        color: goal.color,
        icon: goal.icon,
        accountId: goal.accountId?.bankAccountId.toString() || null,
        isActive: goal.status === this.status.ACTIVE.ID,
        repeat: goal.repeat,
        createdAt: new Date(goal.createdAt).toISOString(),
        updatedAt: new Date(goal.updatedAt).toISOString()
      };

      return responseFormatter.success(req, res, 200, formattedGoal, true, this.codes.SUCCESS, this.messages.GOALS_RETRIEVED);
    } catch (error) {
      console.error('Error fetching goal:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any)?.user_code; // From auth middleware
      const { name, targetAmount, startDate, accountId, repeat = false, icon, color } = req.body;

      if (!userId) {
        // return responseFormatter.error(req, res, {
        //   statusCode: 401,
        //   status: false,
        //   message: 'Unauthorized'
        // });
      }

      if (!name || !targetAmount || !startDate) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Name, target amount, and start date are required'
        });
      }

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

      let bankAccount: BankAccountTyp | null = null;
      if (accountId) {
        bankAccount = await this.BankAccountRepo.createQueryBuilder('bankAccount')
          .where('bankAccount.bankAccountId = :bankAccountId', { bankAccountId: parseInt(accountId) })
          .andWhere('bankAccount.corpEmpId = :corpEmpId', { corpEmpId: parseInt(userId) })
          .andWhere('bankAccount.status = :status', { status: this.status.ACTIVE.ID })
          .getOne();

        if (!bankAccount) {
          return responseFormatter.error(req, res, {
            statusCode: 404,
            status: false,
            message: this.messages.BANK_ACCOUNT_NOT_FOUND
          });
        }
      }

      // Get category configuration
      // const categoryConfig = GOAL_CATEGORIES[category as keyof typeof GOAL_CATEGORIES] || GOAL_CATEGORIES.other;

      const newGoal = new Goal();
      newGoal.corpEmpId = employee;
      newGoal.accountId = bankAccount;
      newGoal.name = name;
      newGoal.targetAmount = parseFloat(targetAmount);
      newGoal.currentAmount = 0;
      newGoal.startDate = new Date(startDate);
      newGoal.endDate = null;
      newGoal.category = null;
      newGoal.color = color || null;
      newGoal.icon = icon || null;
      newGoal.repeat = repeat;
      newGoal.status = this.status.ACTIVE.ID;
      newGoal.createdBy = parseInt(userId);
      newGoal.lastUpdatedBy = parseInt(userId);

      const savedGoal = await this.GoalRepo.save(newGoal);

      // Update employee's remaining monthly amount after goal creation
      // if (employee.corpEmpMonthlyRmnAmt) {
      // const monthlyGoalAmount = parseFloat(targetAmount) / 12; // Assuming yearly goal divided by 12 months
      // const newRemainingAmount = parseFloat(employee.corpEmpMonthlyRmnAmt.toString()) - monthlyGoalAmount;

      if (parseFloat(targetAmount) >= 0) {
        // employee.corpEmpMonthlyRmnAmt = employee.corpEmpMonthlyRmnAmt + parseFloat(targetAmount);
        // await this.CorpEmpRepo.save(employee);
      }
      // }

      const formattedGoal = {
        id: savedGoal.goalId.toString(),
        name: savedGoal.name,
        targetAmount: parseFloat(savedGoal.targetAmount.toString()),
        currentAmount: parseFloat(savedGoal.currentAmount.toString()),
        startDate: new Date(savedGoal.startDate).toISOString().split('T')[0],
        endDate: new Date(savedGoal.endDate).toISOString().split('T')[0],
        category: savedGoal.category,
        color: savedGoal.color,
        icon: savedGoal.icon,
        accountId: savedGoal.accountId?.bankAccountId.toString() || null,
        isActive: savedGoal.status === this.status.ACTIVE.ID,
        repeat: savedGoal.repeat,
        createdAt: new Date(savedGoal.createdAt).toISOString(),
        updatedAt: new Date(savedGoal.updatedAt).toISOString()
      };

      return responseFormatter.success(req, res, 201, formattedGoal, true, this.codes.SUCCESS, this.messages.GOAL_CREATED);
    } catch (error) {
      console.error('Error creating goal:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any)?.user_code; // From auth middleware
      const { id } = req.params;
      const { name, targetAmount, endDate } = req.body;

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

      const goal: GoalTyp | null = await this.GoalRepo.createQueryBuilder('goal')
        .leftJoinAndSelect('goal.accountId', 'bankAccount')
        .where('goal.goalId = :goalId', { goalId: parseInt(id) })
        .andWhere('goal.corpEmpId = :corpEmpId', { corpEmpId: employee.corpEmpId })
        .andWhere('goal.status = :status', { status: this.status.ACTIVE.ID })
        .getOne();

      if (!goal) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.GOAL_NOT_FOUND
        });
      }

      // Update fields
      if (name !== undefined) {
        goal.name = name;
      }
      if (targetAmount !== undefined) {
        goal.targetAmount = parseFloat(targetAmount);
      }
      if (endDate !== undefined) {
        goal.endDate = new Date(endDate);
      }

      goal.lastUpdatedBy = parseInt(userId);

      const updatedGoal = await this.GoalRepo.save(goal);

      const formattedGoal = {
        id: updatedGoal.goalId.toString(),
        name: updatedGoal.name,
        targetAmount: parseFloat(updatedGoal.targetAmount.toString()),
        currentAmount: parseFloat(updatedGoal.currentAmount.toString()),
        startDate: new Date(updatedGoal.startDate).toISOString().split('T')[0],
        endDate: new Date(updatedGoal.endDate).toISOString().split('T')[0],
        category: updatedGoal.category,
        color: updatedGoal.color,
        icon: updatedGoal.icon,
        accountId: updatedGoal.accountId?.bankAccountId.toString() || null,
        isActive: updatedGoal.status === this.status.ACTIVE.ID,
        repeat: updatedGoal.repeat,
        createdAt: new Date(updatedGoal.createdAt).toISOString(),
        updatedAt: new Date(updatedGoal.updatedAt).toISOString()
      };

      return responseFormatter.success(req, res, 200, formattedGoal, true, this.codes.SUCCESS, this.messages.GOAL_UPDATED);
    } catch (error) {
      console.error('Error updating goal:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
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

      const goal: GoalTyp | null = await this.GoalRepo.createQueryBuilder('goal')
        .where('goal.goalId = :goalId', { goalId: parseInt(id) })
        .andWhere('goal.corpEmpId = :corpEmpId', { corpEmpId: employee.corpEmpId })
        .andWhere('goal.status = :status', { status: this.status.ACTIVE.ID })
        .getOne();

      if (!goal) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.GOAL_NOT_FOUND
        });
      }

      // Soft delete
      goal.status = this.status.INACTIVE.ID;
      goal.lastUpdatedBy = parseInt(userId);

      await this.GoalRepo.save(goal);

      return responseFormatter.success(req, res, 200, null, true, this.codes.SUCCESS, this.messages.GOAL_DELETED);
    } catch (error) {
      console.error('Error deleting goal:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async getPriority(req: Request, res: Response, next: NextFunction) {
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

      // Get priority goals (emergency, close to deadline, or low progress)
      const goals = await this.GoalRepo.createQueryBuilder('goal').leftJoinAndSelect('goal.accountId', 'bankAccount').where('goal.corpEmpId = :corpEmpId', { corpEmpId: employee.corpEmpId }).andWhere('goal.status = :status', { status: this.status.ACTIVE.ID }).orderBy('goal.endDate', 'ASC').getMany();

      const currentDate = new Date();
      const priorityGoals = goals
        .filter((goal) => {
          const daysUntilDeadline = Math.ceil((new Date(goal.endDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          const progressPercent = (parseFloat(goal.currentAmount.toString()) / parseFloat(goal.targetAmount.toString())) * 100;

          // Priority criteria: emergency category, less than 30 days to deadline, or less than 25% progress
          return goal.category === 'emergency' || daysUntilDeadline <= 30 || progressPercent < 25;
        })
        .slice(0, 5); // Limit to top 5 priority goals

      const formattedGoals = priorityGoals.map((goal) => ({
        id: goal.goalId.toString(),
        name: goal.name,
        targetAmount: parseFloat(goal.targetAmount.toString()),
        currentAmount: parseFloat(goal.currentAmount.toString()),
        startDate: new Date(goal.startDate).toISOString().split('T')[0],
        endDate: new Date(goal.endDate).toISOString().split('T')[0],
        category: goal.category,
        color: goal.color,
        icon: goal.icon,
        accountId: goal.accountId?.bankAccountId.toString() || null,
        isActive: goal.status === this.status.ACTIVE.ID,
        repeat: goal.repeat,
        createdAt: new Date(goal.createdAt).toISOString(),
        updatedAt: new Date(goal.updatedAt).toISOString()
      }));

      return responseFormatter.success(req, res, 200, formattedGoals, true, this.codes.SUCCESS, this.messages.PRIORITY_GOALS_RETRIEVED);
    } catch (error) {
      console.error('Error fetching priority goals:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async updateProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any)?.user_code; // From auth middleware
      const { id } = req.params;
      const { amount } = req.body;

      if (!userId) {
        // return responseFormatter.error(req, res, {
        //   statusCode: 401,
        //   status: false,
        //   message: 'Unauthorized'
        // });
      }

      if (!amount || amount <= 0) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Amount must be a positive number'
        });
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

      const goal: GoalTyp | null = await this.GoalRepo.createQueryBuilder('goal')
        .leftJoinAndSelect('goal.accountId', 'bankAccount')
        .where('goal.goalId = :goalId', { goalId: parseInt(id) })
        .andWhere('goal.corpEmpId = :corpEmpId', { corpEmpId: employee.corpEmpId })
        .andWhere('goal.status = :status', { status: this.status.ACTIVE.ID })
        .getOne();

      if (!goal) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.GOAL_NOT_FOUND
        });
      }

      // Add amount to current amount
      const newCurrentAmount = parseFloat(goal.currentAmount.toString()) + parseFloat(amount);
      const targetAmount = parseFloat(goal.targetAmount.toString());

      // Cap at target amount
      goal.currentAmount = Math.min(newCurrentAmount, targetAmount);
      goal.lastUpdatedBy = parseInt(userId);

      const updatedGoal = await this.GoalRepo.save(goal);

      const formattedGoal = {
        id: updatedGoal.goalId.toString(),
        name: updatedGoal.name,
        targetAmount: parseFloat(updatedGoal.targetAmount.toString()),
        currentAmount: parseFloat(updatedGoal.currentAmount.toString()),
        startDate: new Date(updatedGoal.startDate).toISOString().split('T')[0],
        endDate: new Date(updatedGoal.endDate).toISOString().split('T')[0],
        category: updatedGoal.category,
        color: updatedGoal.color,
        icon: updatedGoal.icon,
        accountId: updatedGoal.accountId?.bankAccountId.toString() || null,
        isActive: updatedGoal.status === this.status.ACTIVE.ID,
        repeat: updatedGoal.repeat,
        createdAt: new Date(updatedGoal.createdAt).toISOString(),
        updatedAt: new Date(updatedGoal.updatedAt).toISOString()
      };

      return responseFormatter.success(req, res, 200, formattedGoal, true, this.codes.SUCCESS, this.messages.GOAL_PROGRESS_UPDATED);
    } catch (error) {
      console.error('Error updating goal progress:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }
}
