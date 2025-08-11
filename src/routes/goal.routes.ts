import config from '../config';
import GoalController from '../controller/goal/GoalController';

const basePath = config.API_BASE_PATH + '/corp-emp/goals';
const goalController = new GoalController();

const GoalRoutes = [
  {
    method: 'get',
    route: basePath,
    controller: GoalController,
    action: goalController.get.bind(goalController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'get',
    route: basePath + '/priority',
    controller: GoalController,
    action: goalController.getPriority.bind(goalController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'get',
    route: basePath + '/:id',
    controller: GoalController,
    action: goalController.getById.bind(goalController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'post',
    route: basePath,
    controller: GoalController,
    action: goalController.create.bind(goalController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'put',
    route: basePath + '/:id',
    controller: GoalController,
    action: goalController.update.bind(goalController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'delete',
    route: basePath + '/:id',
    controller: GoalController,
    action: goalController.delete.bind(goalController)
    // middlewares: [authMiddleware]
  },

  {
    method: 'put',
    route: basePath + '/:id/progress',
    controller: GoalController,
    action: goalController.updateProgress.bind(goalController)
    // middlewares: [authMiddleware]
  }
];

export default GoalRoutes;
