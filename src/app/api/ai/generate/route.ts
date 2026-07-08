import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { generateAIHooks, generateContentIdeas, analyzeCompetitorWithAI } from '@/lib/ai-service';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type, brandName, campaignType, industry, competitorName, platform } = await request.json();

    let result;

    if (type === 'hooks') {
      result = await generateAIHooks(brandName, campaignType, industry, user.id);
    } else if (type === 'content-ideas') {
      result = await generateContentIdeas(brandName, industry, platform || 'Instagram', user.id);
    } else if (type === 'competitor-analysis') {
      result = await analyzeCompetitorWithAI(competitorName, industry, brandName, user.id);
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    if (error.message?.startsWith('LIMIT_REACHED:')) {
      const parts = error.message.split(':');
      return NextResponse.json({
        error: 'LIMIT_REACHED',
        feature: parts[1],
        currentUsage: parseInt(parts[2]),
        limit: parseInt(parts[3]),
      }, { status: 429 });
    }
    
    console.error('AI generation error:', error);
    return NextResponse.json({ error: 'Failed to generate' }, { status: 500 });
  }
}
