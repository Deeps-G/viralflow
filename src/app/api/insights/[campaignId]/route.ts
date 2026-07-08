import { NextResponse } from 'next/server';
import { db } from '@/db';
import { campaignInsights } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const insights = await db.select().from(campaignInsights).where(
    eq(campaignInsights.campaignId, campaignId)
  );

  return NextResponse.json({ insights: insights[0] || null });
}
