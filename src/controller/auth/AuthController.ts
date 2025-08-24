import { NextFunction, Request, Response } from 'express';
import * as moment from 'moment';
import AppDataSource from '../../data-source';
import CorpEmp from '../../entity/CorpEmp';
import Corporate from '../../entity/Corporate';
import PasswordResetOtp from '../../entity/PasswordResetOtp';
import config from '../../config';
import constant from '../../constant';
import response from '../../constant/response';
import responseFormatter from '../../helper/response/responseFormatter';
import { hashPassword, verifyPassword } from '../../helper/user/passwordHandler';
import { createTokens, refreshAccessToken, decodeRefreshToken } from '../../helper/user/tokenHandler';
import { generatePasswordResetCode } from '../../helper/user/generateOtpCode';

type CorpEmpTyp = InstanceType<typeof CorpEmp>;
type CorporateTyp = InstanceType<typeof Corporate>;
type PasswordResetOtpTyp = InstanceType<typeof PasswordResetOtp>;

export default class AuthController {
  private CorpEmpRepo = AppDataSource.getRepository(CorpEmp);
  private CorporateRepo = AppDataSource.getRepository(Corporate);
  private PasswordResetOtpRepo = AppDataSource.getRepository(PasswordResetOtp);
  private codes = response.CODES;
  private messages = response.MESSAGES;
  private status = constant.STATUS;

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

      const employee: CorpEmpTyp | null = await this.CorpEmpRepo.findOne({
        where: { corpEmpEmail: email },
        relations: ['corpId']
      });

