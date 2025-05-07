import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as swaggerUi from 'swagger-ui-express';
import * as swaggerJSDoc from 'swagger-jsdoc';
import * as basicAuth from 'express-basic-auth';
import * as cors from 'cors';

import './constant/customInterface.global';
import config from './config';

import { Request, Response } from 'express';
import { AppDataSource } from './data-source';
import { Routes } from './routes';
import { Authorizer } from './middleware/Authorizer';

AppDataSource.initialize()
  .then(async () => {
    console.log("Data Source has been initialized!");
  })
  .catch((error) => console.log(error));
