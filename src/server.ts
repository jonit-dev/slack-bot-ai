import "reflect-metadata"; //! THIS IMPORT MUST ALWAYS COME FIRST. BEWARE VSCODE AUTO IMPORT SORT!!!
import "express-async-errors";
import "dotenv/config";

import cors from "cors";
import express from "express";
import { getRouteInfo, InversifyExpressServer } from "inversify-express-utils";
import morgan from "morgan";
import * as prettyjson from "prettyjson";
import { container, serverHelper, slackBot } from "./providers/inversify/container";
import { errorHandlerMiddleware } from "./providers/middlewares/ErrorHandlerMiddleware";

const port = process.env.PORT || 5000;

const server = new InversifyExpressServer(container);

server.setConfig((app) => {
  // Middlewares ========================================
  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));
  app.use(express.static("public"));

  slackBot.app.start(port);
  slackBot.init();
  serverHelper.showBootstrapMessage({ env: process.env.ENV, port: Number(port) });
});

const app = server.build();
app.listen(port);

if (process.argv.includes("--show-routes")) {
  const routeInfo = getRouteInfo(container);
  console.log(prettyjson.render({ routes: routeInfo }));
}

app.use(errorHandlerMiddleware); //! This must come last, otherwise it fails to catch errors thrown