      if (!employee) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.EMPLOYEE_NOT_FOUND
        });
      }

      const isPasswordValid = await verifyPassword(password, employee.corpEmpPassword);
      if (!isPasswordValid) {
        return responseFormatter.error(req, res, {
          statusCode: 401,
          status: false,
          message: this.messages.INVALID_CREDENTIALS
        });
      }

      const tokens = await createTokens(employee.corpEmpId.toString(), 'ADM');

      const userData = {
        id: employee.corpEmpId.toString(),
        name: employee.corpEmpName,
        email: employee.corpEmpEmail,
        avatar: null
      };

      return responseFormatter.success(
        req,
        res,
        200,
        {
          user: userData,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        },
        true,
        this.codes.SUCCESS,
        this.messages.LOGIN_SUCCESS
      );
    } catch (error) {
      console.error('Error during login:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, confirmPassword } = req.body;

      if (!email || !password || !confirmPassword) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Email, password, and confirm password are required'
        });
      }

      if (password !== confirmPassword) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Passwords do not match'
        });
      }

      const emailDomain = email.substring(email.lastIndexOf('@') + 1);
      const name = email.substring(0, email.lastIndexOf('@'));

      const corporate: CorporateTyp | null = await this.CorporateRepo.findOne({
        where: { corpEmailDomain: emailDomain }
      });

      if (!corporate) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.CORPORATE_NOT_FOUND
        });
      }

      const existingEmployee: CorpEmpTyp | null = await this.CorpEmpRepo.findOne({
        where: { corpEmpEmail: email }
      });

      if (existingEmployee) {
        return responseFormatter.error(req, res, {
          statusCode: 409,
          status: false,
          message: this.messages.EMPLOYEE_ALREADY_EXISTS
        });
      }

      const hashedPassword = await hashPassword(password);

      const newCorpEmp = new CorpEmp();
      newCorpEmp.corpId = corporate;
      newCorpEmp.corpEmpName = name || '';
      newCorpEmp.corpEmpEmail = email;
      newCorpEmp.corpEmpPassword = hashedPassword;
      newCorpEmp.corpEmpMobile = '';
      newCorpEmp.corpEmpBasicSalAmt = 0;
      newCorpEmp.corpEmpAccNo = '';
      newCorpEmp.corpEmpAccName = '';
      newCorpEmp.corpEmpAccBank = '';
      newCorpEmp.corpEmpAccBranch = '';
      newCorpEmp.corpEmpStatus = this.status.INACTIVE.ID;
      newCorpEmp.corpEmpIsInitiallyApproved = false;
      newCorpEmp.corpEmpCreatedBy = 0;
      newCorpEmp.corpEmpLastUpdatedBy = 0;

      const savedEmployee = await this.CorpEmpRepo.save(newCorpEmp);

      const userData = {
        id: savedEmployee.corpEmpId.toString(),
        name: savedEmployee.corpEmpName,
        email: savedEmployee.corpEmpEmail
      };

      return responseFormatter.success(
        req,
        res,
        201,
        {
          user: userData,
          requiresApproval: true
        },
        true,
        this.codes.SUCCESS,
        this.messages.SIGNUP_SUCCESS
      );
    } catch (error) {
      console.error('Error during signup:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Email is required'
        });
      }

      const employee: CorpEmpTyp | null = await this.CorpEmpRepo.findOne({
        where: { corpEmpEmail: email }
      });

      if (!employee) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.EMPLOYEE_NOT_FOUND
        });
      }

      const otpCode = generatePasswordResetCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Delete existing OTPs for this email
      await this.PasswordResetOtpRepo.delete({ email: email });

      const newOtp = new PasswordResetOtp();
      newOtp.email = email;
      newOtp.otpCode = otpCode;
      newOtp.expiresAt = expiresAt;
      newOtp.status = this.status.ACTIVE.ID;
      newOtp.createdBy = 0;
      newOtp.lastUpdatedBy = 0;

      await this.PasswordResetOtpRepo.save(newOtp);

      // Send OTP email (implement this based on your email service)
      // await sendEmail(email, 'Password Reset OTP', `Your OTP is: ${otpCode}`);

      return responseFormatter.success(
        req,
        res,
        200,
        {
          message: 'OTP sent to your email'
        },
        true,
        this.codes.SUCCESS,
        this.messages.OTP_SENT_SUCCESS
      );
    } catch (error) {
      console.error('Error during forgot password:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Email and OTP are required'
        });
      }

      const otpRecord: PasswordResetOtpTyp | null = await this.PasswordResetOtpRepo.findOne({
        where: {
          email: email,
          otpCode: otp,
          status: this.status.ACTIVE.ID
        }
      });

      if (!otpRecord) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Invalid OTP'
        });
      }

      if (otpRecord.expiresAt < new Date()) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'OTP has expired'
        });
      }

      // Generate reset token
      const resetToken = createTokens(email, 'ADM').accessToken;

      // Mark OTP as used
      otpRecord.status = this.status.INACTIVE.ID;
      await this.PasswordResetOtpRepo.save(otpRecord);

      return responseFormatter.success(
        req,
        res,
        200,
        {
          message: 'OTP verified successfully',
          resetToken: resetToken
        },
        true,
        this.codes.SUCCESS,
        this.messages.OTP_VERIFIED_SUCCESS
      );
    } catch (error) {
      console.error('Error during OTP verification:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      if (!email) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Email is required'
        });
      }

      const employee: CorpEmpTyp | null = await this.CorpEmpRepo.findOne({
        where: { corpEmpEmail: email }
      });

      if (!employee) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.EMPLOYEE_NOT_FOUND
        });
      }

      const otpCode = generatePasswordResetCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Delete existing OTPs for this email
      await this.PasswordResetOtpRepo.delete({ email: email });

      const newOtp = new PasswordResetOtp();
      newOtp.email = email;
      newOtp.otpCode = otpCode;
      newOtp.expiresAt = expiresAt;
      newOtp.status = this.status.ACTIVE.ID;
      newOtp.createdBy = 0;
      newOtp.lastUpdatedBy = 0;

      await this.PasswordResetOtpRepo.save(newOtp);

      // Send OTP email
      // await sendEmail(email, 'Password Reset OTP', `Your OTP is: ${otpCode}`);

      return responseFormatter.success(
        req,
        res,
        200,
        {
          message: 'OTP resent successfully'
        },
        true,
        this.codes.SUCCESS,
        this.messages.OTP_RESENT_SUCCESS
      );
    } catch (error) {
      console.error('Error during OTP resend:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { resetToken, newPassword, confirmPassword } = req.body;

      if (!resetToken || !newPassword || !confirmPassword) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Reset token, new password, and confirm password are required'
        });
      }

      if (newPassword !== confirmPassword) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Passwords do not match'
        });
      }

      // Verify reset token (implement token verification logic)
      // For now, we'll assume the token contains the email
      const tokenPayload = decodeRefreshToken(resetToken);
      if (!tokenPayload) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Invalid or expired reset token'
        });
      }

      const email = (tokenPayload as any).user_code; // Assuming email is stored in user_code
      const employee: CorpEmpTyp | null = await this.CorpEmpRepo.findOne({
        where: { corpEmpEmail: email }
      });

      if (!employee) {
        return responseFormatter.error(req, res, {
          statusCode: 404,
          status: false,
          message: this.messages.EMPLOYEE_NOT_FOUND
        });
      }

      const hashedPassword = await hashPassword(newPassword);
      employee.corpEmpPassword = hashedPassword;
      employee.corpEmpLastUpdatedBy = employee.corpEmpId;

      await this.CorpEmpRepo.save(employee);

      return responseFormatter.success(
        req,
        res,
        200,
        {
          message: 'Password reset successfully'
        },
        true,
        this.codes.SUCCESS,
        this.messages.PASSWORD_RESET_SUCCESS
      );
    } catch (error) {
      console.error('Error during password reset:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // In a real implementation, you might want to blacklist the token
      // For now, we'll just return a success response
      return responseFormatter.success(req, res, 200, null, true, this.codes.SUCCESS, this.messages.LOGOUT_SUCCESS);
    } catch (error) {
      console.error('Error during logout:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Refresh token is required'
        });
      }

      const newAccessToken = refreshAccessToken(refreshToken);
      if (!newAccessToken) {
        return responseFormatter.error(req, res, {
          statusCode: 401,
          status: false,
          message: 'Invalid or expired refresh token'
        });
      }

      // Generate a new refresh token as well
      const tokenPayload = decodeRefreshToken(refreshToken);
      const userCode = (tokenPayload as any).user_code;
      const newTokens = createTokens(userCode, 'ADM');

      return responseFormatter.success(
        req,
        res,
        200,
        {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken
        },
        true,
        this.codes.SUCCESS,
        this.messages.TOKEN_REFRESHED_SUCCESS
      );
    } catch (error) {
      console.error('Error during token refresh:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req as any)?.user_code; // From auth middleware

      if (!currentPassword || !newPassword) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Current password and new password are required'
        });
      }

      if (!userId) {
        return responseFormatter.error(req, res, {
          statusCode: 401,
          status: false,
          message: 'Unauthorized'
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

      const isCurrentPasswordValid = await verifyPassword(currentPassword, employee.corpEmpPassword);
      if (!isCurrentPasswordValid) {
        return responseFormatter.error(req, res, {
          statusCode: 400,
          status: false,
          message: 'Current password is incorrect'
        });
      }

      const hashedPassword = await hashPassword(newPassword);
      employee.corpEmpPassword = hashedPassword;
      employee.corpEmpLastUpdatedBy = employee.corpEmpId;

      await this.CorpEmpRepo.save(employee);

      return responseFormatter.success(req, res, 200, null, true, this.codes.SUCCESS, this.messages.PASSWORD_CHANGED_SUCCESS);
    } catch (error) {
      console.error('Error during password change:', error);
      return responseFormatter.error(req, res, {
        statusCode: 500,
        status: false,
        message: this.messages.INTERNAL_SERVER_ERROR
      });
    }
  }
}
