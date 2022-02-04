import { FAQData } from "@providers/data/FAQ";
import { OpenAI } from "@providers/open-ai/OpenAI";
import { App } from "@slack/bolt";
import { provide } from "inversify-binding-decorators";
import stringSimilarity from "string-similarity";
@provide(SlackBot)
export class SlackBot {
  constructor(private openAI: OpenAI) {}

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

    this.app.event("app_mention", async ({ event, client, logger }) => {
      if (this.didSomeoneMentionedMe(event.text)) {
        const originChannel = event.channel;

        await this.lineOfTought(event, async (response) => {
          await client.chat.postMessage({
            channel: originChannel,
            text: response,
          });
        });
      }
    });

    this.app.message(async ({ payload, say, message }) => {
      if (payload.channel_type === "im" && payload.type === "message") {
        // if this is a direct message...

        await this.lineOfTought(payload, async (response) => {
          await say(response);
        });
      }
    });
  }

  private async lineOfTought(payload, submitMessageFn: (response) => void): Promise<void> {
    try {
      // Call chat.postMessage with the built-in client

      const faqAnswer = this.tryToFindKnowledgeBaseRelatedQuestion(payload);

      if (faqAnswer) {
        submitMessageFn(faqAnswer);
        // logger.info(result);
        return;
      }

      const genericAIResponse = await this.giveGenericGPT3Answer(payload);

      if (genericAIResponse) {
        submitMessageFn(genericAIResponse);
        return;
      }

      submitMessageFn("Sorry, I forgot to take my meds today... I have no idea what you're talking about...");
    } catch (error) {
      console.log(error);
    }
  }

  private tryToFindKnowledgeBaseRelatedQuestion(payload): string {
    // @ts-ignore
    const msg = payload.text.toLowerCase();

    for (const faqItem of this.FAQ.data) {
      for (const keyword of faqItem.keywords) {
        const splittedMessage = msg.split(" ");

        for (const slice of splittedMessage) {
          const similarity = stringSimilarity.compareTwoStrings(slice.toLocaleLowerCase(), keyword.toLocaleLowerCase());

          if (similarity > 0.6) {
            return faqItem.answer;
          }
        }
      }
    }
  }

  private async giveGenericGPT3Answer(payload): Promise<string> {
    const msg = payload.text.toLowerCase();

    const response = await this.openAI.createCompletion(msg);

    return response as string;
  }

  private didSomeoneMentionedMe(text: string): boolean {
    if (text.includes(process.env.SLACK_BOT_USER_ID)) {
      return true;
    }

    return false;
  }
}
