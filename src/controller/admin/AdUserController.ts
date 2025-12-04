import { NextFunction, Request, Response } from 'express';
import AppDataSource from '../../data-source';
import AdUser from '../../entity/AdUser';
import AdUserRole from '../../entity/AdUserRole';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';
import { hashPassword, verifyPassword } from '../../helper/user/passwordHandler';
import { createTokens, refreshAccessToken, decodeRefreshToken } from '../../helper/user/tokenHandler';

type AdUserTyp = InstanceType<typeof AdUser>;
type AdUserRoleTyp = InstanceType<typeof AdUserRole>;

interface AdUserResultInt {
  no: number;
  name: string;
  email: string;
  mobile: string;
  status: string;
  statusLabel: string;
  role: number;
  roleLabel: string;
  isVerified: boolean;
}

interface CountResultInt {
  total: number;
}

export default class AdUserController {
  private AdUserRepo = AppDataSource.getRepository(AdUser);
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
   * GET /admin/users - Get admin users with pagination and search
   */
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, page } = req.query;

      const pageNo: number = page ? Number(page) : 1;
      const skip: number = (pageNo - 1) * this.pageLimit;

      let whereClause: string = '';
      if (!this.isEmptyString(search as string)) {
        whereClause = `WHERE au.adUserName LIKE '%${search}%' OR au.adUserEmail LIKE '%${search}%' OR au.adUserMobile LIKE '%${search}%'`;
      }

      const countQuery: string = `
        SELECT COUNT(*) as total FROM apt_ad_user au ${whereClause}
      `;
      const countResult: CountResultInt[] = await AppDataSource.query(countQuery);
      const total: number = Number(countResult[0].total);

      const getQuery: string = `
        SELECT 
          au.adUserId as no,
          au.adUserName as name,
          au.adUserEmail as email,
          au.adUserMobile as mobile,
          au.adUserIsVerified as isVerified,
          CASE 
            WHEN au.adUserStatus = ${this.activeId} THEN '${this.activeTag}'
            WHEN au.adUserStatus = ${this.inactiveId} THEN '${this.inactiveTag}'
            WHEN au.adUserStatus = ${this.blockedId} THEN '${this.blockedTag}'
            ELSE 'Unknown'
          END as status, 
          CASE 
            WHEN au.adUserStatus = ${this.activeId} THEN '${this.activeDescription}'
            WHEN au.adUserStatus = ${this.inactiveId} THEN '${this.inactiveDescription}'
            WHEN au.adUserStatus = ${this.blockedId} THEN '${this.blockedDescription}'
            ELSE 'Unknown'
          END as statusLabel, 
          aur.adUserRoleId as role,
          aur.adUserRoleName as roleLabel
        FROM apt_ad_user au 
        LEFT JOIN apt_ad_user_role aur ON au.adUserRoleId = aur.adUserRoleId 
        ${whereClause}
        ORDER BY au.adUserCreatedDate DESC 
        LIMIT ${this.pageLimit} 
        OFFSET ${skip}
      `;

      const paginatedUsers: AdUserResultInt[] = await AppDataSource.query(getQuery);

      const pages: number = Math.ceil(total / this.pageLimit);

      const result = {
        pagination: {
          page,
          total,
          pages
        },
        users: paginatedUsers
      };

      return responseFormatter.success(req, res, 200, result, true, this.codes.SUCCESS, 'Admin users retrieved successfully');
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * POST /admin/users - Create a new admin user
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, mobile, role } = req.body;

      if (!name || !email || !mobile || !role) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Name, email, mobile, and role are required'
        });
      }

      const adUserName = name;
      const adUserEmail = email;
      const adUserPassword = password ? await hashPassword(password) : await hashPassword('defaultPassword123');
      const adUserMobile = mobile;
      const adUserRoleId = role;

      const userRole: AdUserRoleTyp | null = await this.AdUserRoleRepo.findOne({
        where: { adUserRoleId: adUserRoleId }
      });

      if (!userRole) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: 'Admin user role not found'
        });
      }

      const existingUser: AdUserTyp | null = await this.AdUserRepo.findOne({
        where: [{ adUserEmail: adUserEmail }, { adUserMobile: adUserMobile }]
      });

      if (existingUser) {
        return responseFormatter.error(req, res, {
          statusCode: 409,
          status: false,
          message: 'Admin user with this email or mobile already exists'
        });
      }

      const newAdUser = new AdUser();
      newAdUser.adUserName = adUserName;
      newAdUser.adUserEmail = adUserEmail;
      newAdUser.adUserPassword = adUserPassword;
      newAdUser.adUserMobile = adUserMobile;
      newAdUser.adUserStatus = this.status.ACTIVE.ID;
      newAdUser.adUserRoleId = userRole;
      newAdUser.adUserIsVerified = password ? true : false; // If password provided, mark as verified

      await this.AdUserRepo.save(newAdUser);

      return responseFormatter.success(req, res, 201, {}, true, this.codes.SUCCESS, 'Admin user created successfully');
    } catch (error) {
      console.error('Error creating admin user:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * PUT /admin/users - Update an existing admin user
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { no, name, email, mobile, role, status } = req.body;

      if (!no) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'User no is required'
        });
      }

      const adUserName = name;
      const adUserEmail = email;
      const adUserMobile = mobile;
      const adUserRoleId = role;
      const adUserStatus = status;

      const existingUser: AdUserTyp | null = await this.AdUserRepo.findOne({
        where: { adUserId: no },
        relations: ['adUserRoleId']
      });

      if (!existingUser) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: 'Admin user not found'
        });
      }

      if (adUserRoleId && adUserRoleId !== existingUser.adUserRoleId.adUserRoleId) {
        const userRole: AdUserRoleTyp | null = await this.AdUserRoleRepo.findOne({
          where: { adUserRoleId: adUserRoleId }
        });

        if (!userRole) {
          return responseFormatter.error(req, res, {
            statusCode: 404,
            status: false,
            message: 'Admin user role not found'
          });
        }

        existingUser.adUserRoleId = userRole;
      }

      if (adUserEmail || adUserMobile) {
        const duplicateUser = await this.AdUserRepo.findOne({
          where: [{ adUserEmail: adUserEmail }, { adUserMobile: adUserMobile }]
        });

        if (duplicateUser && duplicateUser.adUserId !== existingUser.adUserId) {
          return responseFormatter.error(req, res, {
            statusCode: 409,
            status: false,
            message: 'Admin user with this email or mobile already exists'
          });
        }
      }

      existingUser.adUserName = adUserName;
      existingUser.adUserEmail = adUserEmail;
      existingUser.adUserMobile = adUserMobile;
      existingUser.adUserStatus = adUserStatus === this.activeTag ? this.activeId : adUserStatus === this.inactiveTag ? this.inactiveId : this.blockedId;

      await this.AdUserRepo.save(existingUser);

      return responseFormatter.success(req, res, 200, {}, true, this.codes.SUCCESS, 'Admin user updated successfully');
    } catch (error) {
      console.error('Error updating admin user:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * POST /admin/auth/login - Admin user login
   */
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

      const user: AdUserTyp | null = await this.AdUserRepo.findOne({
        where: { adUserEmail: email },
        relations: ['adUserRoleId']
      });

      if (!user) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: 'Admin user not found'
        });
      }

      // Validate password
      const isPasswordValid = await verifyPassword(password, user.adUserPassword);
      if (!isPasswordValid) {
        return responseFormatter.error(req, res, {
          statusCode: 401,
          status: false,
          message: this.messages.INVALID_CREDENTIALS
        });
      }

      // Check if user is active
      if (user.adUserStatus !== this.activeId) {
        return responseFormatter.error(req, res, {
          statusCode: 401,
          status: false,
          message: 'Admin account is not active'
        });
      }

      const tokens = await createTokens(user.adUserId.toString(), 'ADMIN');

      const resObj = {
        id: user.adUserId,
        username: user.adUserName,
        email: user.adUserEmail,
        mobile: user.adUserMobile,
        role: user.adUserRoleId
          ? {
              id: user.adUserRoleId.adUserRoleId,
              name: user.adUserRoleId.adUserRoleName,
              permissions: user.adUserRoleId.adUserRolePermission
            }
          : null,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };

      return responseFormatter.success(req, res, 200, resObj, true, this.codes.SUCCESS, 'Admin login successful');
    } catch (error) {
      console.error('Error during admin user login:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * POST /admin/auth/refresh-token - Refresh access token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Refresh token is required'
        });
      }

      // Decode and verify the refresh token
      const decoded = decodeRefreshToken(refreshToken);
      if (!decoded) {
        return responseFormatter.error(req, res, {
          statusCode: 401,
          status: false,
          message: this.messages.INVALID_TOKEN
        });
      }

      // Extract user_code from the decoded token
      const userCode = (decoded as any).user_code;
      if (!userCode) {
        return responseFormatter.error(req, res, {
          statusCode: 401,
          status: false,
          message: this.messages.INVALID_TOKEN
        });
      }

      // Verify the user still exists and is active
      const user: AdUserTyp | null = await this.AdUserRepo.findOne({
        where: { adUserId: parseInt(userCode) },
        relations: ['adUserRoleId']
      });

      if (!user) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: 'Admin user not found'
        });
      }

      // Check if user is still active
      if (user.adUserStatus !== this.activeId) {
        return responseFormatter.error(req, res, {
          statusCode: 401,
          status: false,
          message: this.messages.UNAUTHORIZED
        });
      }

      // Generate new access token
      const newAccessToken = refreshAccessToken(refreshToken);
      if (!newAccessToken) {
        return responseFormatter.error(req, res, {
          statusCode: 401,
          status: false,
          message: this.messages.INVALID_TOKEN
        });
      }

      const resObj = {
        accessToken: newAccessToken,
        refreshToken: refreshToken
      };

      return responseFormatter.success(req, res, 200, resObj, true, this.codes.SUCCESS, this.messages.TOKEN_REFRESHED_SUCCESS);
    } catch (error) {
      console.error('Error refreshing token:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * POST /admin/auth/signup - Admin user signup (for invited users)
   */
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, conPassword } = req.body;

      if (!email || !password) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Email and password are required'
        });
      }

      if (password !== conPassword) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Passwords do not match'
        });
      }

      const user: AdUserTyp | null = await this.AdUserRepo.findOne({
        where: { adUserEmail: email },
        relations: ['adUserRoleId']
      });

      if (!user) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: 'Admin user not found'
        });
      }

      // Check if user is already verified
      if (user.adUserIsVerified) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'User is already verified. Please login instead.'
        });
      }

      // Update user password and mark as verified
      user.adUserPassword = await hashPassword(password);
      user.adUserIsVerified = true;
      user.adUserStatus = this.status.ACTIVE.ID;

      await this.AdUserRepo.save(user);

      // Generate tokens for immediate login
      const tokens = await createTokens(user.adUserId.toString(), 'ADMIN');

      const resObj = {
        id: user.adUserId,
        username: user.adUserName,
        email: user.adUserEmail,
        mobile: user.adUserMobile,
        role: user.adUserRoleId
          ? {
              id: user.adUserRoleId.adUserRoleId,
              name: user.adUserRoleId.adUserRoleName,
              permissions: user.adUserRoleId.adUserRolePermission
            }
          : null,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };

      return responseFormatter.success(req, res, 200, resObj, true, this.codes.SUCCESS, 'Admin signup successful');
    } catch (error) {
      console.error('Error during admin user signup:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * PUT /admin/users/toggle-status - Toggle admin user status
   */
  async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { no } = req.body;

      if (!no) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'User no is required'
        });
      }

      const existingUser: AdUserTyp | null = await this.AdUserRepo.findOne({
        where: { adUserId: no },
        relations: ['adUserRoleId']
      });

      if (!existingUser) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: 'Admin user not found'
        });
      }

      // Toggle between ACTIVE and INACTIVE
      if (existingUser.adUserStatus === this.activeId) {
        existingUser.adUserStatus = this.inactiveId;
      } else {
        existingUser.adUserStatus = this.activeId;
      }

      await this.AdUserRepo.save(existingUser);

      const statusLabel = existingUser.adUserStatus === this.activeId ? this.activeDescription : this.inactiveDescription;

      return responseFormatter.success(req, res, 200, { status: statusLabel }, true, this.codes.SUCCESS, 'Admin user status updated successfully');
    } catch (error) {
      console.error('Error toggling admin user status:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }
}
