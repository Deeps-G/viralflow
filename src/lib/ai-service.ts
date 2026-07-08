import Groq from 'groq-sdk';
import { db } from '@/db';
import { users, usageLogs } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { generateViralHooks as algoHooks, generateCampaignInsights, generateCompetitorAnalysis } from './insights-engine';

// Initialize Groq client (FREE tier: 14K requests/min)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy-key', // Will use fallback if not set
});

// Usage limits for free tier (per user per day)
export const USAGE_LIMITS = {
  FREE: {
    aiGenerations: 10, // AI-powered generations per day
    competitorAnalysis: 5, // Competitor analyses per day
    brands: 1, // Max brands
    campaigns: 3, // Max campaigns per month
  },
  PRO: {
    aiGenerations: 100,
    competitorAnalysis: 50,
    brands: 5,
    campaigns: 999,
  },
  AGENCY: {
    aiGenerations: 1000,
    competitorAnalysis: 500,
    brands: 25,
    campaigns: 9999,
  },
};

// Check if user has hit their limit
export async function checkUsageLimit(userId: string, feature: 'aiGenerations' | 'competitorAnalysis' | 'brands' | 'campaigns') {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new Error('User not found');

  const role = user.role as 'free' | 'pro' | 'agency';
  const limits = USAGE_LIMITS[role.toUpperCase() as keyof typeof USAGE_LIMITS];
  
  // Get current usage (you'd track this in a usage_logs table)
  // For now, we'll use a simple approach
  const currentUsage = await getCurrentUsage(userId, feature);
  
  return {
    allowed: currentUsage < limits[feature],
    current: currentUsage,
    limit: limits[feature],
    remaining: Math.max(0, limits[feature] - currentUsage),
  };
}

// Track usage using database
async function getCurrentUsage(userId: string, feature: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const logs = await db.select().from(usageLogs).where(
    and(
      eq(usageLogs.userId, userId),
      eq(usageLogs.feature, feature),
      gte(usageLogs.createdAt, startOfDay)
    )
  );

  return logs.length;
}

export async function logUsage(userId: string, feature: string) {
  await db.insert(usageLogs).values({
    userId,
    feature,
  });
}

// AI-powered viral hook generation
export async function generateAIHooks(brandName: string, campaignType: string, industry: string, userId?: string): Promise<string[]> {
  // Check usage limit if userId provided
  if (userId) {
    const limit = await checkUsageLimit(userId, 'aiGenerations');
    if (!limit.allowed) {
      throw new Error(`LIMIT_REACHED:aiGenerations:${limit.current}:${limit.limit}`);
    }
  }

  // Check if Groq API key is available
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'dummy-key') {
    console.log('No Groq API key, using algorithmic fallback');
    const rand = () => Math.random();
    const hooks = algoHooks(brandName, campaignType, rand);
    if (userId) await logUsage(userId, 'ai_hook');
    return hooks;
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a viral marketing expert who creates scroll-stopping hooks for social media. 
          Your hooks should be:
          - Curiosity-driven
          - Emotionally engaging
          - Optimized for the first 3 seconds
          - Authentic and not clickbaity
          - Specific to the ${industry} industry`
        },
        {
          role: "user",
          content: `Generate 5 viral hooks for a ${campaignType} campaign for "${brandName}" in the ${industry} space. 
          Make them punchy, curiosity-driven, and optimized for engagement. 
          Return ONLY the 5 hooks, one per line, no numbering or extra text.`
        }
      ],
      model: "mixtral-8x7b-32768", // Fast, free, powerful
      temperature: 0.8,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content || '';
    const hooks = content.split('\n').filter(h => h.trim()).slice(0, 5);
    
    // Log usage
    if (userId) await logUsage(userId, 'ai_hook');
    
    // If AI didn't return enough hooks, supplement with algorithmic
    if (hooks.length < 5) {
      const rand = () => Math.random();
      const algoResult = algoHooks(brandName, campaignType, rand);
      return [...hooks, ...algoResult].slice(0, 5);
    }
    
    return hooks;
  } catch (error) {
    console.error('Groq API error, using fallback:', error);
    // Fallback to algorithmic engine
    const rand = () => Math.random();
    return algoHooks(brandName, campaignType, rand);
  }
}

// AI-powered competitor analysis
export async function analyzeCompetitorWithAI(competitorName: string, industry: string, yourBrandName: string, userId?: string): Promise<any> {
  // Check usage limit
  if (userId) {
    const limit = await checkUsageLimit(userId, 'competitorAnalysis');
    if (!limit.allowed) {
      throw new Error(`LIMIT_REACHED:competitorAnalysis:${limit.current}:${limit.limit}`);
    }
  }

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'dummy-key') {
    console.log('No Groq API key, using algorithmic fallback');
    const result = generateCompetitorAnalysis(competitorName, industry);
    if (userId) await logUsage(userId, 'competitor_analysis');
    return result;
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a competitive intelligence analyst. Analyze competitors and provide actionable insights.
          Be specific, data-driven, and provide concrete recommendations.`
        },
        {
          role: "user",
          content: `Analyze "${competitorName}" as a competitor to "${yourBrandName}" in the ${industry} space.
          Provide a JSON response with:
          - strengths: array of 3 strengths
          - weaknesses: array of 3 weaknesses
          - opportunities: array of 3 opportunities for us
          - threats: array of 2 threats
          - recommendedStrategy: detailed 2-3 sentence strategy
          - topContentTypes: array of 3 content formats they use well
          
          Return ONLY valid JSON, no extra text.`
        }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || '{}';
    const analysis = JSON.parse(content);
    
    // Combine with algorithmic data for completeness
    const algoAnalysis = generateCompetitorAnalysis(competitorName, industry);
    
    if (userId) await logUsage(userId, 'competitor_analysis');
    return {
      followerCount: algoAnalysis.followerCount,
      growthRate: algoAnalysis.growthRate,
      engagementRate: algoAnalysis.engagementRate,
      viralScore: algoAnalysis.viralScore,
      analysisJson: {
        ...algoAnalysis.analysisJson,
        ...analysis, // AI insights override algorithmic ones
      },
    };
  } catch (error) {
    console.error('Groq competitor analysis error, using fallback:', error);
    return generateCompetitorAnalysis(competitorName, industry);
  }
}

