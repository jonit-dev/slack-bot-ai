import { InternalServerError } from "@providers/errors/InternalServerError";
import { StackOverflow } from "@providers/stack-overflow/StackOverflow";
import { Request, Response } from "express";
import { controller, httpGet, interfaces, queryParam, request, response } from "inversify-express-utils";
import { HttpStatus } from "types/ServerTypes";

@controller("/stackoverflow")
export class StackOverflowController implements interfaces.Controller {
  constructor(private stackOverflow: StackOverflow) {}

  @httpGet("/search")
  private async search(@request() req: Request, @response() res: Response): Promise<any> {
    try {
      const response = await this.stackOverflow.searchSimilar({
        title: "what is nodejs",
      });

      return res.status(HttpStatus.OK).send(response);
    } catch (error) {
      throw new InternalServerError("Oops! Something went wrong!");
    }
  }

  @httpGet("/callback")
  private async callback(
    @request() req: Request,
    @response() res: Response,
    @queryParam("code") code
  ): Promise<Response<any>> {
    const response = await this.stackOverflow.getAccessToken(code);
    console.log(response);
    return res.status(HttpStatus.OK).send(response);
  }
}
