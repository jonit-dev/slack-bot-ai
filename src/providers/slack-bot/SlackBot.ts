import { FAQData } from "@providers/data/FAQ";
import { App } from "@slack/bolt";
import { provide } from "inversify-binding-decorators";
import stringSimilarity from "string-similarity";
@provide(SlackBot)
export class SlackBot {
  public app: App = new App({
    token: process.env.SLACK_BOT_OAUTH_TOKEN,
    signingSecret: process.env.SLACK_BOT_SIGNING_SECRET,
    socketMode: true, // enable the following to use socket mode
    appToken: process.env.SLACK_APP_LEVEL_TOKEN,
  });

  private FAQ = FAQData;

  public init(): void {
    this.app.command("/knowledge", async ({ command, ack, say }) => {
      try {
        await ack();

        await say(`Sorry, I don't know how to answer to "${command.text} yet!"`);
      } catch (error) {
        console.log("err");
        console.error(error);
      }
    });

    this.app.message(async ({ payload, say, message }) => {
      try {
        if (payload.type === "message") {
          // @ts-ignore
          const msg = payload.text.toLowerCase();

          for (const faqItem of this.FAQ.data) {
            for (const keyword of faqItem.keywords) {
              const splittedMessage = msg.split(" ");

              for (const slice of splittedMessage) {
                const similarity = stringSimilarity.compareTwoStrings(slice, keyword);
                if (similarity > 0.6) {
                  await say(faqItem.answer);
                  return;
                }
              }
            }
          }
        }
      } catch (error) {
        console.log("err");
        console.error(error);
      }
    });
  }
}
