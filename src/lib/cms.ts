import "server-only"
import {getPayload} from "payload"
import config from "@payload-config"

/** Payload's local API for server code. It skips access checks, so each query must ask only for what the page shows. */
export function getCms() {
  return getPayload({config})
}
