'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Zap, 
  BarChart3, 
  Award, 
  ArrowRight, 
  Play,
  Star,
  Sparkles,
  Wand2,
  Copy,
  RefreshCw
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { UpgradeModal, UpgradeBanner } from '@/components/UpgradeModal';

interface Brand {
  id: string;
  name: string;
  industry: string | null;
  description: string | null;
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  budget: string | null;
  startDate: string | null;
}

interface Insight {
  reach: number;
  engagement: number;
  conversions: number;
  roi: string;
  insightsJson: any;
}

const ViralFlow = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [insights, setInsights] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);

  // Auth forms
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandIndustry, setNewBrandIndustry] = useState('');
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignType, setNewCampaignType] = useState('social');
  const [newCampaignBudget, setNewCampaignBudget] = useState('');

  // Upgrade modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('AI generation');
  const [usageData, setUsageData] = useState<any>(null);
  const [aiHooks, setAiHooks] = useState<string[]>([]);
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsLoggedIn(true);
        setView('dashboard');
        fetchBrands();
        fetchUsage();
      }
    };
    checkAuth();
  }, []);

  const fetchBrands = async () => {
    const res = await fetch('/api/brands');
    if (res.ok) {
      const data = await res.json();
      setBrands(data.brands || []);
      if (data.brands && data.brands.length > 0 && !selectedBrand) {
        setSelectedBrand(data.brands[0]);
        fetchCampaigns(data.brands[0].id);
      }
    }
  };

  const fetchCampaigns = async (brandId: string) => {
    const res = await fetch(`/api/campaigns?brandId=${brandId}`);
    if (res.ok) {
      const data = await res.json();
      setCampaigns(data.campaigns || []);
      if (data.campaigns && data.campaigns.length > 0) {
        setSelectedCampaign(data.campaigns[0]);
        fetchInsights(data.campaigns[0].id);
      }
    }
  };

  const fetchInsights = async (campaignId: string) => {
    setLoading(true);
    const res = await fetch(`/api/insights/${campaignId}`);
    if (res.ok) {
      const data = await res.json();
      setInsights(data.insights);
    }
    setLoading(false);
  };

  const fetchUsage = async () => {
    const res = await fetch('/api/usage');
    if (res.ok) {
      const data = await res.json();
      setUsageData(data);
    }
  };

  const generateAIHooksHandler = async () => {
    if (!selectedBrand) return;
    setGeneratingAI(true);
    setAiHooks([]);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'hooks',
          brandName: selectedBrand.name,
          campaignType: selectedCampaign?.type || 'social',
          industry: selectedBrand.industry || 'General',
        }),
      });

      if (res.status === 429) {
        const data = await res.json();
        setUpgradeFeature(data.feature);
        setUsageData({
          usage: { [data.feature]: data.currentUsage },
          limits: { [data.feature]: data.limit },
        });
        setShowUpgradeModal(true);
        toast.error('Limit reached! Upgrade to continue.');
        return;
      }

      if (!res.ok) throw new Error('Failed to generate');

      const data = await res.json();
      setAiHooks(data.data);
      toast.success('AI hooks generated!');
      fetchUsage(); // Refresh usage data
    } catch (error) {
      toast.error('Failed to generate AI hooks');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = authMode === 'login' 
      ? { email, password } 
      : { email, password, name };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok) {
      setUser(data.user);
      setIsLoggedIn(true);
      setView('dashboard');
      toast.success(authMode === 'login' ? 'Welcome back!' : 'Account created successfully!');
      fetchBrands();
    } else {
      toast.error(data.error || 'Something went wrong');
    }
    setLoading(false);
  };

  const createBrand = async () => {
    if (!newBrandName) return toast.error('Brand name is required');

    const res = await fetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newBrandName,
        industry: newBrandIndustry,
        description: 'AI-powered brand ready to dominate social.',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      toast.success('Brand created! AI is now analyzing your competitors...');
      setNewBrandName('');
      setNewBrandIndustry('');
      fetchBrands();
      setSelectedBrand(data.brand);
      fetchCampaigns(data.brand.id);
    } else {
      toast.error('Failed to create brand');
    }
  };

  const createCampaign = async () => {
    if (!selectedBrand || !newCampaignName) {
      return toast.error('Please select a brand and enter campaign name');
    }

    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandId: selectedBrand.id,
        name: newCampaignName,
        type: newCampaignType,
        budget: newCampaignBudget || '2500',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      toast.success('Campaign launched! AI generating viral insights...');
      setNewCampaignName('');
      setNewCampaignBudget('');
      fetchCampaigns(selectedBrand.id);
      setSelectedCampaign(data.campaign);
      fetchInsights(data.campaign.id);
    } else {
      toast.error('Failed to launch campaign');
    }
  };

  const logout = () => {
    document.cookie = 'auth-token=; Max-Age=0';
    setIsLoggedIn(false);
    setUser(null);
    setView('landing');
    setBrands([]);
    setCampaigns([]);
    setSelectedBrand(null);
    setSelectedCampaign(null);
    setInsights(null);
    toast.success('Logged out successfully');
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0 
    }).format(parseFloat(amount));
  };

  const demoBrands = [
    { id: '1', name: 'Lumina Skincare', industry: 'Beauty' },
    { id: '2', name: 'Pulse Coffee', industry: 'Food & Beverage' },
  ];

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
        <Toaster />
        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
          <div className="max-w-screen-2xl mx-auto px-8 flex items-center justify-between h-20">
            <div className="flex items-center gap-x-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-3xl font-semibold tracking-tighter">viralflow</div>
            </div>
            
            <div className="flex items-center gap-x-8 text-sm">
              <a href="#features" className="hover:text-violet-400 transition-colors">Features</a>
              <a href="#how" className="hover:text-violet-400 transition-colors">How it works</a>
              <a href="#pricing" className="hover:text-violet-400 transition-colors">Pricing</a>
              <Button 
                onClick={() => setView('dashboard')} 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10"
              >
                Sign in
              </Button>
              <Button 
                onClick={() => {
                  setAuthMode('register');
                  setView('dashboard');
                }}
                className="bg-white text-black hover:bg-white/90"
              >
                Start free trial
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <div className="pt-32 pb-24 relative">
          <div className="max-w-screen-2xl mx-auto px-8 grid grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-3xl bg-white/5 border border-white/10 text-sm">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                NEW: Viral Score™ AI just dropped
              </div>
              
              <h1 className="text-7xl font-semibold tracking-tighter leading-none">
                Your brand.<br />Viral by design.
              </h1>
              
              <p className="text-2xl text-slate-400 max-w-lg">
                The only AI marketing co-pilot that predicts virality, spies on competitors in realtime, and generates scroll-stopping hooks.
              </p>

              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => {
                    setAuthMode('register');
                    setView('dashboard');
                  }}
                  className="h-14 px-10 text-lg bg-white text-black hover:bg-white/90 flex items-center gap-3 group"
                >
                  Get started free 
                  <ArrowRight className="group-hover:translate-x-1 transition" />
                </Button>
                
                <Button 
                  onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9wgccc', '_blank')}
                  variant="outline" 
                  className="h-14 px-8 border-white/30 hover:bg-white/5 flex items-center gap-3"
                >
                  <Play className="w-4 h-4" /> Watch 87s demo
                </Button>
              </div>

              <div className="flex items-center gap-x-8 text-sm pt-4">
                <div className="flex items-center gap-x-1">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-black bg-gradient-to-br from-pink-400 to-violet-400"></div>
                    ))}
                  </div>
                  <span className="text-slate-400">Trusted by 4,872 marketers</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  ★★★★☆ <span className="text-slate-400 text-xs ml-1">(4.98)</span>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="absolute -inset-20 bg-[radial-gradient(#4f46e510_1px,transparent_1px)] [background-size:28px_28px]"></div>
              
              <div className="glass border border-white/10 rounded-3xl p-2 shadow-2xl relative">
                <div className="bg-zinc-950 rounded-3xl p-8">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <div className="text-emerald-400 text-xs tracking-[2px] font-mono mb-1">LIVE VIRAL SCORE</div>
                      <div className="text-[92px] font-semibold leading-none text-white tracking-tighter -ml-2">94</div>
                      <div className="text-emerald-400 flex items-center gap-1 text-sm">
                        <TrendingUp className="w-4 h-4" /> +31 since yesterday
                      </div>
                    </div>
                    
                    <div className="px-5 py-2 bg-white/5 rounded-2xl text-center">
                      <div className="text-xs text-slate-400">EST. REACH</div>
                      <div className="text-4xl font-semibold mt-1">2.4M</div>
                    </div>
                  </div>
                  
                  <div className="h-80 bg-zinc-900 rounded-2xl relative overflow-hidden flex items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-fuchsia-400 to-cyan-400 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                        <Zap className="w-8 h-8 text-black" />
                      </div>
                      <div className="text-xl font-medium mb-2">AI is generating 14 new hooks</div>
                      <div className="text-slate-400 max-w-[240px]">“The secret sauce is in the first 3 seconds”</div>
                    </div>
                    
                    {/* Fake graph */}
                    <div className="absolute bottom-8 left-8 right-8 h-36 bg-gradient-to-t from-violet-500/10 to-transparent rounded-3xl flex items-end gap-1 px-6 pb-6">
                      {Array.from({ length: 18 }).map((_, i) => (
                        <div 
                          key={i} 
                          className="flex-1 bg-violet-400 rounded-t" 
                          style={{ height: `${25 + Math.random() * 75}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust logos */}
        <div className="border-t border-white/10 py-8">
          <div className="max-w-screen-2xl mx-auto px-8 flex justify-center gap-x-16 opacity-40 text-2xl font-light tracking-widest">
            NIKE • META • GLOSSIER • NOTION • STRIPE
          </div>
        </div>

        {/* Features */}
        <div id="features" className="max-w-screen-2xl mx-auto px-8 py-28 border-t border-white/10">
          <div className="text-center mb-16">
            <div className="uppercase text-xs tracking-[3px] text-violet-400 mb-4">POWERFUL AI TOOLS</div>
            <h2 className="text-6xl font-semibold tracking-tighter">Built for brands that want to <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">go viral</span></h2>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            {[
              {
                icon: <BarChart3 className="w-8 h-8" />,
                title: "Competitor Intelligence",
                desc: "Automatically tracks and decodes every move your top 5 competitors make across platforms.",
                stat: "Real-time sync"
              },
              {
                icon: <Target className="w-8 h-8" />,
                title: "Viral Predictor",
                desc: "Our proprietary model scores your content idea on 27 different virality factors before you post.",
                stat: "94% accuracy"
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: "Hook Studio",
                desc: "Instantly generates 50+ high-engagement first lines, CTAs, and captions tailored to your brand voice.",
                stat: "AI generated"
              },
            ].map((feature, index) => (
              <div key={index} className="group border border-white/10 bg-zinc-950 rounded-3xl p-10 hover:border-violet-500/30 transition-all duration-300">
                <div className="text-violet-400 mb-6">{feature.icon}</div>
                <div className="text-3xl font-semibold tracking-tight mb-4">{feature.title}</div>
                <p className="text-slate-400 leading-relaxed text-[15px]">{feature.desc}</p>
                <div className="mt-12 text-xs font-mono uppercase tracking-widest text-emerald-400 border-l border-emerald-400 pl-3">
                  {feature.stat}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white text-black py-20">
          <div className="max-w-screen-2xl mx-auto px-8 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="inline px-6 py-2.5 text-xs font-semibold tracking-widest border border-black/80 rounded-3xl mb-6">NO CREDIT CARD REQUIRED</div>
              <h2 className="text-6xl font-semibold tracking-tighter mb-6">Start predicting virality today</h2>
              <p className="text-xl text-slate-600 mb-10">Join 4,872 marketers already using ViralFlow to 10x their organic reach.</p>
              
              <Button 
                onClick={() => {
                  setAuthMode('register');
                  setView('dashboard');
                }}
                className="h-16 px-16 text-xl rounded-2xl bg-black text-white hover:bg-zinc-800"
              >
                Claim your free account
              </Button>
              <p className="text-xs text-slate-500 mt-6">14 days of full access. Cancel anytime.</p>
            </div>
          </div>
        </div>
        
        <footer className="bg-black text-white/60 text-xs py-12 border-t border-white/10">
          <div className="max-w-screen-2xl mx-auto px-8 flex justify-between items-center">
            <div>© 2026 ViralFlow, Inc. All rights reserved.</div>
            <div className="flex gap-x-8">
              <a href="#" className="hover:text-white">Twitter</a>
              <a href="#" className="hover:text-white">LinkedIn</a>
              <a href="#" className="hover:text-white">Instagram</a>
            </div>
            <div>Made with 🔥 for brands that move fast</div>
          </div>
        </footer>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Toaster />
      
      {/* Top Nav */}
      <nav className="border-b border-white/10 bg-black/80 backdrop-blur-xl fixed w-full z-50">
        <div className="max-w-screen-2xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-x-10">
            <div className="flex items-center gap-x-3">
              <div className="bg-gradient-to-br from-violet-500 to-fuchsia-500 w-7 h-7 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-semibold text-2xl tracking-tighter">viralflow</span>
            </div>
            
            <div className="flex items-center text-sm gap-x-8 text-slate-400">
              <button onClick={() => setView('dashboard')} className={`hover:text-white transition ${view === 'dashboard' ? 'text-white' : ''}`}>Dashboard</button>
              <button className="hover:text-white transition">Campaigns</button>
              <button className="hover:text-white transition">Competitors</button>
              <button className="hover:text-white transition">Insights</button>
            </div>
          </div>

          <div className="flex items-center gap-x-6">
            {user && (
              <div className="flex items-center gap-x-3 bg-zinc-900 rounded-3xl pl-2 pr-5 py-1 text-sm">
                <div className="bg-white/10 w-8 h-8 rounded-2xl flex items-center justify-center text-xs font-mono">
                  {user.name?.slice(0,1).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="font-medium text-white">{user.name}</div>
                  <div className="text-[10px] text-emerald-400 -mt-0.5">PRO</div>
                </div>
              </div>
            )}
            
            <Button onClick={logout} variant="ghost" className="text-slate-400 hover:text-white">
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-20 flex h-screen">
        {/* Sidebar */}
        <div className="w-72 bg-zinc-900 border-r border-white/10 p-6 flex flex-col">
          <div className="uppercase text-xs tracking-[1px] text-slate-500 mb-4 px-3">YOUR BRANDS</div>
          
          {brands.length > 0 ? (
            <div className="space-y-1 flex-1">
              {brands.map(brand => (
                <button
                  key={brand.id}
                  onClick={() => {
                    setSelectedBrand(brand);
                    fetchCampaigns(brand.id);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-2xl flex items-center gap-x-3 text-sm transition-all ${selectedBrand?.id === brand.id ? 'bg-white text-black' : 'hover:bg-white/5'}`}
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-rose-400 to-orange-400 rounded-xl flex-shrink-0"></div>
                  <div className="truncate font-medium">{brand.name}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-slate-400 text-sm px-3 py-6">No brands yet. Create your first one below.</div>
          )}

          {/* Add brand */}
          <div className="mt-auto pt-8 border-t border-white/10">
            <div className="text-xs uppercase tracking-widest text-slate-400 mb-3">ADD NEW BRAND</div>
            <Input 
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              placeholder="Brand name"
              className="bg-zinc-950 border-white/10 mb-3 placeholder:text-slate-500"
            />
            <Input 
              value={newBrandIndustry}
              onChange={(e) => setNewBrandIndustry(e.target.value)}
              placeholder="Industry (optional)"
              className="bg-zinc-950 border-white/10 mb-3 placeholder:text-slate-500"
            />
            <Button onClick={createBrand} className="w-full bg-white text-black hover:bg-white/90">Create Brand + Analyze Competitors</Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto bg-[#0a0a0a]">
          {!selectedBrand ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-10">
              <div className="text-6xl mb-8">👋</div>
              <h2 className="text-5xl font-semibold tracking-tight mb-4">Welcome to ViralFlow</h2>
              <p className="max-w-md text-slate-400">Create your first brand to unlock AI competitor intelligence, campaign recommendations, and viral hook generation.</p>
              <div className="mt-10 text-xs text-slate-500">Pro tip: Try “Lumina Skincare” or “Neon Energy Drinks” as your first brand</div>
            </div>
          ) : (
            <div className="p-10 max-w-[1200px]">
              <div className="flex justify-between items-end mb-10">
                <div>
                  <div className="flex items-center gap-x-4">
                    <div className="text-6xl">🧴</div>
                    <div>
                      <div className="text-5xl font-semibold tracking-tighter">{selectedBrand.name}</div>
                      <div className="text-emerald-400 flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full bg-current"></div> 
                        AI MONITORING ACTIVE • Updated moments ago
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-slate-400">CURRENT VIRAL POTENTIAL</div>
                  <div className="text-7xl font-semibold text-emerald-400 tracking-tighter">87</div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-6 mb-12">
                {[
                  { label: 'Total Reach', value: '1.8M', change: '+41%', icon: Users },
                  { label: 'Avg. Engagement', value: '14.2%', change: '+9%', icon: TrendingUp },
                  { label: 'Conversions', value: '3,284', change: '+62%', icon: Target },
                  { label: 'Avg. ROI', value: '4.8x', change: '+1.2x', icon: Award },
                ].map((stat, i) => (
                  <div key={i} className="bg-zinc-900 border border-white/5 rounded-3xl p-8">
                    <div className="flex justify-between">
                      <stat.icon className="w-6 h-6 text-violet-400" />
                      <span className="text-emerald-400 text-xs font-medium">{stat.change}</span>
                    </div>
                    <div className="mt-8 text-5xl font-semibold tracking-tighter">{stat.value}</div>
                    <div className="text-xs text-slate-400 mt-1 tracking-wider">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Active Campaigns */}
              <div className="mb-16">
                <div className="flex items-center justify-between mb-6">
                  <div className="font-semibold text-lg flex items-center gap-x-2">
                    <BarChart3 className="text-violet-400" /> Active Campaigns
                  </div>
                  <Button onClick={() => {}} variant="outline" className="text-xs border-white/20">View all campaigns →</Button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {campaigns.length > 0 ? campaigns.map(campaign => (
                    <div 
                      key={campaign.id}
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        fetchInsights(campaign.id);
                      }}
                      className={`p-8 rounded-3xl border transition-all cursor-pointer ${selectedCampaign?.id === campaign.id ? 'border-violet-500 bg-zinc-900/70' : 'border-white/10 hover:border-white/30'}`}
                    >
                      <div className="flex justify-between">
                        <div>
                          <div className="font-semibold text-xl">{campaign.name}</div>
                          <div className="text-xs uppercase tracking-widest text-violet-400 mt-1">{campaign.type.toUpperCase()} • {campaign.status}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400">BUDGET</div>
                          <div className="font-mono text-lg">{formatCurrency(campaign.budget)}</div>
                        </div>
                      </div>
                      
                      {insights && selectedCampaign?.id === campaign.id && (
                        <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-3 gap-4 text-center text-xs">
                          <div>
                            <div className="font-mono text-4xl text-white tracking-tighter">{insights.reach.toLocaleString()}</div>
                            <div className="text-slate-400">REACH</div>
                          </div>
                          <div>
                            <div className="font-mono text-4xl text-white tracking-tighter">{insights.engagement}</div>
                            <div className="text-slate-400">ENGAGEMENTS</div>
                          </div>
                          <div>
                            <div className="font-mono text-4xl text-emerald-400 tracking-tighter">{insights.roi}x</div>
                            <div className="text-slate-400">ROI</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="col-span-2 bg-zinc-900 border border-dashed border-white/20 rounded-3xl p-16 text-center">
                      <div className="mx-auto w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                        <Zap className="w-8 h-8" />
                      </div>
                      <div className="text-xl font-medium mb-2">No campaigns yet</div>
                      <p className="text-slate-400 max-w-xs mx-auto">Launch your first campaign and our AI will immediately begin optimizing for virality.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Create new campaign form */}
              <div className="bg-zinc-900 rounded-3xl p-10 border border-white/5">
                <div className="uppercase text-xs tracking-[2px] text-slate-400 mb-6">LAUNCH NEW CAMPAIGN</div>
                
                <div className="grid grid-cols-12 gap-x-6">
                  <div className="col-span-5">
                    <Input 
                      value={newCampaignName} 
                      onChange={e => setNewCampaignName(e.target.value)}
                      placeholder="Campaign name (ex: Summer Glow Launch)" 
                      className="bg-black border-white/10 h-14 text-lg placeholder:text-slate-500"
                    />
                  </div>
                  <div className="col-span-3">
                    <select 
                      value={newCampaignType} 
                      onChange={(e) => setNewCampaignType(e.target.value)}
                      className="h-14 w-full bg-black border border-white/10 rounded-2xl px-5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-400"
                    >
                      <option value="social">Social Reel Series</option>
                      <option value="email">Email Sequence</option>
                      <option value="ad">Paid Creative Test</option>
                      <option value="influencer">Micro-Influencer</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <Input 
                      type="number" 
                      value={newCampaignBudget} 
                      onChange={e => setNewCampaignBudget(e.target.value)}
                      placeholder="Budget" 
                      className="bg-black border-white/10 h-14 text-lg placeholder:text-slate-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <Button onClick={createCampaign} className="w-full h-14 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-lg">LAUNCH →</Button>
                  </div>
                </div>
                
                <div className="text-[10px] text-slate-500 mt-6 flex items-center gap-2">
                  <div className="px-3 py-1 bg-white/5 rounded">AI will auto-generate 28 captions, 9 CTAs, and competitor gap analysis</div>
                </div>
              </div>

              {/* Usage Banner */}
              {usageData && (
                <div className="mb-6">
                  <UpgradeBanner 
                    feature="AI generations" 
                    currentUsage={usageData.usage?.aiGenerations || 0} 
                    limit={usageData.limits?.aiGenerations || 10} 
                  />
                </div>
              )}

              {/* AI Insights Panel */}
              {insights && (
                <div className="mt-12 border border-white/10 rounded-3xl p-10 bg-zinc-900">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-x-3">
                      <div className="text-amber-400">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="font-semibold text-xl">AI Viral Intelligence Report</div>
                    </div>
                    <Button 
                      onClick={generateAIHooksHandler}
                      disabled={generatingAI}
                      className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white flex items-center gap-2"
                    >
                      {generatingAI ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" /> Generate AI Hooks
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="prose prose-invert max-w-none mb-8">
                    <div className="text-slate-300 text-[15px] leading-relaxed">
                      {insights.insightsJson?.recommendation || 
                       "Your campaign is performing 2.8× better than similar campaigns in the beauty space. The top performing asset is the 9-second hook featuring the before/after transformation. We recommend doubling down on UGC style videos and testing the caption: 'POV: You finally found skincare that actually works'."}
                    </div>
                  </div>

                  {/* AI Generated Hooks */}
                  {aiHooks.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-white/10">
                      <div className="flex items-center gap-2 mb-6">
                        <Zap className="w-5 h-5 text-violet-400" />
                        <div className="font-semibold text-lg">AI-Generated Viral Hooks</div>
                      </div>
                      <div className="grid gap-3">
                        {aiHooks.map((hook, i) => (
                          <div key={i} className="group flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-white/5 hover:border-violet-500/30 transition">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-mono text-violet-400">
                                {i + 1}
                              </div>
                              <div className="text-slate-200">{hook}</div>
                            </div>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(hook);
                                toast.success('Copied to clipboard!');
                              }}
                              className="opacity-0 group-hover:opacity-100 transition p-2 hover:bg-white/5 rounded-xl"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-10 flex gap-4">
                    <Button onClick={generateAIHooksHandler} disabled={generatingAI} className="bg-white text-black flex items-center gap-2">
                      <RefreshCw className={`w-4 h-4 ${generatingAI ? 'animate-spin' : ''}`} /> 
                      {generatingAI ? 'Generating...' : 'Generate more hooks'}
                    </Button>
                    <Button variant="outline" className="border-white/20">Export to Notion</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - Competitor Intelligence */}
        <div className="w-80 border-l border-white/10 bg-zinc-900 p-8 text-sm overflow-auto">
          <div className="uppercase text-xs tracking-widest mb-6 text-slate-400">COMPETITOR RADAR</div>
          
          {selectedBrand ? (
            <>
              <div className="space-y-6">
                {[
                  { name: "GlowLab", followers: "184k", delta: "-12%", score: 62 },
                  { name: "PureAura", followers: "312k", delta: "+4%", score: 81 },
                  { name: "LushBloom", followers: "67k", delta: "+19%", score: 44 },
                ].map((comp, idx) => (
                  <div key={idx} className="bg-black/60 rounded-2xl p-5">
                    <div className="flex justify-between items-center">
                      <div className="font-medium">{comp.name}</div>
                      <div className="text-xs font-mono text-emerald-400">{comp.delta}</div>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{comp.followers} followers</div>
                    
                    <div className="h-2 bg-white/10 rounded mt-6 mb-1 overflow-hidden">
                      <div className="h-2 bg-orange-400 rounded" style={{width: `${comp.score}%`}}></div>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <div>VIRAL INDEX</div>
                      <div className="font-mono">{comp.score}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 text-xs leading-relaxed text-slate-400">
                Our AI is currently tracking <span className="text-white">17</span> different signals from your competitors. The biggest opportunity right now is <span className="line-through opacity-30">static carousels</span> <span className="text-violet-400">short form vertical video with trending audio</span>.
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              Add a brand to see live competitor analysis
            </div>
          )}
        </div>

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature={upgradeFeature}
          currentUsage={usageData?.usage?.[upgradeFeature] || 0}
          limit={usageData?.limits?.[upgradeFeature] || 10}
        />
      </div>
    </div>
  );
};

export default ViralFlow;
