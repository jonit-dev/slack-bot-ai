import { SlackBot } from "@providers/slack-bot/SlackBot";
import { StackOverflow } from "@providers/stack-overflow/StackOverflow";
import { Container } from "inversify";
import { buildProviderModule } from "inversify-binding-decorators";
import { ServerHelper } from "../server/ServerHelper";
import { controllersContainer } from "./ControllersInversify";

const container = new Container();

container.load(controllersContainer, buildProviderModule());

export const serverHelper = container.get<ServerHelper>(ServerHelper);

export const slackBot = container.get<SlackBot>(SlackBot);

export const stackOverflow = container.get<StackOverflow>(StackOverflow);

export { container };
