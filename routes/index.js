const moviesRouter = require("./movie");
const usersRouter = require("./user");

const setupRoutes = (app) => {
  app.use("/api/movies", moviesRouter);
  app.use("/api/users", usersRouter);
};

module.exports = {
  setupRoutes,
};
