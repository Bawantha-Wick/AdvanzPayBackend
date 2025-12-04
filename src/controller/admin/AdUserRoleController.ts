import { NextFunction, Request, Response } from 'express';
import AppDataSource from '../../data-source';
import AdUserRole from '../../entity/AdUserRole';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';

type AdUserRoleTyp = InstanceType<typeof AdUserRole>;

interface AdUserRoleResultInt {
  no: number;
  name: string;
  description: string;
  permissions: string;
  status: string;
  statusLabel: string;
}

interface CountResultInt {
  total: number;
}

export default class AdUserRoleController {
  private AdUserRoleRepo = AppDataSource.getRepository(AdUserRole);
  private codes = response.CODES;
  private messages = response.MESSAGES;
  private status = constant.STATUS;

  private activeId = this.status.ACTIVE.ID;
  private activeTag = this.status.ACTIVE.TAG;
  private activeDescription = this.status.ACTIVE.DESCRIPTION;
  private inactiveId = this.status.INACTIVE.ID;
  private inactiveTag = this.status.INACTIVE.TAG;
  private inactiveDescription = this.status.INACTIVE.DESCRIPTION;
  private blockedId = this.status.BLOCKED.ID;
  private blockedTag = this.status.BLOCKED.TAG;
  private blockedDescription = this.status.BLOCKED.DESCRIPTION;

  // Helper function to check if string is empty
  private isEmptyString(str: any): boolean {
    return !str || str.toString().trim() === '';
  }

  // Page limit constant
  private pageLimit = 10;

  /**
   * GET /admin/user-roles/all - Get all active admin user roles (for dropdowns)
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const getQuery: string = `
        SELECT 
          aur.adUserRoleId as no,
          aur.adUserRoleName as name
        FROM apt_ad_user_role aur 
        WHERE aur.adUserRoleStatus = ${this.activeId}
        ORDER BY aur.adUserRoleName ASC 
      `;

      const adUserRoles: AdUserRoleResultInt[] = await AppDataSource.query(getQuery);

      const result = {
        roles: adUserRoles
      };

      return responseFormatter.success(req, res, 200, result, true, this.codes.SUCCESS, 'Admin user roles retrieved successfully');
    } catch (error) {
      console.error('Error fetching admin user roles:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * GET /admin/user-roles - Get admin user roles with pagination and search
   */
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, page } = req.query;

      const pageNo: number = page ? Number(page) : 1;
      const skip: number = (pageNo - 1) * this.pageLimit;

      let whereClause: string = '';
      if (!this.isEmptyString(search as string)) {
        whereClause = `WHERE aur.adUserRoleName LIKE '%${search}%' OR aur.adUserRoleDescription LIKE '%${search}%'`;
      }

      const countQuery: string = `
        SELECT COUNT(*) as total FROM apt_ad_user_role aur ${whereClause}
      `;
      const countResult: CountResultInt[] = await AppDataSource.query(countQuery);
      const total: number = Number(countResult[0].total);

      const getQuery: string = `
        SELECT 
          aur.adUserRoleId as no,
          aur.adUserRoleName as name,
          aur.adUserRoleDescription as description,
          aur.adUserRolePermission as permissions,
          CASE 
            WHEN aur.adUserRoleStatus = ${this.activeId} THEN '${this.activeTag}'
            WHEN aur.adUserRoleStatus = ${this.inactiveId} THEN '${this.inactiveTag}'
            WHEN aur.adUserRoleStatus = ${this.blockedId} THEN '${this.blockedTag}'
            ELSE 'Unknown'
          END as status,
          CASE 
            WHEN aur.adUserRoleStatus = ${this.activeId} THEN '${this.activeDescription}'
            WHEN aur.adUserRoleStatus = ${this.inactiveId} THEN '${this.inactiveDescription}'
            WHEN aur.adUserRoleStatus = ${this.blockedId} THEN '${this.blockedDescription}'
            ELSE 'Unknown'
          END as statusLabel
        FROM apt_ad_user_role aur 
        ${whereClause}
        ORDER BY aur.adUserRoleCreatedDate DESC 
        LIMIT ${this.pageLimit} 
        OFFSET ${skip}
      `;

      const paginatedRoles: AdUserRoleResultInt[] = await AppDataSource.query(getQuery);

      const pages: number = Math.ceil(total / this.pageLimit);

      const result = {
        pagination: {
          page,
          total,
          pages
        },
        roles: paginatedRoles
      };

      return responseFormatter.success(req, res, 200, result, true, this.codes.SUCCESS, 'Admin user roles retrieved successfully');
    } catch (error) {
      console.error('Error fetching admin user roles:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * POST /admin/user-roles - Create a new admin user role
   */
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

      const existingRole: AdUserRoleTyp | null = await this.AdUserRoleRepo.findOne({
        where: { adUserRoleName: name }
      });

      if (existingRole) {
        return responseFormatter.error(req, res, {
          statusCode: 409,
          status: false,
          message: 'Admin user role with this name already exists'
        });
      }

      const newAdUserRole = new AdUserRole();
      newAdUserRole.adUserRoleName = name;
      newAdUserRole.adUserRoleDescription = description;
      newAdUserRole.adUserRolePermission = permissions;
      newAdUserRole.adUserRoleStatus = this.status.ACTIVE.ID;

      await this.AdUserRoleRepo.save(newAdUserRole);

      return responseFormatter.success(req, res, 201, {}, true, this.codes.SUCCESS, 'Admin user role created successfully');
    } catch (error) {
      console.error('Error creating admin user role:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * PUT /admin/user-roles - Update an existing admin user role
   */
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

      const existingRole: AdUserRoleTyp | null = await this.AdUserRoleRepo.findOne({
        where: { adUserRoleId: Number(no) }
      });

      if (!existingRole) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: 'Admin user role not found'
        });
      }

      if (name && name !== existingRole.adUserRoleName) {
        const duplicateRole = await this.AdUserRoleRepo.findOne({
          where: { adUserRoleName: name }
        });

        if (duplicateRole && duplicateRole.adUserRoleId !== existingRole.adUserRoleId) {
          return responseFormatter.error(req, res, {
            statusCode: 409,
            status: false,
            message: 'Admin user role with this name already exists'
          });
        }
      }

      existingRole.adUserRoleName = name;
      existingRole.adUserRoleDescription = description;
      existingRole.adUserRolePermission = permissions;
      existingRole.adUserRoleStatus = status === this.activeTag ? this.activeId : status === this.inactiveTag ? this.inactiveId : this.blockedId;

      await this.AdUserRoleRepo.save(existingRole);

      return responseFormatter.success(req, res, 200, {}, true, this.codes.SUCCESS, 'Admin user role updated successfully');
    } catch (error) {
      console.error('Error updating admin user role:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }
}
