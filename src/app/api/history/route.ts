import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { POLYGON_CHAIN } from "@/config/contract";
import { loadHistoryFromClient } from "@/lib/contractHistory";

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
    return NextResponse.json(
      { error: "Polygon history is temporarily unavailable", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 503 },
    );
  }
}
