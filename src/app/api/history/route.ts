import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { POLYGON_CHAIN } from "@/config/contract";
import { getVerifiedFallbackHistory, loadHistoryFromClient } from "@/lib/contractHistory";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function serializeBigInts<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === "bigint" ? item.toString() : item)) as T;
}

export async function GET() {
  try {
    const client = createPublicClient({
      chain: POLYGON_CHAIN,
      transport: http(process.env.POLYGON_RPC_URL || "https://polygon.api.onfinality.io/public", {
        retryCount: 2,
        timeout: 15_000,
      }),
    });
    const history = await loadHistoryFromClient(client);
    return NextResponse.json(serializeBigInts(history), {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45" },
    });
  } catch (error) {
    console.error("[api/history] Polygon RPC unavailable; serving verified checkpoint", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(serializeBigInts(getVerifiedFallbackHistory()), {
      headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=300" },
    });
  }
}
