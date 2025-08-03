import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as swaggerUi from 'swagger-ui-express';
import * as swaggerJSDoc from 'swagger-jsdoc';
import * as basicAuth from 'express-basic-auth';
import * as cors from 'cors';

import './constant/customInterface.global';
import config from './config';

import { Request, Response } from 'express';
import AppDataSource from './data-source';
import Routes from './routes';
import Authorizer from './middleware/Authorizer';

AppDataSource.initialize()
  .then(async () => {
    const app = express();

    app.use(cors());
    app.use(bodyParser.json({ limit: '1mb' }));
    app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

    if (config.NODE_ENV === 'local' || config.NODE_ENV === 'dev') {
      const swaggerDefinition = {
        info: {
          title: 'AdvanzPay',
          version: '1.0.0',
          description: 'AdvanzPay Backend API Documentation'
        },
        host: config.HOST,
        basePath: config.API_BASE_PATH
      };

      const options = {
        swaggerDefinition: swaggerDefinition,
        apis: ['./**/documentation/*.yaml', './documentation/*.yaml']
      };

      const swaggerSpec = swaggerJSDoc(options);
      const users = {};
      users[config.SWAGGER_USERNAME] = config.SWAGGER_PASSWORD;

      app.use('/docs', basicAuth({ users: users, challenge: true }), swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    }

    app.use(Authorizer());

    Routes.forEach((route) => {
      (app as any)[route.method](route.route, (req: Request, res: Response, next: Function) => {
        let result;
        if (typeof route.action === 'function') {
          // If action is a function reference, call it directly
          result = route.action(req, res, next);
        } else {
          // If action is a string, create instance and call method
          result = new (route.controller as any)()[route.action](req, res, next);
        }

        if (result instanceof Promise) {
          result.then((result) => (result !== null && result !== undefined ? res.send(result) : undefined));
        } else if (result !== null && result !== undefined) {
          res.json(result);
        }
      });
    });

    app.listen(config.PORT);

    console.log(`AdvanzPay backend server has started on port ${config.PORT} of the ${config.NODE_ENV} environment`);
  })
  .catch((error) => console.error(error));
