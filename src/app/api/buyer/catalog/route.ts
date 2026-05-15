import { apiOk } from "@/lib/api/responses";
import { getBuyerCatalogApiData } from "@/lib/api/buyer-catalog";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);

  return apiOk(
    getBuyerCatalogApiData({
      category: url.searchParams.get("category"),
      sort: url.searchParams.get("sort"),
    }),
  );
}
