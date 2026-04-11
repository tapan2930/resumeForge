"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Layout,
  Type,
  Hash,
  List,
  Square,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/stores/useAppStore";
import type { CustomTemplate, NodeTemplate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppShell } from "@/components/app-shell";
import { ResumePreview } from "@/features/resume/ResumePreview";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { cn } from "@/lib/utils";

const SAMPLE_CONTENT = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "JONATHAN FORGE, PMP" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Austin, TX | 512-555-0199 | j.forge.lead@example.com | linkedin.com/in/jonathanforge | portfolio.dev",
        },
      ],
    },
    {
      type: "resumeSection",
      attrs: { sectionType: "summary" },
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "PROFESSIONAL SUMMARY" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Results-driven Engineering Manager with over 10 years of experience leading cross-functional teams to deliver enterprise-scale SaaS solutions. Expert in cloud-native architecture, agile methodologies, and full-stack modernization. Proven track record of reducing operational costs by 40% and increasing deployment frequency by 300% through DevOps excellence.",
            },
          ],
        },
      ],
    },
    {
      type: "resumeSection",
      attrs: { sectionType: "experience" },
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "PROFESSIONAL EXPERIENCE" }],
        },
        {
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: "Engineering Manager | CloudScale Systems" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "January 2019 – Present" }],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "text",
                  text: "Lead a high-performing organization of 25+ engineers across 3 squads, overseeing a $5M annual budget.",
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "text",
                  text: "Spearheaded the migration from monolithic architecture to AWS microservices, resulting in 99.99% uptime and $1.2M annual savings in infrastructure costs.",
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "text",
                  text: "Implemented automated CI/CD pipelines using GitHub Actions and Terraform, reducing 'time-to-market' for new features from 6 weeks to 2 days.",
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "text",
                  text: "Developed a comprehensive mentoring program that promoted 5 internal engineers to Senior and Staff roles within 18 months.",
                },
              ],
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: "Senior Software Engineer | DataStream Inc." }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "June 2014 – December 2018" }],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "text",
                  text: "Architected a real-time data processing engine handling 500k+ events per second using Apache Kafka and Go.",
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "text",
                  text: "Optimized PostgreSQL query performance, reducing average API response times by 65% for the primary reporting dashboard.",
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "text",
                  text: "Collaborated with Product and Sales teams to define technical roadmaps, contributing to a 25% year-over-year growth in ARR.",
                },
              ],
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: "Software Developer | WebCraft Solutions" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "May 2012 – May 2014" }],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "text",
                  text: "Developed 15+ responsive web applications for Fortune 500 clients using JavaScript, HTML5, and CSS3.",
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "text",
                  text: "Integrated third-party APIs (Stripe, Twilio, SendGrid) to enhance application functionality and user engagement.",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "resumeSection",
      attrs: { sectionType: "skills" },
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "TECHNICAL SKILLS" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Leadership: Agile/Scrum, OKRs, Strategic Planning, Technical Recruitment, Mentorship, Vendor Management.",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Backend & Cloud: Go, Python, Node.js, AWS (EC2, Lambda, RDS), Kubernetes, Docker, Terraform, GraphQL.",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Frontend: React, TypeScript, Next.js, Redux, Tailwind CSS, Webpack, Performance Optimization.",
            },
          ],
        },
      ],
    },
    {
      type: "resumeSection",
      attrs: { sectionType: "education" },
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "EDUCATION & CERTIFICATIONS" }],
        },
        {
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: "M.S. in Computer Science | Georgia Institute of Technology" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "B.S. in Software Engineering | University of Texas at Austin" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "AWS Certified Solutions Architect – Professional | Project Management Professional (PMP)",
            },
          ],
        },
      ],
    },
  ],
};

type NodeType = keyof CustomTemplate["nodes"];

