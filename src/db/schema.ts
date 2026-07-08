import { pgTable, text, timestamp, integer, decimal, boolean, jsonb, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name'),
  password: text('password').notNull(),
  role: text('role', { enum: ['free', 'pro', 'enterprise'] }).default('free'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  industry: text('industry'),
  logoUrl: text('logo_url'),
  website: text('website'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id').references(() => brands.id).notNull(),
  name: text('name').notNull(),
  type: text('type', { enum: ['social', 'email', 'ad', 'influencer'] }).notNull(),
  status: text('status', { enum: ['draft', 'active', 'paused', 'completed'] }).default('draft'),
  budget: decimal('budget', { precision: 12, scale: 2 }),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const campaignInsights = pgTable('campaign_insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').references(() => campaigns.id).notNull(),
  reach: integer('reach').default(0),
  engagement: integer('engagement').default(0),
  conversions: integer('conversions').default(0),
  roi: decimal('roi', { precision: 5, scale: 2 }).default('0'),
  generatedAt: timestamp('generated_at').defaultNow(),
  insightsJson: jsonb('insights_json').default(sql`'{}'::jsonb`),
});

export const competitors = pgTable('competitors', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id').references(() => brands.id).notNull(),
  name: text('name').notNull(),
  website: text('website'),
  followerCount: integer('follower_count').default(0),
  lastAnalyzed: timestamp('last_analyzed').defaultNow(),
  analysisJson: jsonb('analysis_json').default(sql`'{}'::jsonb`),
});

export const usageLogs = pgTable('usage_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  feature: text('feature').notNull(), // 'ai_hook', 'competitor_analysis', 'campaign_insight', etc.
  createdAt: timestamp('created_at').defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Brand = typeof brands.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type CampaignInsight = typeof campaignInsights.$inferSelect;
export type Competitor = typeof competitors.$inferSelect;
