import { AXIOS_STACK_OVERFLOW } from "@providers/constants/axiosConstants";
import { AxiosRequestConfig } from "axios";
import { provide } from "inversify-binding-decorators";
import objectToQuery from "object-to-querystring";
import qs from "qs";
import { IStackOverflowResponseItem } from "types/StackOverflowTypes";

@provide(StackOverflow)
export class StackOverflow {
  private accessToken: string = process.env.STACKOVERFLOW_ACCESS_TOKEN;

  public async search(params: Record<string, unknown>): Promise<{ items: IStackOverflowResponseItem[] }> {
    const response = await this.request({
      method: "GET",
      url: `/search${objectToQuery({
        ...params,
        site: "stackoverflow",
      })}`,
    });

    return response.data;
  }

  public async getAccessToken(code: string): Promise<any> {
    try {
      const response = await this.request({
        method: "POST",
        url: "https://stackoverflow.com/oauth/access_token/json",
        data: qs.stringify({
          client_id: "22784",
          client_secret: process.env.STACKOVERFLOW_CLIENT_SECRET,
          code,
          redirect_uri: `https://${process.env.STACKOVERFLOW_OAUTH_DOMAIN}/stackoverflow/callback`,
        }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return response.data;
    } catch (error) {
      console.error(error);
    }
  }

  public generateApprovalUrl(): string {
    const params = {
      client_id: process.env.STACKOVERFLOW_CLIENT_ID,
      scope: "no_expiry",
      redirect_uri: `https://${process.env.STACKOVERFLOW_OAUTH_DOMAIN}/stackoverflow/callback`,
    };

    const queryParams = objectToQuery(params);

    const url = `https://stackoverflow.com/oauth${queryParams}`;

    console.log(url);

    return url;
  }

  private async request(config: AxiosRequestConfig): Promise<any> {
    try {
      const response = AXIOS_STACK_OVERFLOW.request({
        ...config,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      return response;
    } catch (error) {
      console.error(error.message);
    }
  }
}
