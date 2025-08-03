import UserRoutes from './routes/user.routes';
import CorpUserRoutes from './routes/corpUser.routes';
import CorpUserRoleRoutes from './routes/corpUserRole.routes';
import CorporateRoutes from './routes/corporate.routes';
import CorpEmpRoutes from './routes/corpEmp.routes';

const Routes = [
  ...UserRoutes,
  ...CorpUserRoutes,
  ...CorpUserRoleRoutes,
  ...CorporateRoutes,
  ...CorpEmpRoutes
  //
];

export default Routes;
