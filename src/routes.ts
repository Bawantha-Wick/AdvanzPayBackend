import UserRoutes from './routes/user.routes';
import CorpUserRoutes from './routes/corpUser.routes';
import CorpUserRoleRoutes from './routes/corpUserRole.routes';
import CorporateRoutes from './routes/corporate.routes';
import CorpEmpRoutes from './routes/corpEmp.routes';
import AuthRoutes from './routes/auth.routes';
import UserProfileRoutes from './routes/userProfile.routes';
import DashboardRoutes from './routes/dashboard.routes';
import BankAccountRoutes from './routes/bankAccount.routes';
import GoalRoutes from './routes/goal.routes';
import TransactionRoutes from './routes/transaction.routes';
import WithdrawalRoutes from './routes/withdrawal.routes';
import AdminRoutes from './routes/admin.routes';

const Routes = [
  ...UserRoutes,
  ...CorpUserRoutes,
  ...CorpUserRoleRoutes,
  ...CorporateRoutes,
  ...CorpEmpRoutes,
  ...AuthRoutes,
  ...UserProfileRoutes,
  ...DashboardRoutes,
  ...BankAccountRoutes,
  ...GoalRoutes,
  ...TransactionRoutes,
  ...WithdrawalRoutes,
  ...AdminRoutes //
];

// console.log(Routes)

export default Routes;
