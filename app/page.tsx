import { redirect } from "next/navigation";
import {
  Sparkles,
  FileText,
  Download,
  LayoutTemplate,
  Layers,
  ChevronRight,
  Zap,
  Shield,
  Target,
  ArrowRight,
  Star,
  CheckCircle2,
  Wand2,
  Palette,
  ScanSearch,
  Clock,
} from "lucide-react";
import { RegisterLink, LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI-Powered Resume Builder & ATS Scorer",
};

export default async function LandingPage() {
  const { isAuthenticated } = getKindeServerSession();
  if (await isAuthenticated()) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden">

      {/* ─── Navigation ─── */}
      <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-3 sm:py-4 border-b border-border/30 backdrop-blur-xl bg-background/60 sticky top-0 z-50">
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center">
            <Layers className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-sans text-lg font-bold tracking-tight hidden sm:inline">
            ResumeForge
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <LoginLink className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 sm:px-4 py-2 rounded-lg hover:bg-secondary/60">
            Log in
          </LoginLink>
          <RegisterLink className="landing-cta-button inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 sm:px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap">
            <span className="sm:hidden">Start Free</span>
            <span className="hidden sm:inline">Get Started Free</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </RegisterLink>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative min-h-[90vh] flex items-center pt-12 pb-32 overflow-hidden">
        {/* Ambient light effects */}
        <div className="hero-glow hero-glow--primary" />
        <div className="hero-glow hero-glow--secondary" />
        <div className="hero-grid" />

        <div className="container relative z-10 px-6 lg:px-12 mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — Copy */}
            <div className="flex flex-col items-start">
              <div className="landing-badge inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary mb-8 gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                Now with Gemini AI Integration
              </div>

              <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-6">
                Stop writing resumes.
                <br />
                <span className="landing-gradient-text">Start forging careers.</span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg">
                The AI-powered resume editor that scores, tailors, and perfects
                your resume for every role — then exports pixel-perfect PDFs that
                actually pass ATS systems.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-12">
                <RegisterLink className="landing-cta-primary inline-flex h-13 items-center gap-2.5 rounded-xl bg-primary px-8 text-base font-bold text-primary-foreground shadow-xl shadow-primary/30 transition-all hover:shadow-primary/50 hover:scale-[1.03] active:scale-[0.97]">
                  Build Your Resume — Free
                  <ArrowRight className="h-4 w-4" />
                </RegisterLink>
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  No credit card required
                </span>
              </div>

              {/* Quick stats */}
              <div className="flex items-center gap-8 text-sm">
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-foreground">98%</span>
                  <span className="text-muted-foreground">ATS pass rate</span>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-foreground">3 min</span>
                  <span className="text-muted-foreground">Avg. time to tailor</span>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-foreground">9+</span>
                  <span className="text-muted-foreground">Pro templates</span>
                </div>
              </div>
            </div>

            {/* Right — Animated Resume Mockup */}
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="hero-resume-glow" />
              <div className="hero-resume-card">
                {/* Resume header */}
                <div className="mb-5">
                  <div className="h-5 w-40 rounded bg-foreground/90 mb-2" />
                  <div className="h-3 w-56 rounded bg-muted-foreground/40 mb-1" />
                  <div className="h-3 w-48 rounded bg-muted-foreground/30" />
                </div>
                <div className="w-full h-px bg-border/60 mb-4" />

                {/* Experience section */}
                <div className="mb-4">
                  <div className="h-3.5 w-28 rounded bg-primary/70 mb-3" />
                  <div className="space-y-2.5 pl-3 border-l-2 border-primary/30">
                    <div>
                      <div className="h-3 w-44 rounded bg-foreground/60 mb-1.5" />
                      <div className="h-2.5 w-32 rounded bg-muted-foreground/30 mb-1.5" />
                      <div className="space-y-1">
                        <div className="h-2 w-full rounded bg-muted-foreground/20" />
                        <div className="h-2 w-[90%] rounded bg-muted-foreground/20" />
                        <div className="h-2 w-[75%] rounded bg-muted-foreground/20" />
                      </div>
                    </div>
                    <div>
                      <div className="h-3 w-36 rounded bg-foreground/60 mb-1.5" />
                      <div className="h-2.5 w-28 rounded bg-muted-foreground/30 mb-1.5" />
                      <div className="space-y-1">
                        <div className="h-2 w-full rounded bg-muted-foreground/20" />
                        <div className="h-2 w-[85%] rounded bg-muted-foreground/20" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <div className="h-3.5 w-20 rounded bg-primary/70 mb-3" />
                  <div className="flex flex-wrap gap-1.5">
                    {["w-14","w-16","w-12","w-20","w-14","w-18","w-12","w-16"].map((w, i) => (
                      <div key={i} className={`h-5 ${w} rounded-full bg-secondary`} />
                    ))}
                  </div>
                </div>

                {/* Floating ATS Badge */}
                <div className="hero-ats-badge">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Target className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">ATS Score</span>
                      <span className="text-lg font-bold text-emerald-400">92/100</span>
                    </div>
                  </div>
                </div>

                {/* Floating AI Suggestion */}
                <div className="hero-ai-suggestion">
                  <div className="flex items-center gap-2 mb-1">
                    <Wand2 className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary">AI Suggestion</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-snug">
                    &quot;Add quantified metrics to boost impact by 40%&quot;
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Bento Grid ─── */}
      <section className="py-28">
        <div className="container px-6 lg:px-12 mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="landing-badge inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4 gap-2">
              <Zap className="h-3 w-3" />
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything to land the interview.
            </h2>
            <p className="text-muted-foreground text-lg">
              From AI-driven content to pixel-perfect exports — every tool you need, nothing you don&apos;t.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">

            {/* Feature Card — Large */}
            <div className="bento-card lg:col-span-2 lg:row-span-1 flex flex-col sm:flex-row gap-6 items-start">
              <div className="shrink-0 h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/30 to-amber-500/20 flex items-center justify-center border border-primary/20">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">AI-Powered Tailoring</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Paste a job description and let Gemini AI rewrite your bullets with
                  role-specific keywords, quantified impact metrics, and action verbs that
                  ATS systems are scanning for. Your resume adapts to every application.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["ATS Scoring", "Grammar Check", "Job Match", "Bullet Rewriting"].map((tag) => (
                    <span key={tag} className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature Card */}
            <div className="bento-card flex flex-col gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/20 flex items-center justify-center border border-blue-500/20">
                <LayoutTemplate className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold">9+ Pro Templates</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Curated designs from Classic to Executive. Each one ATS-tested and
                recruiter-approved.
              </p>
            </div>

            {/* Feature Card */}
            <div className="bento-card flex flex-col gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/30 to-green-400/20 flex items-center justify-center border border-emerald-500/20">
                <ScanSearch className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold">Live ATS Scoring</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Real-time scoring as you type. See exactly what ATS systems see and
                fix issues before you apply.
              </p>
            </div>

            {/* Feature Card */}
            <div className="bento-card flex flex-col gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-400/20 flex items-center justify-center border border-violet-500/20">
                <Download className="h-6 w-6 text-violet-400" />
              </div>
              <h3 className="text-lg font-bold">Pixel-Perfect PDF</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Chromium-powered rendering. Your resume looks identical on every
                device — guaranteed.
              </p>
            </div>

            {/* Feature Card */}
            <div className="bento-card flex flex-col gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-500/30 to-pink-400/20 flex items-center justify-center border border-rose-500/20">
                <Palette className="h-6 w-6 text-rose-400" />
              </div>
              <h3 className="text-lg font-bold">Full Customization</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Fonts, margins, colors, and spacing. Fine-tune every detail to make
                it unmistakably yours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-28 bg-card/30 border-y border-border/30">
        <div className="container px-6 lg:px-12 mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="landing-badge inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4 gap-2">
              <Clock className="h-3 w-3" />
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Three steps to your best resume.
            </h2>
            <p className="text-muted-foreground text-lg">
              No templates to configure, no formatting headaches. Just results.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Write or paste your content",
                desc: "Start from scratch or import existing content. Our rich-text editor handles the formatting automatically.",
                icon: FileText,
              },
              {
                step: "02",
                title: "Let AI optimize it",
                desc: "Connect your Gemini API key and get instant ATS scoring, grammar fixes, and role-specific tailoring suggestions.",
                icon: Wand2,
              },
              {
                step: "03",
                title: "Export & apply",
                desc: "Download a pixel-perfect PDF that passes every ATS system. Create unlimited versions for different roles.",
                icon: Download,
              },
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="mb-6">
                  <span className="text-6xl font-black text-primary/10 leading-none">
                    {item.step}
                  </span>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 -right-4 text-primary/20">
                    <ArrowRight className="h-6 w-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonial / Quote ─── */}
      <section className="py-28">
        <div className="container px-6 lg:px-12 mx-auto max-w-4xl text-center">
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 text-primary fill-primary" />
            ))}
          </div>
          <blockquote className="text-2xl sm:text-3xl font-semibold tracking-tight leading-snug mb-8">
            &quot;I was spending hours formatting resumes for each application.
            ResumeForge let me tailor to 5 different roles in 15 minutes.
            <span className="landing-gradient-text"> Got callbacks from 3 of them.</span>&quot;
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/40 to-amber-500/40 flex items-center justify-center text-sm font-bold text-primary-foreground">
              S
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Sarah K.</p>
              <p className="text-xs text-muted-foreground">Software Engineer • Hired at FAANG</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/10 to-primary/5" />
        <div className="cta-glow" />

        <div className="container relative z-10 px-6 lg:px-12 mx-auto text-center max-w-3xl">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-6">
            Your next role is one resume away.
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Join job seekers who build, tailor, and export their resumes faster
            with ResumeForge. It&apos;s free to start.
          </p>
          <RegisterLink className="landing-cta-primary inline-flex h-14 items-center gap-2.5 rounded-xl bg-primary px-10 text-lg font-bold text-primary-foreground shadow-2xl shadow-primary/30 transition-all hover:shadow-primary/50 hover:scale-[1.03] active:scale-[0.97]">
            Start Forging — It&apos;s Free
            <ArrowRight className="h-5 w-5" />
          </RegisterLink>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Free forever plan
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Export unlimited PDFs
            </span>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/30 py-10">
        <div className="container px-6 lg:px-12 mx-auto flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center">
              <Layers className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-sans text-sm font-bold tracking-tight text-muted-foreground">
              ResumeForge
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ResumeForge. Crafted for job seekers everywhere.
          </p>
        </div>
      </footer>
    </div>
  );
}
