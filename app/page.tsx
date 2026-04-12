import Link from "next/link";
import { redirect } from "next/navigation";
import { MoveRight, Sparkles, FileText, Download, LayoutTemplate, Layers } from "lucide-react";
import { RegisterLink, LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export default async function LandingPage() {
  const { isAuthenticated } = getKindeServerSession();
  if (await isAuthenticated()) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Layers className="h-6 w-6 text-primary" />
          <span className="font-sans text-lg font-semibold uppercase tracking-widest">
            ResumeForge
          </span>
        </div>
        <div className="flex items-center gap-4">
          <LoginLink className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200">
            Login
          </LoginLink>
          <RegisterLink className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
            Start Foraging
          </RegisterLink>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
        <div className="absolute left-0 top-0 w-full h-[50rem] bg-primary/10 blur-[100px] rounded-full -translate-y-1/2 pointer-events-none" />

        <div className="container relative z-10 px-6 mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Sparkles className="h-4 w-4 mr-2" />
            AI-Powered Resume Building
          </div>
          
          <h1 className="max-w-4xl font-display text-5xl font-bold tracking-tight sm:text-7xl mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both">
            Forge your perfect{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-500">
              resume with AI.
            </span>
          </h1>
          
          <p className="max-w-2xl text-lg text-muted-foreground mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
            Stand out from the crowd with context-aware AI suggestions, beautiful modern templates, and ATS-optimized PDF exports. Manage all your career versions in one secure place.
          </p>
          
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-both">
            <RegisterLink className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-transform hover:bg-primary/90 hover:scale-105 active:scale-95">
              Build your resume
              <MoveRight className="h-4 w-4" />
            </RegisterLink>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24 bg-card/50 border-t border-border/40">
        <div className="container px-6 mx-auto">
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to land the interview.</h2>
            <p className="text-muted-foreground">Crafted with precision for modern job seekers. We handle the formatting and analysis, so you can focus on the content.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="group relative rounded-2xl border border-border bg-card p-8 transition-colors hover:bg-secondary/40">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <LayoutTemplate className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">Premium Templates</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Choose from a curated collection of professional templates across various industries. With easy margin and font adjustments to ensure the perfect fit.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative rounded-2xl border border-border bg-card p-8 transition-colors hover:bg-secondary/40">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">AI Tailoring</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connect your Gemini API key to get instant ATS scoring, grammar checks, and job match analysis. Optimize your bullets for the exact role you want.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative rounded-2xl border border-border bg-card p-8 transition-colors hover:bg-secondary/40">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-500">
                <Download className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold">Pixel-Perfect Export</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Generate high-quality, ATS-friendly PDFs with precise margin control and embedded styling. Ensuring your resume looks identical on every device.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container px-6 mx-auto flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <span className="font-sans text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              ResumeForge
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ResumeForge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