const NODE_LABELS: Record<NodeType, { label: string; icon: any }> = {
  h1: { label: "Heading 1", icon: Hash },
  h2: { label: "Heading 2", icon: Hash },
  h3: { label: "Heading 3", icon: Hash },
  p: { label: "Paragraph", icon: Type },
  ul: { label: "Unordered List", icon: List },
  ol: { label: "Ordered List", icon: List },
  li: { label: "List Item", icon: Type },
  section: { label: "Section Wrapper", icon: Square },
  page: { label: "Outer Page", icon: FileText },
};

export default function TemplateBuilderPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const getTemplateById = useAppStore((s) => s.getTemplateById);
  const updateTemplate = useAppStore((s) => s.updateTemplate);

  const [template, setTemplate] = useState<CustomTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeNode, setActiveNode] = useState<NodeType>("h1");

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const t = await getTemplateById(id);
      if (!t) {
        toast.error("Template not found");
        router.push("/templates");
        return;
      }
      setTemplate(structuredClone(t));
      setLoading(false);
    })();
  }, [id, getTemplateById, router]);

  const onSave = async () => {
    if (!template || !id) return;
    setSaving(true);
    try {
      await updateTemplate(id, template);
      toast.success("Template saved");
    } catch (e) {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const updateNodeHtml = (val: string) => {
    if (!template) return;
    setTemplate((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        nodes: {
          ...prev.nodes,
          [activeNode]: { html: val },
        },
      };
    });
  };

  if (loading || !template) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading builder...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
        <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 bg-card">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="cursor-pointer gap-1"
          >
            <Link href="/templates">
              <ArrowLeft className="h-4 w-4" />
              Templates
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <Input
              variant="ghost"
              className="h-7 w-full max-w-sm px-2 text-sm font-semibold hover:bg-secondary/50 focus:bg-secondary/50"
              value={template.name}
              onChange={(e) =>
                setTemplate((prev) =>
                  prev ? { ...prev, name: e.target.value } : null
                )
              }
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="cursor-pointer gap-2"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Template
          </Button>
        </header>

        <div className="flex-1 min-h-0">
          <PanelGroup direction="horizontal" className="h-full">
            <Panel defaultSize={40} minSize={30} className="flex flex-col bg-card">
              <div className="flex-1 flex min-h-0">
                <div className="w-48 border-r border-border overflow-y-auto">
                  <div className="p-3 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Node Types
                  </div>
                  <nav className="px-2 space-y-1">
                    {(Object.keys(template.nodes) as NodeType[]).map((key) => {
                      const Icon = NODE_LABELS[key].icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setActiveNode(key)}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                            activeNode === key
                              ? "bg-primary text-primary-foreground font-medium"
                              : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {NODE_LABELS[key].label}
                        </button>
                      );
                    })}
                  </nav>
                </div>
                <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">
                      {NODE_LABELS[activeNode].label} HTML
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Use{" "}
                      <code className="bg-secondary px-1 rounded">
                        {"{{content}}"}
                      </code>{" "}
                      to mark where child nodes should be injected.
                    </p>
                  </div>
                  <Textarea
                    className="flex-1 font-mono text-sm leading-relaxed p-4 bg-secondary/30 resize-none focus-visible:ring-1"
                    value={template.nodes[activeNode].html}
                    onChange={(e) => updateNodeHtml(e.target.value)}
                    placeholder="Enter HTML with inline CSS..."
                  />
                  <div className="text-[10px] text-muted-foreground italic">
                    Tip: Use inline styles like <code className="bg-secondary px-1 rounded">style="color: red;"</code> for PDF parity.
                  </div>
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary/40 transition-colors" />

            <Panel defaultSize={60} minSize={40} className="bg-secondary/10 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-border bg-card flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Builder Preview
                </span>
                <div className="text-[10px] text-muted-foreground">
                  Interactive preview using sample content
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4 bg-zinc-100 text-neutral-900">
                <div className="mx-auto shadow-2xl">
                  <ResumePreview
                    content={SAMPLE_CONTENT as any}
                    template="custom"
                    customTemplate={template}
                    highlightNode={activeNode}
                  />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </AppShell>
  );
}
