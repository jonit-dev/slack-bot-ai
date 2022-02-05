import { AxiosResponse } from "axios";
import { provide } from "inversify-binding-decorators";
import { Configuration, CreateCompletionResponse, OpenAIApi } from "openai";

@provide(OpenAI)
export class OpenAI {
  private configuration = new Configuration({
    apiKey: process.env.OPEN_AI_API_KEY,
  });

  private api = new OpenAIApi(this.configuration);

  public async createCompletion(
    prompt: string,
    returnFirstChoice: boolean = true
  ): Promise<string | AxiosResponse<CreateCompletionResponse, any>> {
    try {
      const response = await this.api.createCompletion("text-davinci-001", {
        prompt,
        max_tokens: 300,
        temperature: 1,
        presence_penalty: 1,
      });

      if (returnFirstChoice) {
        return response.data.choices[0].text;
      }

      return response;
    } catch (error) {
      console.error(error);
    }
  }
}
