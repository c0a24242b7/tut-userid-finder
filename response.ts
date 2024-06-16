import { GetUser as OkResponse } from "./get-user";

export interface ErrResponse {
  message: string;
  documentation_url: string;
  status: string;
}

export type GetUserResponse =
  | {
      success: true;
      body: OkResponse;
    }
  | {
      success: false;
      body: ErrResponse;
    };
