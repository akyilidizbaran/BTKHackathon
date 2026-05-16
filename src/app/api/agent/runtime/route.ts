import { apiOk } from "@/lib/api/responses";
import { getSharedAgentRuntimeApiData } from "@/lib/agents/runtime";

export async function GET(): Promise<Response> {
  return apiOk(getSharedAgentRuntimeApiData());
}
