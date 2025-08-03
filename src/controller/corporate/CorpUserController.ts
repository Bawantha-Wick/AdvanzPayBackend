import { MoreThan } from 'typeorm';
import { NextFunction, Request, Response } from 'express';
import * as moment from 'moment';
import AppDataSource from '../../data-source';
import Corporate from '../../entity/Corporate';
import CorpUser from '../../entity/CorpUser';
import CorpUserRole from '../../entity/CorpUserRole';
import config from '../../config';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';
import { hashPassword } from '../../helper/user/passwordHandler';

type CorpUserTyp = InstanceType<typeof CorpUser>;
type CorporateTyp = InstanceType<typeof Corporate>;
type CorpUserRoleTyp = InstanceType<typeof CorpUserRole>;

interface CorpUserResultInt {
  id: number;
  name: string;
  email: string;
  title: string;
  mobile: string;
  status: string;
  cId: number;
  corp: string;
  rId: number;
  role: string;
}

interface CountResultInt {
  total: number;
}

export default class CorpUserController {
  private CorpUserRepo = AppDataSource.getRepository(CorpUser);
  private CorporateRepo = AppDataSource.getRepository(Corporate);
  private CorpUserRoleRepo = AppDataSource.getRepository(CorpUserRole);
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

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, page } = req.query;

      const corpId = 1;
      const pageNo: number = page ? Number(page) : 1;
      const skip: number = (pageNo - 1) * pageLimit;

      let whereClause: string = `WHERE cu.corpId = ${Number(corpId)}`;
      if (!isEmptyString(search)) {
        whereClause += ` AND (cu.corpUsrName LIKE '%${search}%' OR cu.corpUsrEmail LIKE '%${search}%' OR cu.corpUsrTitle LIKE '%${search}%')`;
      }

      const countQuery: string = `
        SELECT COUNT(*) as total FROM apt_corp_user cu ${whereClause}
      `;
      const countResult: CountResultInt[] = await AppDataSource.query(countQuery);
      const total: number = Number(countResult[0].total);

      const getQuery: string = `
        SELECT 
          cu.corpUsrId as no,
          cu.corpUsrName as name,
          cu.corpUsrEmail as email,
          cu.corpUsrTitle as title,
          cu.corpUsrMobile as mobile,
          CASE 
            WHEN cu.corpUsrStatus = ${this.activeId} THEN '${this.activeTag}'
            WHEN cu.corpUsrStatus = ${this.inactiveId} THEN '${this.inactiveTag}'
            WHEN cu.corpUsrStatus = ${this.blockedId} THEN '${this.blockedTag}'
            ELSE 'Unknown'
          END as status, 
          CASE 
            WHEN cu.corpUsrStatus = ${this.activeId} THEN '${this.activeDescription}'
            WHEN cu.corpUsrStatus = ${this.inactiveId} THEN '${this.inactiveDescription}'
            WHEN cu.corpUsrStatus = ${this.blockedId} THEN '${this.blockedDescription}'
            ELSE 'Unknown'
          END as statusLabel, 
          cur.corpUserRoleId as role,
          cur.corpUserRoleName as roleLabel
        FROM apt_corp_user cu 
        LEFT JOIN apt_corp c ON cu.corpId = c.corpId 
        LEFT JOIN apt_corp_user_role cur ON cu.corpUserRoleId = cur.corpUserRoleId 
        ${whereClause}
        ORDER BY cu.corpUsrCreatedDate DESC 
        LIMIT ${pageLimit} 
        OFFSET ${skip}
      `;

      const paginatedUsers: CorpUserResultInt[] = await AppDataSource.query(getQuery);

      const pages: number = Math.ceil(total / pageLimit);

      const result = {
        pagination: {
          page,
          total,
          pages
        },
        users: paginatedUsers
      };

      return responseFormatter.success(req, res, 200, result, true, this.codes.SUCCESS, this.messages.CORP_USER_LIST_RETRIEVED);
    } catch (error) {
      console.error('Error fetching corporate users:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, title, mobile, role } = req.body;

      if (!name || !email || !password || !title || !mobile || !role) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Name, email, password, title, mobile, and role are required'
        });
      }

      const corpId = 1;
      const corpUsrName = name;
      const corpUsrEmail = email;
      const corpUsrPassword = await hashPassword(password);
      const corpUsrTitle = title;
      const corpUsrMobile = mobile;
      const corpUserRoleId = role;
      const corpUsrCreatedBy = 1;

      const corporate: CorporateTyp | null = await this.CorporateRepo.findOne({
        where: { corpId: corpId }
      });

      if (!corporate) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.CORPORATE_NOT_FOUND
        });
      }

      const userRole: CorpUserRoleTyp | null = await this.CorpUserRoleRepo.findOne({
        where: { corpUserRoleId: corpUserRoleId }
      });

      if (!userRole) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.CORPORATE_USER_ROLE_NOT_FOUND
        });
      }

      const existingUser: CorpUserTyp | null = await this.CorpUserRepo.findOne({
        where: [
          { corpUsrEmail: corpUsrEmail, corpId: { corpId: corporate.corpId } },
          { corpUsrMobile: corpUsrMobile, corpId: { corpId: corporate.corpId } }
        ]
      });

      if (existingUser) {
        return responseFormatter.error(req, res, {
          statusCode: 409,
          status: false,
          message: this.messages.CORP_USER_ALREADY_EXISTS
        });
      }

      const newCorpUser = new CorpUser();
      newCorpUser.corpId = corporate;
      newCorpUser.corpUsrName = corpUsrName;
      newCorpUser.corpUsrEmail = corpUsrEmail;
      newCorpUser.corpUsrPassword = corpUsrPassword;
      newCorpUser.corpUsrTitle = corpUsrTitle;
      newCorpUser.corpUsrMobile = corpUsrMobile;
      newCorpUser.corpUsrStatus = this.status.ACTIVE.ID;
      newCorpUser.corpUserRoleId = userRole;
      newCorpUser.corpUsrCreatedBy = corpUsrCreatedBy;
      newCorpUser.corpUsrLastUpdatedBy = corpUsrCreatedBy;

      await this.CorpUserRepo.save(newCorpUser);

      return responseFormatter.success(req, res, 201, {}, true, this.codes.SUCCESS, this.messages.CORP_USER_CREATED);
    } catch (error) {
      console.error('Error creating corporate user:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { no, name, email, title, mobile, role, status } = req.body;

      if (!no) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'User no is required'
        });
      }

      const corpUsrName = name;
      const corpUsrEmail = email;
      const corpUsrTitle = title;
      const corpUsrMobile = mobile;
      const corpUserRoleId = role;
      const corpUsrStatus = status;
      const corpUsrLastUpdatedBy = 1;

      const existingUser: CorpUserTyp | null = await this.CorpUserRepo.findOne({
        where: { corpUsrId: no },
        relations: ['corpId', 'corpUserRoleId']
      });

      if (!existingUser) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.CORP_USER_NOT_FOUND
        });
      }

      if (corpUserRoleId && corpUserRoleId !== existingUser.corpUserRoleId.corpUserRoleId) {
        const userRole: CorpUserRoleTyp | null = await this.CorpUserRoleRepo.findOne({
          where: { corpUserRoleId: corpUserRoleId }
        });

        if (!userRole) {
          return responseFormatter.error(req, res, {
            statusCode: 404,
            status: false,
            message: this.messages.CORPORATE_USER_ROLE_NOT_FOUND
          });
        }
        existingUser.corpUserRoleId = userRole;
      }

      if (corpUsrEmail || corpUsrMobile) {
        const duplicateCheck = await this.CorpUserRepo.findOne({
          where: [
            { corpUsrEmail: corpUsrEmail || existingUser.corpUsrEmail, corpId: { corpId: existingUser.corpId.corpId } },
            { corpUsrMobile: corpUsrMobile || existingUser.corpUsrMobile, corpId: { corpId: existingUser.corpId.corpId } }
          ]
        });

        if (duplicateCheck && duplicateCheck.corpUsrId !== existingUser.corpUsrId) {
          return responseFormatter.error(req, res, {
            statusCode: 409,
            status: false,
            message: this.messages.CORP_USER_EMAIL_MOBILE_EXISTS
          });
        }
      }

      existingUser.corpUsrName = corpUsrName;
      existingUser.corpUsrEmail = corpUsrEmail;
      existingUser.corpUsrTitle = corpUsrTitle;
      existingUser.corpUsrMobile = corpUsrMobile;
      existingUser.corpUsrStatus =
        corpUsrStatus === this.activeTag //
          ? this.activeId
          : corpUsrStatus === this.inactiveTag
          ? this.inactiveId
          : this.blockedId;
      existingUser.corpUsrLastUpdatedBy = corpUsrLastUpdatedBy;

      await this.CorpUserRepo.save(existingUser);

      return responseFormatter.success(req, res, 200, {}, true, this.codes.SUCCESS, this.messages.CORP_USER_UPDATED);
    } catch (error) {
      console.error('Error updating corporate user:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Email and password are required'
        });
      }

      const user: CorpUserTyp | null = await this.CorpUserRepo.findOne({
        where: { corpUsrEmail: email },
        relations: ['corpId', 'corpUserRoleId']
      });

      if (!user) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.CORP_USER_NOT_FOUND
        });
      }

      // Validate password (assuming a function hashPassword exists)
      const isPasswordValid = await hashPassword(password) === user.corpUsrPassword;
      if (!isPasswordValid) {
        return responseFormatter.error(req, res, {
          statusCode: 401,
          status: false,
          message: this.messages.INVALID_CREDENTIALS
        });
      }

      // Here you would typically generate a JWT token and return it
      // For simplicity, we will just return the user data
      return responseFormatter.success(req, res, 200, { user }, true, this.codes.SUCCESS, this.messages.CORP_USER_LOGIN_SUCCESS);
    } catch (error) {
      console.error('Error during corporate user login:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }
}
