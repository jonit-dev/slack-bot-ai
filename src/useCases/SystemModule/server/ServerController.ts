import { Request, Response } from "express";
import { controller, httpPost, interfaces, request, response } from "inversify-express-utils";
import { HttpStatus } from "types/ServerTypes";

@controller("/")
export class ServerController implements interfaces.Controller {
  @httpPost("slack/events")
  private slackEvents(@request() req: Request, @response() res: Response): Response<any> {
    console.log(req.body);

    const { challenge } = req.body;

    return res.status(HttpStatus.OK).send(challenge);
  }
}
