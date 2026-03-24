"use client";

import { useState } from "react";
import { Check, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type PricingTier = {
  id: string;
  name: string;
  price: string;
  subtitle: string;
  features: { title: string; desc: string }[];
  priceId: string;
  commitment?: string;
  footer?: string;
  isCustom?: boolean;
  highlight?: boolean;
};

const TIERS: PricingTier[] = [
  {
    id: "core-crm",
    name: "Core CRM",
    price: "$99",
    subtitle:
      "Everything a solo agent needs to manage leads, stay organized, and market effectively — at an exclusive Woodhouse rate. Saves agents 10+ hours per week.",
    priceId: "price_1TEFBbFMnRk4uee2sDep9KIs",
    commitment: "1-year term",
    highlight: true,
    footer:
      "Emails: 2,000 included · $1.50/1,000 after | SMS: Pay-as-you-go · 4¢/SMS | Hosting & Domain: $39 hosting + $25 domain — FREE for one year for Woodhouse agents | Onboarding: CRM setup + weekly one training session included",
    features: [
      {
        title: "Real Estate CRM",
        desc: "Lead management (buyers + sellers), Pipeline tracking, Tasks, reminders & contact database",
      },
      {
        title: "Marketing CRM",
        desc: "Email/SMS drip lead nurture, Website builder (Non-IDX), Calendar sync & email integration",
      },
      {
        title: "Mobile App",
        desc: "On-the-go access & real-time updates, Basic reporting",
      },
    ],
  },
  {
    id: "crm-assistant",
    name: "CRM Assistant",
    price: "$149",
    subtitle:
      "Your own dedicated assistant to handle everything your CRM demands — so you can focus on selling, not admin.",
    priceId: "price_1TEFHvFMnRk4uee2mzj8Rm4k",
    commitment: "1 year commitment",
    features: [
      {
        title: "Lead Handling",
        desc: "Your assistant manages incoming leads so nothing falls through the cracks.",
      },
      {
        title: "Nurture Campaigns",
        desc: "Email and drip campaigns built and launched on your behalf.",
      },
      {
        title: "Reporting and task management",
        desc: "Generate regular reports and ensure all tasks are completed",
      },
    ],
  },
  {
    id: "core-idx",
    name: "Core CRM + IDX",
    price: "$149",
    subtitle:
      "All the power of Core CRM, now with full IDX integration — giving your clients live property search directly on your site. Saves agents 10+ hours per week.",
    priceId: "price_1TEFESFMnRk4uee2rkUgSRHh",
    commitment: "1-year term",
    footer:
      "Emails: 2,000 included · $1.50/1,000 after | SMS: Pay-as-you-go · 4¢/SMS | Hosting & Domain: $39 hosting + $25 domain — FREE for one year for Woodhouse agents | Onboarding: CRM setup + weekly training sessions included",
    features: [
      {
        title: "IDX Integration",
        desc: "Live MLS property search directly on your website",
      },
      {
        title: "Real Estate CRM",
        desc: "Lead management (buyers + sellers), Pipeline tracking, Tasks, reminders & contact database",
      },
      {
        title: "Marketing CRM",
        desc: "Email/SMS drip lead nurture, IDX-enabled website builder, Calendar sync & email integration",
      },
      {
        title: "Mobile App",
        desc: "On-the-go access & real-time updates, Basic reporting",
      },
    ],
  },
  {
    id: "advanced-ai",
    name: "Advanced AI CRM",
    price: "$249",
    subtitle:
      "The complete AI-powered platform that ramps up your real estate business by 3X. Includes everything in Core CRM, plus powerful AI tools to generate content, call leads, and convert faster.",
    priceId: "price_1TEFGLFMnRk4uee2BIxOHNpq",
    commitment: "1-year term",
    footer:
      "Emails: 10,000 included · CAD $1.50/1,000 after | Pay-as-you-go: SMS 4¢/sms, AI Calling $1.2/minute | Hosting & Domain: $39 hosting + $25 domain — FREE for one year for Woodhouse agents",
    features: [
      {
        title: "AI Content Generator",
        desc: "Generate Blogs, Long form and short form content",
      },
      {
        title: "AI Calling Assistant",
        desc: "Cover 1000's of leads faster, Call recordings + Data",
      },
      {
        title: "AI Chat Assistant",
        desc: "Instant follow ups, Chat recordings + Data",
      },
      {
        title: "AI Email Campaigns",
        desc: "Generate emails, Setup automatic Drip campaigns",
      },
      {
        title: "Fabulous IDX Website",
        desc: "IDX Integration, Optimized for Conversions",
      },
      {
        title: "Landing Page Gen",
        desc: "Landing Page generator, Custom Templates",
      },
    ],
  },
  {
    id: "custom-lead",
    name: "Custom Lead Packages",
    price: "$499",
    subtitle:
      "We generate and deliver a fixed number of qualified leads directly to you every month — so you always know what's in your pipeline.",
    priceId: "price_1TEFLwFMnRk4uee277vUIaY0",
    isCustom: true,
    commitment: "Minimum 6-month commitment.",
    footer:
      "Lead volume and package pricing vary by area and property value. Contact us to get a custom quote tailored to your market.",
    features: [
      {
        title: "Fixed Lead Volume",
        desc: "Guaranteed lead count every month — no surprises, no slow months.",
      },
      {
        title: "Market-Specific",
        desc: "Lead volume is tailored to your area, property type, and local competition.",
      },
      {
        title: "Price-Tier Matched",
        desc: "Packages scale based on property value in your target market for maximum ROI.",
      },
      {
        title: "Core CRM Pre-requisite",
        desc: "To be able to run lead campaigns effectively, at least a core CRM subscription is needed.",
      },
    ],
  },
  {
    id: "lead-gen",
    name: "Lead Generation",
    price: "$999",
    subtitle:
      "We run your entire lead generation strategy — customized for your market, listings, and goals. No guessing. No time wasted. Includes everything in Advances AI CRM.",
    priceId: "price_1TEFKdFMnRk4uee2hLpk9G8v",
    commitment: "Minimum 6-month commitment",
    features: [
      { title: "Meta, TikTok & YouTube Ads", desc: "" },
      { title: "Google PPC", desc: "" },
      { title: "Retargeting & Geo-Targeted Campaigns", desc: "" },
      { title: "Landing Page Optimization", desc: "" },
      { title: "ROI Tracking & Event Marketing", desc: "" },
    ],
  },
];

export default function PricingUI() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  async function handleCheckout(priceId: string, id: string) {
    setError("");
    setLoadingId(id);
    try {
      const res = await api("/payment/createCheckoutSession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) {
        throw new Error("Failed to create checkout session");
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("An error occurred during checkout. Please try again.");
      setLoadingId(null);
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-center space-y-1.5 mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Select your plan</h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Choose the perfect plan to accelerate your real estate business.
        </p>
        {error && (
          <p className="text-[11px] font-medium text-destructive mt-1">{error}</p>
        )}
      </div>

      {/* Horizontal scrollable container for plans */}
      <div className="w-full flex overflow-x-auto pb-6 pt-5 snap-x snap-mandatory gap-4 px-4 md:px-8 hide-scrollbar">
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className={`min-w-[260px] max-w-[280px] w-full flex flex-col bg-background rounded-2xl p-4 md:p-5 relative overflow-visible shrink-0 snap-center transition-all ${
              tier.highlight
                ? "border-2 border-primary shadow-[0_8px_30px_rgba(20,184,166,0.15)] ring-2 ring-primary/20 bg-primary/[0.02]"
                : "border border-border/60 shadow-sm hover:border-primary/30"
            }`}
          >
            {tier.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-md z-10 whitespace-nowrap">
                Most Popular
              </div>
            )}
            <div className="mt-2">
              <div className="ml-1 text-[9px] font-bold tracking-wider text-primary uppercase mb-1.5 bg-primary/10 w-fit px-1.5 py-0.5 rounded-sm">
                Agent Plans
              </div>
              <h3 className="text-lg font-bold">{tier.name}</h3>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-2xl font-bold text-primary">
                  {tier.price}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  /month
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed line-clamp-3">
                {tier.subtitle}
              </p>
            </div>

            <div className="flex-1">
              <div className="space-y-2.5 mt-4">
                {tier.features.map((f, i) => (
                  <div key={i} className="flex gap-1.5">
                    <div className="min-w-3.5 mt-0.5">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold block text-foreground/90">
                        {f.title}
                      </span>
                      {f.desc && (
                        <span className="text-muted-foreground text-[10px] leading-snug block mt-0.5">
                          {f.desc}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="bg-primary/5 rounded-lg p-2.5 text-[11px] text-foreground/80 space-y-1 border border-primary/10">
                {tier.commitment && (
                  <div 
                    className="font-semibold flex items-center gap-1 cursor-help group/info hover:text-primary transition-colors"
                    onClick={() => setExpandedId(expandedId === tier.id ? null : tier.id)}
                  >
                    <Info className={`h-3 w-3 transition-transform ${expandedId === tier.id ? "rotate-180 text-primary" : "group-hover/info:scale-110"}`} />
                    {tier.commitment}
                  </div>
                )}
                {tier.footer && expandedId === tier.id && (
                  <div className="text-muted-foreground text-[9px] leading-relaxed mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    {tier.footer}
                  </div>
                )}
              </div>

              <Button
                onClick={() => handleCheckout(tier.priceId, tier.id)}
                disabled={loadingId !== null}
                variant={tier.highlight ? "default" : "outline"}
                className={`w-full h-9 text-xs rounded-xl shadow-sm transition-all ${tier.highlight ? "hover:translate-y-[-1px] hover:shadow-md" : "hover:border-primary/50 hover:bg-primary/5"}`}
              >
                {loadingId === tier.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Select Plan"
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
