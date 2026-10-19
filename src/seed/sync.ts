import config from "@payload-config"
import { getPayload } from "payload"
const payload = await getPayload({ config })
console.log("schema synced")
process.exit(0)
