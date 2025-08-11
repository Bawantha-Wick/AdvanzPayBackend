import { NextFunction, Request, Response } from 'express';
import AppDataSource from '../../data-source';
import CorpEmp from '../../entity/CorpEmp';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';

type CorpEmpTyp = InstanceType<typeof CorpEmp>;

export default class UserController {
  private CorpEmpRepo = AppDataSource.getRepository(CorpEmp);
  private codes = response.CODES;
  private messages = response.MESSAGES;
  private status = constant.STATUS;

  async getProfile(req: Request, res: Response, next: NextFunction) {
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

      const profileData = {
        id: employee.corpEmpId.toString(),
        name: employee.corpEmpName,
        email: employee.corpEmpEmail,
        avatar: null // You can add avatar functionality later
      };

      return responseFormatter.success(req, res, 200, profileData, true, this.codes.SUCCESS, this.messages.PROFILE_RETRIEVED);
    } catch (error) {
      console.error('Error fetching profile:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any)?.user_code; // From auth middleware
      const { name, avatar } = req.body;

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

      // Update profile fields
      if (name) {
        employee.corpEmpName = name;
      }

      employee.corpEmpLastUpdatedBy = employee.corpEmpId;

      await this.CorpEmpRepo.save(employee);

      const profileData = {
        id: employee.corpEmpId.toString(),
        name: employee.corpEmpName,
        email: employee.corpEmpEmail,
        avatar: avatar || null
      };

      return responseFormatter.success(req, res, 200, profileData, true, this.codes.SUCCESS, this.messages.PROFILE_UPDATED);
    } catch (error) {
      console.error('Error updating profile:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }
}
