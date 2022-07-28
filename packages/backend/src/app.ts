import path from "path";
import moduleAlias from "module-alias";
moduleAlias.addAliases({
  "@backend": `${__dirname}`,
  "@core": `${path.resolve(__dirname, "../../core/src")}`,
});
import dotenv from "dotenv";
const dotenvResult = dotenv.config();
if (dotenvResult.error) {
  throw dotenvResult.error;
}
import express from "express";
import * as http from "http";
import helmet from "helmet";
import corsWhitelist from "@backend/common/middleware/cors.middleware";
import { verifySession } from "supertokens-node/recipe/session/framework/express";
import { SessionRequest } from "supertokens-node/framework/express";
import Session from "supertokens-node/recipe/session";
// import { errorHandler, middleware } from "supertokens-node/framework/express";
import { Logger } from "@core/logger/winston.logger";
import { CommonRoutesConfig } from "@backend/common/common.routes.config";
import { AuthRoutes } from "@backend/auth/auth.routes.config";
import { EventRoutes } from "@backend/event/event.routes.config";
import { PriorityRoutes } from "@backend/priority/priority.routes.config";
import { SyncRoutes } from "@backend/sync/sync.routes.config";
import { CalendarRoutes } from "@backend/calendar/calendar.routes.config";
import { ENV } from "@backend/common/constants/env.constants";
import mongoService from "@backend/common/services/mongo.service";
import expressLogger from "@backend/common/logger/express.logger";
import {
  catchSyncErrors,
  promiseMiddleware,
} from "@backend/common/middleware/promise.middleware";
import {
  supertokensCors,
  supertokensErrorHandler,
  supertokensMiddleware,
} from "@backend/common/middleware/supertokens.middleware";

/* Misc Configuration */
const logger = Logger("app:root");
mongoService;

//--
// /* Supertokens */
// supertokens.init({
//   appInfo: {
//     appName: APP_NAME,
//     // apiDomain: "http://localhost:3000",  //prev 9080
//     apiDomain: `http://localhost:${PORT_DEFAULT_API}`,
//     websiteDomain: `http://localhost:${PORT_DEFAULT_WEB}`,
//     apiBasePath: "/api",
//   },
//   supertokens: {
//     connectionURI: ENV.SUPERTOKENS_URI,
//     apiKey: ENV.SUPERTOKENS_KEY,
//   },
//   enableDebugLogs: true,
//   framework: "express",
//   recipeList: [Session.init()],
// });

/* Express Configuration */
const app: express.Application = express();
// initialize middleware before routes, because
// some routes depend on them
//@ts-ignore
app.use(promiseMiddleware());

/* supertokens middleware */
//--
// app.use(
//   cors({
//     // origin: "http://localhost:9080", //--
//     origin: `http://localhost:${PORT_DEFAULT_WEB}`,
//     allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
//     credentials: true,
//   })
// );
app.use(supertokensCors());
app.use(supertokensMiddleware());
app.use(corsWhitelist);
app.use(helmet());
app.use(expressLogger);
app.use(express.json());
// app.use(catchUndefinedSyncErrors);
app.use(catchSyncErrors); // might need to move down

const routes: Array<CommonRoutesConfig> = [];
routes.push(new AuthRoutes(app));
routes.push(new PriorityRoutes(app));
routes.push(new EventRoutes(app));
routes.push(new SyncRoutes(app));
routes.push(new CalendarRoutes(app));

app.use(supertokensErrorHandler()); // Keep this after all routes

/* Express Start */
const server: http.Server = http.createServer(app);
const port = ENV.PORT;
server.listen(port, () => {
  logger.info(`Server running on port: ${port}`);
});
