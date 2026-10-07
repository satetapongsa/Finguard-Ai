import { NextRequest, NextResponse } from "next/server";
import { runWatcher } from "@/lib/agents/ingestion/watcher-agent";

/**
 * Server-side Scheduled Watcher Endpoint (Vercel Cron compatible)
 * Requires Bearer authorization or ?secret= matching CRON_SECRET or WATCHER_SECRET
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secretParam = req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.CRON_SECRET || process.env.WATCHER_SECRET || "finguard-cron-internal-key-2026";

  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const providedSecret = bearerToken || secretParam;

  if (!providedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing cron secret" },
      { status: 401 }
    );
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "true";
  const forceBot = req.nextUrl.searchParams.get("forceBot") !== "false";

  try {
    const result = await runWatcher(undefined, "system:scheduled-cron", {
      dryRun,
      forceBotSource: forceBot,
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      dryRun,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Scheduled watcher execution failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
