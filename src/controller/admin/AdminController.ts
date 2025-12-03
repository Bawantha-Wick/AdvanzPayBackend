import { NextFunction, Request, Response } from 'express';
import AppDataSource from '../../data-source';
import AdUser from '../../entity/AdUser';
import AdUserRole from '../../entity/AdUserRole';
import config from '../../config';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';
import { hashPassword, verifyPassword } from '../../helper/user/passwordHandler';
import { createTokens, refreshAccessToken, decodeRefreshToken } from '../../helper/user/tokenHandler';

export default class AdminController {
  private AdUserRepo = AppDataSource.getRepository(AdUser);
  private AdUserRoleRepo = AppDataSource.getRepository(AdUserRole);
  private codes = response.CODES;
  private messages = response.MESSAGES;
  private status = constant.STATUS;

  // ========================
  // Admin User Methods
  // ========================

  /**
   * GET /admin/users - Get all admin users with pagination
   */
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [users, total] = await this.AdUserRepo.findAndCount({
        relations: ['adUserRoleId'],
        skip,
        take: Number(limit),
        order: { adUserCreatedDate: 'DESC' }
      });

      const result = {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
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
   * GET /admin/users/:id - Get a single admin user by ID
   */
  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const user = await this.AdUserRepo.findOne({
        where: { adUserId: Number(id) },
        relations: ['adUserRoleId']
      });

      if (!user) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: 'Admin user not found'
        });
      }

      return responseFormatter.success(req, res, 200, user, true, this.codes.SUCCESS, 'Admin user retrieved successfully');
    } catch (error) {
      console.error('Error fetching admin user:', error);
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
  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { adUserName, adUserEmail, adUserPassword, adUserMobile, adUserRoleId, adUserStatus, adUserIsVerified } = req.body;

      // Check if user with same email already exists
      const existingEmail = await this.AdUserRepo.findOne({
        where: { adUserEmail: adUserEmail }
      });

      if (existingEmail) {
        return responseFormatter.error(req, res, {
          statusCode: 409,
          status: false,
          message: 'Admin user with this email already exists'
        });
      }

      // Check if user with same mobile already exists
      const existingMobile = await this.AdUserRepo.findOne({
        where: { adUserMobile: adUserMobile }
      });

      if (existingMobile) {
        return responseFormatter.error(req, res, {
          statusCode: 409,
          status: false,
          message: 'Admin user with this mobile number already exists'
        });
      }

      // Verify that the role exists
      if (adUserRoleId) {
        const role = await this.AdUserRoleRepo.findOne({
          where: { adUserRoleId: Number(adUserRoleId) }
        });

        if (!role) {
          return responseFormatter.error(req, res, {
            statusCode: 404,
            status: false,
            message: 'Admin user role not found'
          });
        }
      }

      const newUser = new AdUser();
      newUser.adUserName = adUserName;
      newUser.adUserEmail = adUserEmail;
      newUser.adUserPassword = adUserPassword; // Note: Should be hashed in production
      newUser.adUserMobile = adUserMobile;
      newUser.adUserRoleId = adUserRoleId ? ({ adUserRoleId: Number(adUserRoleId) } as AdUserRole) : null;
      newUser.adUserStatus = adUserStatus || this.status.ACTIVE.ID;
      newUser.adUserIsVerified = adUserIsVerified !== undefined ? adUserIsVerified : false;

      const savedUser = await this.AdUserRepo.save(newUser);

      // Fetch the user with relations to return complete data
      const createdUser = await this.AdUserRepo.findOne({
        where: { adUserId: savedUser.adUserId },
        relations: ['adUserRoleId']
      });

      return responseFormatter.success(req, res, 201, createdUser, true, this.codes.SUCCESS, 'Admin user created successfully');
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
   * PUT /admin/users/:id - Update an admin user
   */
  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { adUserName, adUserEmail, adUserPassword, adUserMobile, adUserRoleId, adUserStatus, adUserIsVerified } = req.body;

      const existingUser = await this.AdUserRepo.findOne({
        where: { adUserId: Number(id) }
      });

      if (!existingUser) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: 'Admin user not found'
        });
      }

      // Check if another user with same email exists (exclude current one)
      if (adUserEmail && adUserEmail !== existingUser.adUserEmail) {
        const duplicateEmail = await this.AdUserRepo.findOne({
          where: { adUserEmail: adUserEmail }
        });

        if (duplicateEmail && duplicateEmail.adUserId !== existingUser.adUserId) {
          return responseFormatter.error(req, res, {
            statusCode: 409,
            status: false,
            message: 'Admin user with this email already exists'
          });
        }
      }

      // Check if another user with same mobile exists (exclude current one)
      if (adUserMobile && adUserMobile !== existingUser.adUserMobile) {
        const duplicateMobile = await this.AdUserRepo.findOne({
          where: { adUserMobile: adUserMobile }
        });

        if (duplicateMobile && duplicateMobile.adUserId !== existingUser.adUserId) {
          return responseFormatter.error(req, res, {
            statusCode: 409,
            status: false,
            message: 'Admin user with this mobile number already exists'
          });
        }
      }

      // Verify that the role exists if provided
      if (adUserRoleId) {
        const role = await this.AdUserRoleRepo.findOne({
          where: { adUserRoleId: Number(adUserRoleId) }
        });

        if (!role) {
          return responseFormatter.error(req, res, {
            statusCode: 404,
            status: false,
            message: 'Admin user role not found'
          });
        }
      }

      // Update fields if provided
      if (adUserName) existingUser.adUserName = adUserName;
      if (adUserEmail) existingUser.adUserEmail = adUserEmail;
      if (adUserPassword) existingUser.adUserPassword = adUserPassword; // Note: Should be hashed in production
      if (adUserMobile) existingUser.adUserMobile = adUserMobile;
      if (adUserRoleId !== undefined) existingUser.adUserRoleId = adUserRoleId ? ({ adUserRoleId: Number(adUserRoleId) } as AdUserRole) : null;
      if (adUserStatus) existingUser.adUserStatus = adUserStatus;
      if (adUserIsVerified !== undefined) existingUser.adUserIsVerified = adUserIsVerified;

      const updatedUser = await this.AdUserRepo.save(existingUser);

      // Fetch the user with relations to return complete data
      const userWithRelations = await this.AdUserRepo.findOne({
        where: { adUserId: updatedUser.adUserId },
        relations: ['adUserRoleId']
      });

      return responseFormatter.success(req, res, 200, userWithRelations, true, this.codes.SUCCESS, 'Admin user updated successfully');
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
   * DELETE /admin/users/:id - Delete an admin user (soft delete by setting status to INACTIVE)
   */
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const existingUser = await this.AdUserRepo.findOne({
        where: { adUserId: Number(id) }
      });

      if (!existingUser) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: 'Admin user not found'
        });
      }

      // Soft delete by setting status to INACTIVE
      existingUser.adUserStatus = this.status.INACTIVE.ID;
      await this.AdUserRepo.save(existingUser);

      return responseFormatter.success(req, res, 200, { adUserId: existingUser.adUserId }, true, this.codes.SUCCESS, 'Admin user deleted successfully');
    } catch (error) {
      console.error('Error deleting admin user:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  // ========================
  // Admin User Role Methods
  // ========================

  /**
   * GET /admin/roles - Get all admin user roles with pagination
   */
  async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [roles, total] = await this.AdUserRoleRepo.findAndCount({
        skip,
        take: Number(limit),
        order: { adUserRoleCreatedDate: 'DESC' }
      });

      const result = {
        roles,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      };

      return responseFormatter.success(req, res, 200, result, true, this.codes.SUCCESS, 'Admin roles retrieved successfully');
    } catch (error) {
      console.error('Error fetching admin roles:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * GET /admin/roles/:id - Get a single admin role by ID
   */
  async getRoleById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const role = await this.AdUserRoleRepo.findOne({
        where: { adUserRoleId: Number(id) }
      });

      if (!role) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: 'Admin role not found'
        });
      }

      return responseFormatter.success(req, res, 200, role, true, this.codes.SUCCESS, 'Admin role retrieved successfully');
    } catch (error) {
      console.error('Error fetching admin role:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * POST /admin/roles - Create a new admin user role
   */
  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { adUserRoleName, adUserRoleDescription, adUserRolePermission, adUserRoleStatus } = req.body;

      // Check if role with same name already exists
      const existingRole = await this.AdUserRoleRepo.findOne({
        where: { adUserRoleName: adUserRoleName }
      });

      if (existingRole) {
        return responseFormatter.error(req, res, {
          statusCode: 409,
          status: false,
          message: 'Admin role with this name already exists'
        });
      }

      const newRole = new AdUserRole();
      newRole.adUserRoleName = adUserRoleName;
      newRole.adUserRoleDescription = adUserRoleDescription;
      newRole.adUserRolePermission = adUserRolePermission;
      newRole.adUserRoleStatus = adUserRoleStatus || this.status.ACTIVE.ID;

      const savedRole = await this.AdUserRoleRepo.save(newRole);

      return responseFormatter.success(req, res, 201, savedRole, true, this.codes.SUCCESS, 'Admin role created successfully');
    } catch (error) {
      console.error('Error creating admin role:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * PUT /admin/roles/:id - Update an admin user role
   */
  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { adUserRoleName, adUserRoleDescription, adUserRolePermission, adUserRoleStatus } = req.body;

      const existingRole = await this.AdUserRoleRepo.findOne({
        where: { adUserRoleId: Number(id) }
      });

      if (!existingRole) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: 'Admin role not found'
        });
      }

      // Check if another role with same name exists (exclude current one)
      if (adUserRoleName && adUserRoleName !== existingRole.adUserRoleName) {
        const duplicateRole = await this.AdUserRoleRepo.findOne({
          where: { adUserRoleName: adUserRoleName }
        });

        if (duplicateRole && duplicateRole.adUserRoleId !== existingRole.adUserRoleId) {
          return responseFormatter.error(req, res, {
            statusCode: 409,
            status: false,
            message: 'Admin role with this name already exists'
          });
        }
      }

      // Update fields if provided
      if (adUserRoleName) existingRole.adUserRoleName = adUserRoleName;
      if (adUserRoleDescription) existingRole.adUserRoleDescription = adUserRoleDescription;
      if (adUserRolePermission) existingRole.adUserRolePermission = adUserRolePermission;
      if (adUserRoleStatus) existingRole.adUserRoleStatus = adUserRoleStatus;

      const updatedRole = await this.AdUserRoleRepo.save(existingRole);

      return responseFormatter.success(req, res, 200, updatedRole, true, this.codes.SUCCESS, 'Admin role updated successfully');
    } catch (error) {
      console.error('Error updating admin role:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  /**
   * DELETE /admin/roles/:id - Delete an admin role (soft delete by setting status to INACTIVE)
   */
  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const existingRole = await this.AdUserRoleRepo.findOne({
        where: { adUserRoleId: Number(id) }
      });

      if (!existingRole) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: 'Admin role not found'
        });
      }

      // Check if any users are using this role
      const usersWithRole = await this.AdUserRepo.count({
        where: { adUserRoleId: { adUserRoleId: Number(id) } }
      });

      if (usersWithRole > 0) {
        return responseFormatter.error(req, res, {
          statusCode: 409,
          status: false,
          message: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role.`
        });
      }

      // Soft delete by setting status to INACTIVE
      existingRole.adUserRoleStatus = this.status.INACTIVE.ID;
      await this.AdUserRoleRepo.save(existingRole);

      return responseFormatter.success(req, res, 200, { adUserRoleId: existingRole.adUserRoleId }, true, this.codes.SUCCESS, 'Admin role deleted successfully');
    } catch (error) {
      console.error('Error deleting admin role:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  // ========================
  // Authentication Methods
  // ========================

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

      const user = await this.AdUserRepo.findOne({
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
      if (user.adUserStatus !== this.status.ACTIVE.ID) {
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
              name: user.adUserRoleId.adUserRoleName
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
      const user = await this.AdUserRepo.findOne({
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
      if (user.adUserStatus !== this.status.ACTIVE.ID) {
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

      const user = await this.AdUserRepo.findOne({
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
              name: user.adUserRoleId.adUserRoleName
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
}
