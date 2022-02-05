import { FAQData } from "@providers/data/FAQ";
import { OpenAI } from "@providers/open-ai/OpenAI";
import { StackOverflow } from "@providers/stack-overflow/StackOverflow";
import { App } from "@slack/bolt";
import { provide } from "inversify-binding-decorators";

@provide(SlackBot)
export class SlackBot {
  constructor(private openAI: OpenAI, private stackOverflow: StackOverflow) {}

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
    const incomingMessage = payload.text as string;

    try {
      // Call chat.postMessage with the built-in client

      if (incomingMessage.toLowerCase().includes("search on stackoverflow:")) {
        await this.checkForStackOverflowQuestions(incomingMessage, submitMessageFn);
        return;
      }
      const faqAnswer = this.tryToFindKnowledgeBaseRelatedQuestion(payload);

      if (faqAnswer) {
        submitMessageFn(faqAnswer);
        // logger.info(result);
        return;
      }

      // check if user asked for stackoverflow help

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

  private async checkForStackOverflowQuestions(incomingMessage: string, submitMessageFn): Promise<void> {
    const query = incomingMessage.split(":")[1];

    console.log(query);

    const search = await this.stackOverflow.search({
      intitle: query,
    });

    if (search.items.length === 0) {
      submitMessageFn("Hmm... I didn't find anything useful for you. Sorry!");
      return;
    }

    // get only first 10 results
    const topResults = search.items.slice(0, 10);

    const formattedResults = topResults.map((item) => {
      console.log(item.link);
      return `💡 ${item.title} - ${item.link}`;
    });
    console.log(formattedResults);

    const reply = `Here are the results for your query: ${query}:\n${formattedResults.join("\n")}`;

    submitMessageFn(reply);
  }

  private tryToFindKnowledgeBaseRelatedQuestion(payload): string {
    // @ts-ignore
    const msg = payload.text.toLowerCase();

    for (const faqItem of this.FAQ.data) {
      for (const keyword of faqItem.keywords) {
        const splittedMessage = msg.split(" ");

        for (const slice of splittedMessage) {
          if (slice.match(new RegExp(`${keyword}`, "ig"))) {
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
