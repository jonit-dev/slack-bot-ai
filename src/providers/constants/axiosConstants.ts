import axios from "axios";

export const AXIOS_STACK_OVERFLOW = axios.create({
  baseURL: "https://api.stackexchange.com/2.3",
});
