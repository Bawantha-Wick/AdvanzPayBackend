import { Request, Response } from 'express';

interface SuccessResponse {
  statusCode: number;
  status: boolean;
  responseCode: string;
  message: string;
  data: any;
}

interface ErrorResponse {
  statusCode: number;
  status: boolean;
  message: string;
  // tag: string;
}

interface ZodError {
  type: string;
  code: string;
  expected: string;
  received: string;
  path: (string | number)[];
  message: string;
}

/**
 *  path: req.path,
 *  originalUrl: req.originalUrl,
 *  query: req.query,
 *  params: req.params,
 *  headers: req.headers,
 *  body: req.body,
 *  userData: req.userData
 */
const responseFormatter = {
  success: async (req: Request, res: Response, code: number, data: any, status: boolean, responseCode: string = '', message: string = ''): Promise<void> => {
    const responseData: SuccessResponse = {
      statusCode: code,
      status,
      responseCode,
      message,
      data
    };

    res.status(code).json(responseData);
  },

  error: async (req: Request, res: Response, error: ErrorResponse): Promise<void> => {
    const errorResponse: ErrorResponse = {
      statusCode: error.statusCode || 400,
      status: false,
      message: error.message || 'Something went wrong!'
    };

    res.status(errorResponse.statusCode).json(errorResponse);
  },

  validationError: async (req: Request, res: Response, error: ErrorResponse): Promise<void> => {
    const issues: ZodError[] = error ? (error['errors'] ? error['errors'] : []) : [];

    let errorMsg: string = '';

    if (issues.length !== 0) {
      if (issues[0].path.length !== 0) {
        if (issues[0].path.includes('email') && issues[0].code === 'invalid_string') {
          const { email } = req.body;

          if (email.length != 0) {
            issues[0].message = 'Please enter a valid e-mail address';
          } else {
            issues[0].message = 'Please enter the e-mail address';
          }
        } else if (issues[0].path.includes('password') && issues[0].code === 'too_small') {
          const { password } = req.body;

          if (password.length != 0) {
            issues[0].message = 'Please enter a valid password';
          } else {
            issues[0].message = 'Please enter the password';
          }
        } else if (issues[0].path.includes('fullName') && issues[0].code === 'too_small') {
          const { fullName } = req.body;

          if (fullName.length != 0) {
            issues[0].message = 'Please enter a valid full name';
          } else {
            issues[0].message = 'Please enter your full name';
          }
        }
      }

      errorMsg = issues[0].message;
    }

    const errorResponse: ErrorResponse = {
      statusCode: 400,
      status: false,
      message: errorMsg || 'Something went wrong!'
    };

    res.status(errorResponse.statusCode).json(errorResponse);
  }
};

export default responseFormatter;
