import { App } from "@slack/bolt";
import { provide } from "inversify-binding-decorators";

@provide(SlackBot)
export class SlackBot {
  public app: App = new App({
    token: process.env.SLACK_BOT_OAUTH_TOKEN,
    signingSecret: process.env.SLACK_BOT_SIGNING_SECRET,
    socketMode: true, // enable the following to use socket mode
    appToken: process.env.SLACK_APP_LEVEL_TOKEN,
  });

  public init(): void {
    this.app.command("/knowledge", async ({ command, ack, say }) => {
      try {
        await ack();
        say("Yaaay! that command works!");
      } catch (error) {
        console.log("err");
        console.error(error);
      }
    });

    this.app.message("hey", async ({ say }) => {
      try {
        say("Yaaay! that command works!");
      } catch (error) {
        console.log("err");
        console.error(error);
      }
    });
  }
}