// AI-powered campaign insights
export async function generateAICampaignInsights(campaign: any): Promise<any> {
  // Always use algorithmic for base metrics (more reliable)
  const baseInsights = generateCampaignInsights(campaign);
  
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'dummy-key') {
    return baseInsights;
  }

  try {
    // Use AI to enhance the recommendations
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a marketing strategist. Provide specific, actionable campaign recommendations.`
        },
        {
          role: "user",
          content: `For a ${campaign.type} campaign for "${campaign.brandName}" (${campaign.brandIndustry}), 
          with a budget of $${campaign.budget || 2500}, provide 3 specific next steps to maximize viral potential.
          Return a JSON array of 3 strings. Only return the JSON array, nothing else.`
        }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.8,
      max_tokens: 300,
    });

    const content = completion.choices[0]?.message?.content || '[]';
    try {
      const aiSteps = JSON.parse(content);
      if (Array.isArray(aiSteps) && aiSteps.length > 0) {
        baseInsights.insightsJson.nextSteps = aiSteps.slice(0, 4);
      }
    } catch {}

    return baseInsights;
  } catch (error) {
    console.error('Groq campaign insights error, using base:', error);
    return baseInsights;
  }
}

// Generate AI-powered content ideas
export async function generateContentIdeas(brandName: string, industry: string, platform: string, userId?: string): Promise<string[]> {
  // Check usage limit
  if (userId) {
    const limit = await checkUsageLimit(userId, 'aiGenerations');
    if (!limit.allowed) {
      throw new Error(`LIMIT_REACHED:aiGenerations:${limit.current}:${limit.limit}`);
    }
  }

  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'dummy-key') {
    const ideas = [
      `Behind-the-scenes of ${brandName}`,
      `Customer success story`,
      `3 tips for ${industry} success`,
      `Day in the life at ${brandName}`,
      `Myth vs Reality in ${industry}`,
    ];
    if (userId) await logUsage(userId, 'ai_content_idea');
    return ideas;
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a content strategist specializing in viral ${platform} content.`
        },
        {
          role: "user",
          content: `Generate 5 viral content ideas for "${brandName}" (${industry}) specifically for ${platform}.
          Make them specific, engaging, and optimized for virality.
          Return a JSON array of 5 strings. Only return the array.`
        }
      ],
      model: "mixtral-8x7b-32768",
      temperature: 0.9,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content || '[]';
    const ideas = JSON.parse(content);
    if (userId) await logUsage(userId, 'ai_content_idea');
    return ideas;
  } catch (error) {
    console.error('Content ideas error:', error);
    return ['Content idea 1', 'Content idea 2', 'Content idea 3'];
  }
}
