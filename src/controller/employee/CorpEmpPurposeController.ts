import { NextFunction, Request, Response } from 'express';
import AppDataSource from '../../data-source';
import CorpEmp from '../../entity/CorpEmp';
import CorpEmpPurpose from '../../entity/CorpEmpPurpose';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';

export default class CorpEmpPurposeController {
  private Repo = AppDataSource.getRepository(CorpEmpPurpose);
  private CorpEmpRepo = AppDataSource.getRepository(CorpEmp);
  private codes = response.CODES;
  private messages = response.MESSAGES;
  private status = constant.STATUS;

  //   async get(req: Request, res: Response, next: NextFunction) {
  //     try {
  //       const { empId } = req.query;

  //       const where: any = {};
  //       if (empId) {
  //         where.corpEmpId = { corpEmpId: Number(empId) } as any;
  //       }

  //       const items = await this.Repo.find({
  //         where,
  //         relations: ['corpEmpId'],
  //         order: { purposeCreatedDate: 'DESC' }
  //       });

  //       return responseFormatter.success(req, res, 200, { items }, true, this.codes.SUCCESS, this.messages.RETRIEVED_SUCCESS);
  //     } catch (error) {
  //       console.error('Error fetching corp emp purposes:', error);
  //       return responseFormatter.error(req, res, {
  //         statusCode: 500,
  //         status: false,
  //         message: this.messages.INTERNAL_SERVER_ERROR
  //       });
  //     }
  //   }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
    //   const empUser = req.user;

    //   const { title } = req.body;

    //   if (!title) {
    //     return responseFormatter.error(req, res, {
    //       statusCode: 400,
    //       status: false,
    //       message: 'Title is required'
    //     });
    //   }

    //   const employee = await this.CorpEmpRepo.findOne({ where: { corpEmpId: Number(empId) } });
    //   if (!employee) {
    //     return responseFormatter.error(req, res, {
    //       statusCode: 404,
    //       status: false,
    //       message: this.messages.EMPLOYEE_NOT_FOUND
    //     });
    //   }

    //   const existing = await this.Repo.findOne({ where: { purposeTitle: title, corpEmpId: { corpEmpId: employee.corpEmpId } } as any });
    //   if (existing) {
    //     return responseFormatter.error(req, res, {
    //       statusCode: 409,
    //       status: false,
    //       message: 'Purpose with same title already exists for this employee'
    //     });
    //   }

    //   const newItem = new CorpEmpPurpose();
    //   newItem.corpEmpId = employee;
    //   newItem.purposeTitle = title;
    //   //   newItem.purposeDescription = description || '';
    //   //   newItem.purposeStatus = this.status.INACTIVE.ID;
    //   //   newItem.purposeCreatedBy = employee.corpEmpId;
    //   //   newItem.purposeLastUpdatedBy = employee.corpEmpId;

    //   await this.Repo.save(newItem);

      return responseFormatter.success(req, res, 201, {}, true, this.codes.SUCCESS, 'Purpose created successfully');
    } catch (error) {
      console.error('Error creating purpose:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  //   async update(req: Request, res: Response, next: NextFunction) {
  //     try {
  //       const { id, title, description } = req.body;

  //       if (!id) {
  //         return responseFormatter.error(req, res, {
  //           statusCode: 400,
  //           status: false,
  //           message: 'Purpose id is required'
  //         });
  //       }

  //       const existing = await this.Repo.findOne({ where: { corpEmpPurposeId: Number(id) }, relations: ['corpEmpId'] });
  //       if (!existing) {
  //         return responseFormatter.error(req, res, {
  //           statusCode: 404,
  //           status: false,
  //           message: 'Purpose not found'
  //         });
  //       }

  //       if (title) existing.purposeTitle = title;
  //       if (description !== undefined) existing.purposeDescription = description;
  //       existing.purposeLastUpdatedBy = existing.corpEmpId ? (existing.corpEmpId as any).corpEmpId : existing.purposeLastUpdatedBy;

  //       await this.Repo.save(existing);

  //       return responseFormatter.success(req, res, 200, {}, true, this.codes.SUCCESS, 'Purpose updated successfully');
  //     } catch (error) {
  //       console.error('Error updating purpose:', error);
  //       return responseFormatter.error(req, res, {
  //         statusCode: 500,
  //         status: false,
  //         message: this.messages.INTERNAL_SERVER_ERROR
  //       });
  //     }
  //   }

  //   async toggleStatus(req: Request, res: Response, next: NextFunction) {
  //     try {
  //       const { id } = req.body;

  //       if (!id) {
  //         return responseFormatter.error(req, res, {
  //           statusCode: 400,
  //           status: false,
  //           message: 'Purpose id is required'
  //         });
  //       }

  //       const existing = await this.Repo.findOne({ where: { corpEmpPurposeId: Number(id) } });
  //       if (!existing) {
  //         return responseFormatter.error(req, res, {
  //           statusCode: 404,
  //           status: false,
  //           message: 'Purpose not found'
  //         });
  //       }

  //       existing.purposeStatus = existing.purposeStatus === this.status.ACTIVE.ID ? this.status.INACTIVE.ID : this.status.ACTIVE.ID;
  //       existing.purposeLastUpdatedBy = existing.purposeLastUpdatedBy || 0;

  //       await this.Repo.save(existing);

  //       return responseFormatter.success(req, res, 200, {}, true, this.codes.SUCCESS, 'Purpose status toggled successfully');
  //     } catch (error) {
  //       console.error('Error toggling purpose status:', error);
  //       return responseFormatter.error(req, res, {
  //         statusCode: 500,
  //         status: false,
  //         message: this.messages.INTERNAL_SERVER_ERROR
  //       });
  //     }
  //   }
}
