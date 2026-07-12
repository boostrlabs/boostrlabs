import { liveDemoResponse } from "../_lib/janko-live-demo.js";

export async function onRequest(){
  return liveDemoResponse();
}
