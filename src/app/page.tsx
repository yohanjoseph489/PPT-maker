'use client';

import Link from 'next/link';
import { ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TemplateGallery from '@/components/landing/TemplateGallery';
import FeatureStrip from '@/components/landing/FeatureStrip';

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef1f2] text-foreground">
      <section className="px-3 pt-1.5 sm:px-4 sm:pt-2">
        <div className="relative mx-auto min-h-[95vh] max-w-[1600px] overflow-hidden rounded-[20px] border border-[#d9dddf] bg-[#edf0f1]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.95),rgba(237,240,241,0.88)_45%,rgba(223,228,231,0.85)_100%)]" />
          <div className="absolute inset-0 backdrop-blur-[1px]" />

          <nav className="relative z-20 px-8 pt-4 sm:px-12 sm:pt-5">
            <div className="mx-auto flex max-w-[1200px] items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-b from-[#89c8ae] to-[#69b698] shadow-[0_3px_8px_rgba(69,161,126,0.35)]">
                  <span className="text-sm font-bold text-white">S</span>
                </div>
                <span className="text-[26px] font-semibold leading-none tracking-[-0.02em] text-[#111827] sm:text-[30px]">
                  SyncSlides
                </span>
              </Link>
            </div>
          </nav>

          <div className="pointer-events-none absolute left-[-90px] top-[255px] h-[190px] w-[320px] rotate-[22deg] rounded-[14px] border border-[#99b1c4] bg-gradient-to-br from-[#7d9ebf] via-[#80a8ca] to-[#8dc0d5] opacity-85" />
          <div className="pointer-events-none absolute left-[72px] top-[332px] h-[210px] w-[300px] rotate-[10deg] rounded-[14px] border border-[#b8d3d0] bg-gradient-to-br from-[#afcfe0] via-[#bde4dc] to-[#a8d7be] opacity-85" />
          <div className="pointer-events-none absolute right-[118px] top-[120px] h-[190px] w-[210px] rotate-[23deg] rounded-[14px] border border-[#9db6c6] bg-gradient-to-br from-[#9bb5c9] via-[#8fb0c8] to-[#82a0be] opacity-80" />
          <div className="pointer-events-none absolute right-[206px] top-[157px] h-[190px] w-[210px] rotate-[23deg] rounded-[14px] border border-[#b7cfcd] bg-gradient-to-br from-[#b4cfe0] via-[#a0c6d2] to-[#8ec2ab] opacity-80" />
          <div className="pointer-events-none absolute bottom-[-72px] left-[50%] h-[220px] w-[500px] -translate-x-1/2 rotate-[-17deg] rounded-[16px] border border-[#a7b0bb] bg-gradient-to-tr from-[#9da8b5] via-[#8e98a8] to-[#7f8a9c] opacity-90" />

          <div className="pointer-events-none absolute left-[13%] top-[14%] h-[140px] w-[220px] rounded-full bg-[#d6ece3]/55 blur-3xl" />
          <div className="pointer-events-none absolute right-[8%] top-[10%] h-[160px] w-[240px] rounded-full bg-[#c5d6e6]/50 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[8%] left-[35%] h-[180px] w-[260px] rounded-full bg-[#d6efe4]/45 blur-3xl" />

          <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-[900px] flex-col items-center justify-center px-6 text-center">
            <h1 className="text-[44px] font-semibold leading-[1.04] tracking-[-0.03em] text-[#0f172a] sm:text-[58px] lg:text-[68px]">
              Create polished decks.
              <br />
              At the speed of thought.
            </h1>

            <p className="mt-6 max-w-[720px] text-[16px] leading-[1.45] tracking-[-0.01em] text-[#52525b] sm:text-[18px]">
              Internal AI-powered presentation tool for corporate teams.
              <br />
              Design stunning slides in seconds.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/create">
                <Button
                  size="lg"
                  className="h-12 rounded-full border-0 bg-gradient-to-b from-[#89c8ae] to-[#6cb99c] px-7 text-[14px] font-semibold text-white shadow-[0_10px_26px_rgba(108,185,156,0.42)] hover:opacity-90"
                >
                  Create a Deck
                  <ArrowRight className="ml-2 h-4 w-4 -rotate-45" />
                </Button>
              </Link>

              <a href="#templates">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border border-[#8b9299] bg-transparent px-7 text-[14px] font-semibold text-[#1f2937] hover:bg-[#f4f5f6]"
                >
                  Browse Themes
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <div id="templates">
        <TemplateGallery />
      </div>

      <FeatureStrip />

      <footer className="border-t border-[#0000000a] bg-white px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-800">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#34c759]">
              <span className="text-[10px] font-bold text-white">S</span>
            </div>
            <span>SyncSlides</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>
              Your data stays on your device. API keys are server-side only. No presentations are stored.
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
