import { NextResponse } from 'next/server';
import { db } from '@/db';
import { usageLogs } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, gte } from 'drizzle-orm';
import { USAGE_LIMITS } from '@/lib/ai-service';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (user.role || 'free') as 'free' | 'pro' | 'agency';
  const limits = USAGE_LIMITS[role.toUpperCase() as keyof typeof USAGE_LIMITS];

  // Get today's usage
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayLogs = await db.select().from(usageLogs).where(
    and(
      eq(usageLogs.userId, user.id),
      gte(usageLogs.createdAt, startOfDay)
    )
  );

  const usage = {
    aiGenerations: todayLogs.filter(l => l.feature.startsWith('ai_')).length,
    competitorAnalysis: todayLogs.filter(l => l.feature === 'competitor_analysis').length,
    brands: 0, // Count from brands table
    campaigns: 0, // Count from campaigns table
  };

  return NextResponse.json({
    role,
    limits,
    usage,
    remaining: {
      aiGenerations: Math.max(0, limits.aiGenerations - usage.aiGenerations),
      competitorAnalysis: Math.max(0, limits.competitorAnalysis - usage.competitorAnalysis),
      brands: Math.max(0, limits.brands - usage.brands),
      campaigns: Math.max(0, limits.campaigns - usage.campaigns),
    },
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { feature } = await request.json();
  
  await db.insert(usageLogs).values({
    userId: user.id,
    feature,
  });

  return NextResponse.json({ success: true });
}
