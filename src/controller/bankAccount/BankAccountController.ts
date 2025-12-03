import { NextFunction, Request, Response } from 'express';
import AppDataSource from '../../data-source';
import CorpEmp from '../../entity/CorpEmp';
import BankAccount from '../../entity/BankAccount';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';
import KobbleApiService from '../../services/KobbleApiService';

type CorpEmpTyp = InstanceType<typeof CorpEmp>;
type BankAccountTyp = InstanceType<typeof BankAccount>;

export default class BankAccountController {
  private CorpEmpRepo = AppDataSource.getRepository(CorpEmp);
  private BankAccountRepo = AppDataSource.getRepository(BankAccount);
  private codes = response.CODES;
  private messages = response.MESSAGES;
  private status = constant.STATUS;
  private kobbleApiService = KobbleApiService.getInstance();

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any)?.user_code; // From auth middleware

      //   if (!userId) {
      //     return responseFormatter.error(req, res, {
      //       statusCode: 401,
      //       status: false,
      //       message: 'Unauthorized'
      //     });
      //   }

      const bankAccounts = await this.BankAccountRepo.createQueryBuilder('account')
        .where('account.corpEmpId = :userId', { userId: parseInt(userId) })
        .andWhere('account.status = :status', { status: this.status.ACTIVE.ID })
        .orderBy('account.isDefault', 'DESC')
        .addOrderBy('account.createdAt', 'DESC')
        .getMany();

      const formattedAccounts = bankAccounts.map((account) => ({
        id: account.bankAccountId.toString(),
        accountNumber: account.accountNumber,
        holderName: account.holderName,
        bankName: account.bankName,
        branch: account.branch,
        nickname: account.nickname,
        isDefault: account.isDefault,
        isActive: account.isActive,
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString()
      }));

      return responseFormatter.success(req, res, 200, { formattedAccounts }, true, this.codes.SUCCESS, this.messages.BANK_ACCOUNTS_RETRIEVED);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
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

      //   if (!userId) {
      //     return responseFormatter.error(req, res, {
      //       statusCode: 401,
      //       status: false,
      //       message: 'Unauthorized'
      //     });
      //   }

      const bankAccount: BankAccountTyp | null = await this.BankAccountRepo.findOne({
        where: {
          bankAccountId: parseInt(id),
          corpEmpId: { corpEmpId: parseInt(userId) },
          status: this.status.ACTIVE.ID
        }
      });

      if (!bankAccount) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.BANK_ACCOUNT_NOT_FOUND
        });
      }

      const formattedAccount = {
        id: bankAccount.bankAccountId.toString(),
        accountNumber: bankAccount.accountNumber,
        holderName: bankAccount.holderName,
        bankName: bankAccount.bankName,
        branch: bankAccount.branch,
        nickname: bankAccount.nickname,
        isDefault: bankAccount.isDefault,
        isActive: bankAccount.isActive,
        createdAt: bankAccount.createdAt.toISOString(),
        updatedAt: bankAccount.updatedAt.toISOString()
      };

      return responseFormatter.success(req, res, 200, formattedAccount, true, this.codes.SUCCESS, this.messages.BANK_ACCOUNTS_RETRIEVED);
    } catch (error) {
      console.error('Error fetching bank account:', error);
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
      const { accountNumber, holderName, bankName, branch, nickname, isDefault = false, isActive = true } = req.body;

      //   if (!userId) {
      //     return responseFormatter.error(req, res, {
      //       statusCode: 401,
      //       status: false,
      //       message: 'Unauthorized'
      //     });
      //   }

      if (!accountNumber || !holderName || !bankName) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Account number, holder name, and bank name are required'
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

      // Check if account number already exists for this user
      const existingAccount = await this.BankAccountRepo.findOne({
        where: {
          accountNumber: accountNumber,
          corpEmpId: { corpEmpId: parseInt(userId) },
          status: this.status.ACTIVE.ID
        }
      });

      if (existingAccount) {
        return responseFormatter.error(req, res, {
          statusCode: 409,
          status: false,
          message: 'Bank account with this account number already exists'
        });
      }

      // If this is the first account or set as default, make it default
      const accountCount = await this.BankAccountRepo.count({
        where: {
          corpEmpId: { corpEmpId: parseInt(userId) },
          status: this.status.ACTIVE.ID
        }
      });

      const shouldBeDefault = isDefault || accountCount === 0;

      // If setting as default, unset other defaults
      if (shouldBeDefault) {
        await this.BankAccountRepo.update(
          {
            corpEmpId: { corpEmpId: parseInt(userId) },
            status: this.status.ACTIVE.ID
          },
          { isDefault: false }
        );
      }

      const newBankAccount = new BankAccount();
      newBankAccount.corpEmpId = employee;
      newBankAccount.accountNumber = accountNumber;
      newBankAccount.holderName = holderName;
      newBankAccount.bankName = bankName;
      newBankAccount.branch = branch || 'N/A';
      newBankAccount.nickname = nickname;
      newBankAccount.isDefault = shouldBeDefault;
      newBankAccount.isActive = isActive;
      newBankAccount.status = this.status.ACTIVE.ID;
      newBankAccount.createdBy = parseInt(userId);
      newBankAccount.lastUpdatedBy = parseInt(userId);

      const savedAccount = await this.BankAccountRepo.save(newBankAccount);

      // Create beneficiary in Kobble system
      let kobbleBeneficiaryId: string | null = null;
      let kobbleError: string | null = null;

      try {
        console.log('Creating beneficiary in Kobble system...');
        const beneficiaryResponse = await this.kobbleApiService.createBeneficiary({
          accountNumber: savedAccount.accountNumber,
          holderName: savedAccount.holderName,
          bankName: savedAccount.bankName,
          branch: savedAccount.branch
        });

        kobbleBeneficiaryId = beneficiaryResponse.id || null;
        console.log('Beneficiary created successfully with ID:', kobbleBeneficiaryId);

        // Optionally, you can save the Kobble beneficiary ID in your database
        // if you have a field for it in the BankAccount entity
        // savedAccount.kobbleBeneficiaryId = kobbleBeneficiaryId;
        // await this.BankAccountRepo.save(savedAccount);
      } catch (kobbleErr: any) {
        // Log the error but don't fail the entire operation
        kobbleError = kobbleErr.message;
        console.error('Failed to create beneficiary in Kobble:', kobbleError);

        // You can decide here whether to:
        // 1. Continue and return success (current behavior)
        // 2. Rollback the bank account creation and return error
        // 3. Mark the account with a flag indicating beneficiary creation failed

        // For now, we'll continue but include the error in the response
      }

      const formattedAccount = {
        id: savedAccount.bankAccountId.toString(),
        accountNumber: savedAccount.accountNumber,
        holderName: savedAccount.holderName,
        bankName: savedAccount.bankName,
        branch: savedAccount.branch,
        nickname: savedAccount.nickname,
        isDefault: savedAccount.isDefault,
        isActive: savedAccount.isActive,
        createdAt: savedAccount.createdAt.toISOString(),
        updatedAt: savedAccount.updatedAt.toISOString(),
        ...(kobbleBeneficiaryId && { kobbleBeneficiaryId }),
        ...(kobbleError && { kobbleWarning: 'Beneficiary creation in payment system failed' })
      };

      return responseFormatter.success(req, res, 201, formattedAccount, true, this.codes.SUCCESS, this.messages.BANK_ACCOUNT_CREATED);
    } catch (error) {
      console.error('Error creating bank account:', error);
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
      const { accountNumber, bankName, nickname } = req.body;

      //   if (!userId) {
      //     return responseFormatter.error(req, res, {
      //       statusCode: 401,
      //       status: false,
      //       message: 'Unauthorized'
      //     });
      //   }

      const bankAccount: BankAccountTyp | null = await this.BankAccountRepo.findOne({
        where: {
          bankAccountId: parseInt(id)
          // corpEmpId: { corpEmpId: parseInt(userId) },
          // status: this.status.ACTIVE.ID
        }
      });

      console.log('Found bank account:', bankAccount);
      if (!bankAccount) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.BANK_ACCOUNT_NOT_FOUND
        });
      }

      // Update fields
      if (nickname !== undefined) {
        bankAccount.nickname = nickname;
      }
      if (accountNumber !== undefined) {
        bankAccount.accountNumber = accountNumber;
      }
      if (bankName !== undefined) {
        bankAccount.bankName = bankName;
      }

      bankAccount.lastUpdatedBy = parseInt(userId);

      const updatedAccount = await this.BankAccountRepo.save(bankAccount);

      const formattedAccount = {
        id: updatedAccount.bankAccountId.toString(),
        accountNumber: updatedAccount.accountNumber,
        holderName: updatedAccount.holderName,
        bankName: updatedAccount.bankName,
        branch: updatedAccount.branch,
        nickname: updatedAccount.nickname,
        isDefault: updatedAccount.isDefault,
        isActive: true,
        createdAt: updatedAccount.createdAt.toISOString(),
        updatedAt: updatedAccount.updatedAt.toISOString()
      };

      return responseFormatter.success(req, res, 200, formattedAccount, true, this.codes.SUCCESS, this.messages.BANK_ACCOUNT_UPDATED);
    } catch (error) {
      console.error('Error updating bank account:', error);
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

      //   if (!userId) {
      //     return responseFormatter.error(req, res, {
      //       statusCode: 401,
      //       status: false,
      //       message: 'Unauthorized'
      //     });
      //   }

      const bankAccount: BankAccountTyp | null = await this.BankAccountRepo.findOne({
        where: {
          bankAccountId: parseInt(id),
          corpEmpId: { corpEmpId: parseInt(userId) },
          status: this.status.ACTIVE.ID
        }
      });

      if (!bankAccount) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.BANK_ACCOUNT_NOT_FOUND
        });
      }

      // Soft delete
      bankAccount.status = this.status.INACTIVE.ID;
      bankAccount.lastUpdatedBy = parseInt(userId);

      await this.BankAccountRepo.save(bankAccount);

      return responseFormatter.success(req, res, 200, null, true, this.codes.SUCCESS, this.messages.BANK_ACCOUNT_DELETED);
    } catch (error) {
      console.error('Error deleting bank account:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async setDefault(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any)?.user_code; // From auth middleware
      const { id } = req.params;

      //   if (!userId) {
      //     return responseFormatter.error(req, res, {
      //       statusCode: 401,
      //       status: false,
      //       message: 'Unauthorized'
      //     });
      //   }

      const bankAccount: BankAccountTyp | null = await this.BankAccountRepo.findOne({
        where: {
          bankAccountId: parseInt(id),
          corpEmpId: { corpEmpId: parseInt(userId) },
          status: this.status.ACTIVE.ID
        }
      });

      if (!bankAccount) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.BANK_ACCOUNT_NOT_FOUND
        });
      }

      // Unset other defaults
      await this.BankAccountRepo.update(
        {
          corpEmpId: { corpEmpId: parseInt(userId) },
          status: this.status.ACTIVE.ID
        },
        { isDefault: false }
      );

      // Set this account as default
      bankAccount.isDefault = true;
      bankAccount.lastUpdatedBy = parseInt(userId);

      const updatedAccount = await this.BankAccountRepo.save(bankAccount);

      const formattedAccount = {
        id: updatedAccount.bankAccountId.toString(),
        accountNumber: updatedAccount.accountNumber,
        holderName: updatedAccount.holderName,
        bankName: updatedAccount.bankName,
        branch: updatedAccount.branch,
        nickname: updatedAccount.nickname,
        isDefault: updatedAccount.isDefault,
        isActive: updatedAccount.isActive,
        createdAt: updatedAccount.createdAt.toISOString(),
        updatedAt: updatedAccount.updatedAt.toISOString()
      };

      return responseFormatter.success(req, res, 200, formattedAccount, true, this.codes.SUCCESS, this.messages.DEFAULT_ACCOUNT_SET);
    } catch (error) {
      console.error('Error setting default account:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }
}
