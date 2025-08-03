import { NextFunction, Request, Response } from 'express';
import AppDataSource from '../../data-source';
import Corporate from '../../entity/Corporate';
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
}
