import { NextFunction, Request, Response } from 'express';
import AppDataSource from '../../data-source';
import CorpUserRole from '../../entity/CorpUserRole';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';

type CorpUserRoleTyp = InstanceType<typeof CorpUserRole>;

interface CorpUserRoleResultInt {
  no: number;
  name: string;
  description: string;
  permissions: string;
  status: string;
}

interface CountResultInt {
  total: number;
}

export default class CorpUserRoleController {
  private CorpUserRoleRepo = AppDataSource.getRepository(CorpUserRole);
  private codes = response.CODES;
  private messages = response.MESSAGES;
  private status = constant.STATUS;

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const getQuery: string = `
        SELECT 
          cur.corpUserRoleId as no,
          cur.corpUserRoleName as name
        FROM apt_corp_user_role cur 
        WHERE cur.corpUserRoleStatus = ${activeId}
        ORDER BY cur.corpUserRoleName ASC 
      `;

      const corpUserRoles: CorpUserRoleResultInt[] = await AppDataSource.query(getQuery);

      const result = {
        roles: corpUserRoles
      };

      return responseFormatter.success(req, res, 200, result, true, this.codes.SUCCESS, 'Corporate user roles retrieved successfully');
    } catch (error) {
      console.error('Error fetching corporate user roles:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, page } = req.query;

      const pageNo: number = page ? Number(page) : 1;
      const skip: number = (pageNo - 1) * pageLimit;

      let whereClause: string = '';
      if (!isEmptyString(search as string)) {
        whereClause = `WHERE cur.corpUserRoleName LIKE '%${search}%' OR cur.corpUserRoleDescription LIKE '%${search}%'`;
      }

      const countQuery: string = `
        SELECT COUNT(*) as total FROM apt_corp_user_role cur ${whereClause}
      `;
      const countResult: CountResultInt = await AppDataSource.query(countQuery);
      const total: number = Number(countResult[0].total);

      const getQuery: string = `
        SELECT 
          cur.corpUserRoleId as no,
          cur.corpUserRoleName as name,
          cur.corpUserRoleDescription as description,
          cur.corpUserRolePermission as permissions,
          CASE 
            WHEN cur.corpUserRoleStatus = ${activeId} THEN '${activeTag}'
            WHEN cur.corpUserRoleStatus = ${inactiveId} THEN '${inactiveTag}'
            WHEN cur.corpUserRoleStatus = ${blockedId} THEN '${blockedTag}'
            ELSE 'Unknown'
          END as status,
          CASE 
            WHEN cur.corpUserRoleStatus = ${activeId} THEN '${activeDescription}'
            WHEN cur.corpUserRoleStatus = ${inactiveId} THEN '${inactiveDescription}'
            WHEN cur.corpUserRoleStatus = ${blockedId} THEN '${blockedDescription}'
            ELSE 'Unknown'
          END as statusLabel
        FROM apt_corp_user_role cur 
        ${whereClause}
        ORDER BY cur.corpUserRoleCreatedDate DESC 
        LIMIT ${pageLimit} 
        OFFSET ${skip}
      `;

      const paginatedRoles: CorpUserRoleResultInt[] = await AppDataSource.query(getQuery);

      const pages: number = Math.ceil(total / pageLimit);

      const result = {
        pagination: {
          page,
          total,
          pages
        },
        roles: paginatedRoles
      };

      return responseFormatter.success(req, res, 200, result, true, this.codes.SUCCESS, 'Corporate user roles retrieved successfully');
    } catch (error) {
      console.error('Error fetching corporate user roles:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, permissions } = req.body;

      if (!name || !description || !permissions) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Name, description, and permissions are required'
        });
      }

      const existingRole: CorpUserRoleTyp | null = await this.CorpUserRoleRepo.findOne({
        where: { corpUserRoleName: name }
      });

      if (existingRole) {
        return responseFormatter.error(req, res, {
          statusCode: 409,
          status: false,
          message: 'Corporate user role with this name already exists'
        });
      }

      const newCorpUserRole = new CorpUserRole();
      newCorpUserRole.corpUserRoleName = name;
      newCorpUserRole.corpUserRoleDescription = description;
      newCorpUserRole.corpUserRolePermission = permissions;
      newCorpUserRole.corpUserRoleStatus = this.status.ACTIVE.ID;

      await this.CorpUserRoleRepo.save(newCorpUserRole);

      return responseFormatter.success(req, res, 201, {}, true, this.codes.SUCCESS, 'Corporate user role created successfully');
    } catch (error) {
      console.error('Error creating corporate user role:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { no, name, description, permissions, status } = req.body;

      if (!no) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Role no is required'
        });
      }

      const existingRole: CorpUserRoleTyp | null = await this.CorpUserRoleRepo.findOne({
        where: { corpUserRoleId: Number(no) }
      });

      if (!existingRole) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.CORPORATE_USER_ROLE_NOT_FOUND
        });
      }

      if (name && name !== existingRole.corpUserRoleName) {
        const duplicateRole = await this.CorpUserRoleRepo.findOne({
          where: { corpUserRoleName: name }
        });

        if (duplicateRole && duplicateRole.corpUserRoleId !== existingRole.corpUserRoleId) {
          return responseFormatter.error(req, res, {
            statusCode: 409,
            status: false,
            message: 'Corporate user role with this name already exists'
          });
        }
      }

      existingRole.corpUserRoleName = name;
      existingRole.corpUserRoleDescription = description;
      existingRole.corpUserRolePermission = permissions;
      existingRole.corpUserRoleStatus =
        status === activeTag
          ? activeId
          : status === inactiveTag //
          ? inactiveId
          : blockedId;

      await this.CorpUserRoleRepo.save(existingRole);

      return responseFormatter.success(req, res, 200, {}, true, this.codes.SUCCESS, 'Corporate user role updated successfully');
    } catch (error) {
      console.error('Error updating corporate user role:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }
}
