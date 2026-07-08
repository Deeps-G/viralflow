'use client';

import React from 'react';
import { X, Zap, Check, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  currentUsage?: number;
  limit?: number;
}

export function UpgradeModal({ isOpen, onClose, feature = 'AI generation', currentUsage = 0, limit = 10 }: UpgradeModalProps) {
  if (!isOpen) return null;

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        '1 brand',
        '3 campaigns/month',
        `10 AI ${feature}s/day`,
        '5 competitor analyses/day',
        'Community support',
      ],
      cta: 'Current Plan',
      disabled: true,
      highlight: false,
    },
    {
      name: 'Pro',
      price: '$49',
      period: '/month',
      features: [
        '5 brands',
        'Unlimited campaigns',
        `100 AI ${feature}s/day`,
        '50 competitor analyses/day',
        'Priority support',
        'Export to Notion/Sheets',
        'Advanced analytics',
      ],
      cta: 'Upgrade to Pro',
      disabled: false,
      highlight: true,
      badge: 'MOST POPULAR',
    },
    {
      name: 'Agency',
      price: '$199',
      period: '/month',
      features: [
        '25 brands',
        'Unlimited campaigns',
        `1000 AI ${feature}s/day`,
        '500 competitor analyses/day',
        'White-label reports',
        'API access',
        'Dedicated account manager',
      ],
      cta: 'Upgrade to Agency',
      disabled: false,
      highlight: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-white/10 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="relative p-8 border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-violet-400">LIMIT REACHED</div>
              <div className="text-2xl font-semibold">Upgrade to unlock more {feature}</div>
            </div>
          </div>

          <p className="text-slate-400 max-w-2xl">
            You've used <span className="text-white font-semibold">{currentUsage}/{limit}</span> {feature}s today.
            Upgrade now to continue generating viral content and never hit a limit again.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-3 gap-6 p-8">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative rounded-3xl p-8 transition-all ${
                plan.highlight
                  ? 'bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-2 border-violet-500'
                  : 'bg-zinc-950 border border-white/10 hover:border-white/20'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full text-xs font-bold tracking-widest">
                  {plan.badge}
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                {plan.highlight && <Crown className="w-5 h-5 text-violet-400" />}
                <div className="text-xl font-semibold">{plan.name}</div>
              </div>

              <div className="mb-6">
                <span className="text-5xl font-semibold tracking-tighter">{plan.price}</span>
                <span className="text-slate-400 text-sm ml-1">{plan.period}</span>
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                disabled={plan.disabled}
                className={`w-full ${
                  plan.highlight
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
                onClick={() => {
                  if (!plan.disabled) {
                    alert(`Redirecting to Stripe checkout for ${plan.name} plan...`);
                    // In production: call /api/checkout
                  }
                }}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-8 pt-0 border-t border-white/10 mt-4">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>7-day money-back guarantee</span>
            </div>
            <div>Cancel anytime • Secure payment via Stripe</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Small inline upgrade banner for sidebar/dashboard
export function UpgradeBanner({ feature, currentUsage, limit }: { feature: string; currentUsage: number; limit: number }) {
  const percentUsed = (currentUsage / limit) * 100;
  const isNearLimit = percentUsed >= 80;
  const isAtLimit = percentUsed >= 100;

  if (!isNearLimit && !isAtLimit) return null;

  return (
    <div className={`rounded-2xl p-4 border ${
      isAtLimit
        ? 'bg-red-500/10 border-red-500/30'
        : 'bg-amber-500/10 border-amber-500/30'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className={`w-5 h-5 ${isAtLimit ? 'text-red-400' : 'text-amber-400'}`} />
          <div>
            <div className="text-sm font-medium">
              {isAtLimit ? `${feature} limit reached` : `You're almost out of ${feature}`}
            </div>
            <div className="text-xs text-slate-400">
              {currentUsage} of {limit} used today
            </div>
          </div>
        </div>
        <Button size="sm" className="bg-white text-black hover:bg-white/90 text-xs">
          Upgrade →
        </Button>
      </div>
      
      <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            isAtLimit ? 'bg-red-400' : 'bg-amber-400'
          }`}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>
    </div>
  );
}
