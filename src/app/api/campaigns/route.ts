import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { campaigns, campaignInsights, brands } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { generateCampaignInsights } from '@/lib/insights-engine';

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const brandId = url.searchParams.get('brandId');

  if (brandId) {
    const allCampaigns = await db.select().from(campaigns).where(eq(campaigns.brandId, brandId));
    return NextResponse.json({ campaigns: allCampaigns });
  }

  const allCampaigns = await db.select().from(campaigns);
  return NextResponse.json({ campaigns: allCampaigns });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { brandId, name, type, budget, startDate, endDate } = body;

    // Fetch brand for context
    const [brand] = await db.select().from(brands).where(eq(brands.id, brandId));

    const [campaign] = await db.insert(campaigns).values({
      brandId,
      name,
      type,
      budget: budget ? parseFloat(budget).toString() : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: 'active',
    }).returning();

    // Generate algorithmic insights (zero API cost)
    const insights = generateCampaignInsights({
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      budget: campaign.budget,
      brandIndustry: brand?.industry || '',
      brandName: brand?.name || '',
    });

    await db.insert(campaignInsights).values({
      campaignId: campaign.id,
      reach: insights.reach,
      engagement: insights.engagement,
      conversions: insights.conversions,
      roi: insights.roi,
      insightsJson: insights.insightsJson,
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('Campaign creation error:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
