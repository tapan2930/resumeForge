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
  Plus,
  X,
  Wand2,
  Search,
  Minus,
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
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { JSONContent } from "@tiptap/core";
import { ScrollArea } from "@/components/ui/scroll-area";

const PRISM_THEME = `
  code[class*="language-"],
  pre[class*="language-"] {
    color: #ccc;
    background: none;
    font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
    font-size: 1em;
    text-align: left;
    white-space: pre-wrap;
    word-spacing: normal;
    word-break: normal;
    word-wrap: normal;
    line-height: 1.5;
    tab-size: 4;
    hyphens: none;
  }
  .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #999; }
  .token.punctuation { color: #ccc; }
  .token.tag, .token.attr-name, .token.namespace, .token.deleted { color: #e2777a; }
  .token.function-name { color: #6196cc; }
  .token.boolean, .token.number, .token.function { color: #f08d49; }
  .token.property, .token.class-name, .token.constant, .token.symbol { color: #f8c555; }
  .token.selector, .token.important, .token.atrule, .token.keyword, .token.builtin { color: #cc99cd; }
  .token.string, .token.char, .token.attr-value, .token.regex, .token.variable { color: #7ec699; }
  .token.operator, .token.entity, .token.url { color: #67cdcc; }
  .token.important, .token.bold { font-weight: bold; }
  .token.italic { font-style: italic; }
  .token.entity { cursor: help; }
  .token.inserted { color: green; }
  .token.placeholder { color: #f59e0b; font-weight: bold; }
`;

if (languages.markup) {
  (languages.markup as any).placeholder = /\{\{content\}\}/;
}

const COMMON_CSS_PROPS = [
  "color", "background-color", "font-size", "font-weight", "font-family",
  "margin", "margin-top", "margin-bottom", "margin-left", "margin-right",
  "padding", "padding-top", "padding-bottom", "padding-left", "padding-right",
  "border", "border-bottom", "border-top", "border-left", "border-right",
  "border-radius", "display", "flex", "flex-direction", "justify-content",
  "align-items", "gap", "width", "height", "text-align", "text-transform",
  "letter-spacing", "line-height", "opacity", "box-shadow", "overflow"
].sort();

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
      attrs: { customType: "contact-bar" },
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
              text: "Results-driven Engineering Manager with over 10 years of experience leading cross-functional teams to deliver enterprise-scale SaaS solutions. Expert in cloud-native architecture, agile methodologies, and full-stack modernization. Proven track record of reducing operational costs by 40% and increasing deployment frequency by 300% through DevOps excellence. Adept at navigating complex technical challenges while fostering a culture of innovation and continuous improvement.",
            },
          ],
        },
      ],
    },
    { type: "horizontalRule" },
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
          attrs: { level: 3, customType: "subheader" },
          content: [
            { type: "text", text: "Engineering Manager | CloudScale Systems" },
          ],
        },
        {
          type: "paragraph",
          attrs: { customType: "date-location" },
          content: [{ type: "text", text: "January 2019 – Present | Austin, TX" }],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "text",
                  text: "Lead a high-performing organization of 25+ engineers across 3 squads, overseeing a $5M annual budget and driving technical roadmap strategy.",
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
                  text: "Developed a comprehensive mentoring program that promoted 5 internal engineers to Senior and Staff roles within 18 months, reducing turnover by 15%.",
                },
              ],
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 3, customType: "subheader" },
          content: [
            { type: "text", text: "Senior Software Engineer | DataStream Inc." },
          ],
        },
        {
          type: "paragraph",
          attrs: { customType: "date-location" },
          content: [
            { type: "text", text: "June 2014 – December 2018 | San Francisco, CA" },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "text",
                  text: "Architected a real-time data processing engine handling 500k+ events per second using Apache Kafka and Go, supporting critical business analytics.",
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "text",
                  text: "Optimized PostgreSQL query performance through advanced indexing and partitioning, reducing average API response times by 65%.",
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "text",
                  text: "Collaborated with Product and Sales teams to define technical roadmaps for 3 new product lines, contributing to a 25% year-over-year growth in ARR.",
                },
              ],
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 3, customType: "subheader" },
          content: [
            { type: "text", text: "Software Developer | WebCraft Solutions" },
          ],
        },
        {
          type: "paragraph",
          attrs: { customType: "date-location" },
          content: [{ type: "text", text: "May 2012 – May 2014 | Seattle, WA" }],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "text",
                  text: "Developed 15+ responsive web applications for Fortune 500 clients using JavaScript, HTML5, and CSS3, ensuring accessibility compliance.",
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "text",
                  text: "Integrated third-party APIs (Stripe, Twilio, SendGrid) to enhance application functionality, increasing user engagement by 20%.",
                },
              ],
            },
          ],
        },
      ],
    },
    { type: "horizontalRule" },
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
          type: "bulletList",
          attrs: { customType: "skills-grid" },
          content: [
            {
              type: "listItem",
              content: [{ type: "text", text: "Languages: Go, Python, TypeScript, SQL, Java" }],
            },
            {
              type: "listItem",
              content: [{ type: "text", text: "Cloud: AWS (EC2, Lambda, RDS, S3), Docker, Kubernetes, Terraform" }],
            },
            {
              type: "listItem",
              content: [{ type: "text", text: "Frontend: React, Next.js, Redux, Tailwind CSS, Webpack" }],
            },
            {
              type: "listItem",
              content: [{ type: "text", text: "Tools: Git, Jenkins, Jira, Grafana, Prometheus" }],
            },
          ],
        },
      ],
    },
    { type: "horizontalRule" },
    {
      type: "resumeSection",
      attrs: { sectionType: "achievements" },
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "KEY ACHIEVEMENTS" }],
        },
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "text",
                  text: "Won 'Innovation Award' at CloudScale Systems for developing an internal developer portal.",
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "text",
                  text: "Published 3 technical articles on cloud-native patterns with 50k+ total reads.",
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "text",
                  text: "Keynote speaker at Austin Tech Conference 2022 on the topic of Scaling Engineering Organizations.",
                },
              ],
            },
          ],
        },
      ],
    },
    { type: "horizontalRule" },
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
          attrs: { level: 3, customType: "subheader" },
          content: [
            {
              type: "text",
              text: "M.S. in Computer Science | Georgia Institute of Technology",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "B.S. in Software Engineering | University of Texas at Austin",
            },
          ],
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

const BASE_NODES = ["h1", "h2", "h3", "p", "ul", "ol", "li", "hr", "page"];

const NODE_LABELS: Record<string, { label: string; icon: any }> = {
  h1: { label: "Heading 1", icon: Hash },
  h2: { label: "Heading 2", icon: Hash },
  h3: { label: "Heading 3", icon: Hash },
  p: { label: "Paragraph", icon: Type },
  ul: { label: "Unordered List", icon: List },
  ol: { label: "Ordered List", icon: List },
  li: { label: "List Item", icon: Type },
  hr: { label: "Horizontal Line", icon: Minus },
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
  const [activeNode, setActiveNode] = useState<string>("h1");

  const [sampleContent, setSampleContent] = useState<JSONContent>(
    structuredClone(SAMPLE_CONTENT) as any
  );
  const [overrideOpen, setOverrideOpen] = useState<string | null>(null);
  const [newOverrideType, setNewOverrideType] = useState("");
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [cssSearch, setCssSearch] = useState("");

  const onNodeClick = useCallback((type: string, path: string) => {
    if (path === "root") {
      setActiveNode("page");
      return;
    }
    let baseType = type;
    if (type.startsWith("section:")) baseType = "section";
    else if (type.includes(":")) baseType = type.split(":")[0];

    setOverrideOpen(baseType);
    setTargetPath(path);
  }, []);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const t = await getTemplateById(id);
      if (!t) {
        toast.error("Template not found");
        router.push("/templates");
        return;
      }
      const normalized = structuredClone(t);
      if (normalized.nodes.section && !("default" in normalized.nodes.section)) {
        const legacyHtml = (normalized.nodes.section as any).html || "";
        (normalized.nodes as any).section = {
          default: { html: legacyHtml },
          overrides: {},
        };
      }
      if (!normalized.nodes.overrides) {
        normalized.nodes.overrides = {};
      }
      if (!normalized.nodes.hr) {
        normalized.nodes.hr = {
          html: '<hr style="border:none; border-top:1px solid #ddd; margin:16px 0;" />',
        };
      }
      setTemplate(normalized);
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

  const getActiveHtml = useCallback(() => {
    if (!template) return "";
    if (activeNode === "section")
      return (template.nodes.section as any)?.default?.html || "";
    if (activeNode.includes(":")) {
      return template.nodes.overrides[activeNode]?.html || "";
    }
    // @ts-ignore
    return template.nodes[activeNode]?.html ?? "";
  }, [template, activeNode]);

  const updateActiveHtml = useCallback(
    (val: string) => {
      if (!template) return;
      setTemplate((prev) => {
        if (!prev) return null;
        const next = { ...prev };
        if (activeNode === "section") {
          (next.nodes as any).section.default.html = val;
        } else if (activeNode.includes(":")) {
          next.nodes.overrides[activeNode] = { html: val };
        } else {
          // @ts-ignore
          next.nodes[activeNode] = { html: val };
        }
        return next;
      });
    },
    [activeNode, template]
  );

  const getFormattedHtml = useCallback((raw: string) => {
    if (!raw) return "";
    let formatted = raw;
    formatted = formatted.replace(/>\s*</g, ">\n<");

    const styleRegex = /style=(["'])([\s\S]*?)\1/g;
    formatted = formatted.replace(styleRegex, (match, quote, styleContent) => {
      const props = styleContent
        .split(";")
        .map((p: string) => {
          const part = p.trim();
          if (!part) return "";
          const colonIndex = part.indexOf(":");
          if (colonIndex === -1) return part;
          const prop = part.slice(0, colonIndex).trim();
          const val = part.slice(colonIndex + 1).trim();
          return `${prop}: ${val}`;
        })
        .filter(Boolean);

      if (props.length === 0) return `style=${quote}${quote}`;
      return `style=${quote}\n  ${props.join(";\n  ")};\n${quote}`;
    });

    formatted = formatted.replace(
      />\s*\{\{content\}\}\s*</g,
      ">\n  {{content}}\n<"
    );
    return formatted.trim();
  }, []);

  const formatCode = useCallback(() => {
    const raw = getActiveHtml();
    if (!raw) return;
    updateActiveHtml(getFormattedHtml(raw));
  }, [getActiveHtml, getFormattedHtml, updateActiveHtml]);

  // 1. Instant format when switching nodes
  useEffect(() => {
    const raw = getActiveHtml();
    if (!raw) return;
    const formatted = getFormattedHtml(raw);
    if (formatted !== raw) {
      updateActiveHtml(formatted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNode]);

  // 2. Auto-format on edit stop (2s debounce)
  useEffect(() => {
    const raw = getActiveHtml();
    if (!raw) return;

    const timer = setTimeout(() => {
      const formatted = getFormattedHtml(raw);
      if (formatted !== raw) {
        updateActiveHtml(formatted);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [template, activeNode, getFormattedHtml, getActiveHtml, updateActiveHtml]); // template dependency handles typing

  const onAddOverride = () => {
    const identifier = newOverrideType.trim().toLowerCase();
    if (!identifier || !template || !overrideOpen) return;
    const key = `${overrideOpen}:${identifier}`;
    if (template.nodes.overrides[key]) {
      toast.error("Override already exists");
      return;
    }
    setTemplate((prev) => {
      if (!prev) return null;
      const next = { ...prev };
      const baseHtml =
        overrideOpen === "section"
          ? (next.nodes as any).section.default.html
          : (next.nodes as any)[overrideOpen].html;

      next.nodes.overrides[key] = { html: baseHtml };
      return next;
    });

    setSampleContent((prev) => {
      const next = structuredClone(prev);
      let applied = false;
      if (targetPath) {
        const parts = targetPath.split(".").map(Number);
        let curr = next;
        for (let i = 0; i < parts.length; i++) {
          if (!curr.content?.[parts[i]]) break;
          if (i === parts.length - 1) {
            curr.content[parts[i]].attrs = {
              ...curr.content[parts[i]].attrs,
              customType: identifier,
            };
            applied = true;
          } else {
            curr = curr.content[parts[i]];
          }
        }
      }
      if (!applied) {
        const findAndTag = (node: JSONContent) => {
          if (applied) return;
          const baseType = overrideOpen === "section" ? "resumeSection" : overrideOpen;
          const nodeType = node.type === "heading" ? `h${node.attrs?.level}` : node.type;
          if (nodeType === baseType) {
            node.attrs = { ...node.attrs, customType: identifier };
            applied = true;
            return;
          }
          node.content?.forEach(findAndTag);
        };
        findAndTag(next);
      }
      return next;
    });

    setActiveNode(key);
    setOverrideOpen(null);
    setTargetPath(null);
    setNewOverrideType("");
  };

  const onRemoveOverride = (key: string) => {
    if (!template) return;
    setTemplate((prev) => {
      if (!prev) return null;
      const next = { ...prev };
      delete next.nodes.overrides[key];
      return next;
    });
    if (activeNode === key) {
      setActiveNode(key.split(":")[0]);
    }
  };

  const insertCssProp = (prop: string) => {
    const current = getActiveHtml();
    // Match the first opening tag, handling potential newlines
    const tagMatch = current.match(/<([a-z1-6]+)([\s\S]*?)>/i);
    if (!tagMatch) return;

    const fullTag = tagMatch[0];
    const tagName = tagMatch[1];
    const attrs = tagMatch[2];

    // Check for existing style attribute (double or single quotes, multiline)
    const styleMatch = attrs.match(/style=(["'])([\s\S]*?)\1/i);

    let nextHtml = "";
    if (styleMatch) {
      const quote = styleMatch[1];
      const styleContent = styleMatch[2];

      // If property already exists, don't add it again
      if (new RegExp(`\\b${prop}\\s*:`).test(styleContent)) {
        toast.info(`${prop} already exists`);
        return;
      }

      // Prepend to existing style
      const newAttrs = attrs.replace(
        styleMatch[0],
        `style=${quote}${prop}: ; ${styleContent}${quote}`
      );
      nextHtml = current.replace(fullTag, `<${tagName}${newAttrs}>`);
    } else {
      // Create new style attribute
      const newTag = `<${tagName}${attrs} style="${prop}: ;">`;
      nextHtml = current.replace(fullTag, newTag);
    }

    if (nextHtml) {
      updateActiveHtml(getFormattedHtml(nextHtml));
    }
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

  const filteredProps = COMMON_CSS_PROPS.filter(p => p.includes(cssSearch.toLowerCase()));

  return (
    <AppShell>
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden text-foreground">
        <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 bg-card">
          <Button asChild variant="ghost" size="sm" className="cursor-pointer gap-1">
            <Link href="/templates"><ArrowLeft className="h-4 w-4" />Templates</Link>
          </Button>
          <div className="min-w-0 flex-1">
            <Input
              className="h-7 w-full max-w-sm px-2 text-sm font-semibold border-none bg-transparent hover:bg-secondary/50 focus:bg-secondary/50 focus-visible:ring-0"
              value={template.name}
              onChange={(e) =>
                setTemplate((prev) =>
                  prev ? { ...prev, name: e.target.value } : null
                )
              }
            />
          </div>
          <Button type="button" size="sm" className="cursor-pointer gap-2" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Template
          </Button>
        </header>

        <div className="flex-1 min-h-0">
          <PanelGroup direction="horizontal" className="h-full">
            <Panel defaultSize={45} minSize={30} className="flex flex-col bg-card border-r border-border">
              <div className="flex-1 flex min-h-0">
                <div className="w-52 border-r border-border overflow-y-auto">
                  <div className="p-3 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Structure</div>
                  <nav className="px-2 space-y-4">
                    <div>
                      <div className="mb-1 px-3 text-[9px] uppercase font-bold text-muted-foreground/60 tracking-widest">Base Nodes</div>
                      <div className="space-y-0.5">
                        {[...BASE_NODES, "section"].map((key) => {
                          const Icon = NODE_LABELS[key].icon;
                          return (
                            <div key={key} className="space-y-0.5">
                              <div className="group flex items-center">
                                <button
                                  onClick={() => setActiveNode(key)}
                                  className={cn(
                                    "flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors text-left",
                                    activeNode === key ? "bg-primary text-primary-foreground font-medium" : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  <Icon className="h-3.5 w-3.5 shrink-0" />
                                  <span className="truncate">{NODE_LABELS[key].label}</span>
                                </button>
                                {key !== "page" && (
                                  <button onClick={() => setOverrideOpen(key)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-primary transition-all">
                                    <Plus className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                              {Object.keys(template.nodes.overrides || {}).filter((k) => k.startsWith(`${key}:`)).map((overrideKey) => (
                                <div key={overrideKey} className="group relative flex items-center pl-4">
                                  <button
                                    onClick={() => setActiveNode(overrideKey)}
                                    className={cn(
                                      "flex-1 flex items-center gap-2 px-3 py-1 rounded-md text-xs transition-colors text-left pr-8",
                                      activeNode === overrideKey ? "bg-primary/20 text-primary font-medium" : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                                    )}
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                    <span className="truncate">Tag: {overrideKey.split(":")[1]}</span>
                                  </button>
                                  <button onClick={() => onRemoveOverride(overrideKey)} className="absolute right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </nav>
                </div>
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  <PanelGroup direction="vertical">
                    <Panel defaultSize={65} minSize={30} className="flex flex-col">
                      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                              {activeNode.includes(":") ? (
                                <>
                                  <span className="text-muted-foreground capitalize">
                                    {NODE_LABELS[activeNode.split(":")[0]]
                                      ?.label || activeNode.split(":")[0]}
                                  </span>
                                  <span className="text-xs">→</span>
                                  <span className="text-primary font-mono text-xs bg-primary/10 px-1.5 py-0.5 rounded">
                                    {activeNode.split(":")[1]}
                                  </span>
                                </>
                              ) : (
                                NODE_LABELS[activeNode]?.label || activeNode
                              )}{" "}
                              HTML
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Use{" "}
                              <code className="bg-secondary px-1 rounded">
                                {"{{content}}"}
                              </code>{" "}
                              to inject children.
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 text-xs cursor-pointer"
                            onClick={formatCode}
                          >
                            <Wand2 className="h-3.5 w-3.5" />
                            Format
                          </Button>
                        </div>
                        <div className="flex-1 flex flex-col overflow-hidden rounded-md border border-border bg-secondary/30">
                          <ScrollArea className="flex-1">
                            <style
                              dangerouslySetInnerHTML={{ __html: PRISM_THEME }}
                            />
                            <Editor
                              value={getActiveHtml()}
                              onValueChange={(code) => updateActiveHtml(code)}
                              highlight={(code) =>
                                highlight(code, languages.markup, "markup")
                              }
                              padding={20}
                              className="font-mono text-sm min-h-full"
                              style={{
                                fontFamily:
                                  '"Fira code", "Fira Mono", monospace',
                                whiteSpace: "pre-wrap",
                              }}
                            />
                          </ScrollArea>
                        </div>
                        <div className="text-[10px] text-muted-foreground italic">
                          Tip: Use inline styles like{" "}
                          <code className="bg-secondary px-1 rounded">
                            style=&quot;color: red;&quot;
                          </code>{" "}
                          for PDF parity.
                        </div>
                      </div>
                    </Panel>

                    <PanelResizeHandle className="h-1.5 bg-border hover:bg-primary/40 transition-colors" />

                    <Panel defaultSize={35} minSize={20} className="flex flex-col">
                      <div className="flex-1 border-t border-border bg-background p-4 flex flex-col gap-2 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                            CSS Suggestions
                          </Label>
                          <div className="relative w-32">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input
                              className="h-6 pl-7 text-[10px]"
                              placeholder="Search props..."
                              value={cssSearch}
                              onChange={(e) => setCssSearch(e.target.value)}
                            />
                          </div>
                        </div>
                        <ScrollArea className="flex-1">
                          <div className="flex flex-wrap gap-1.5">
                            {filteredProps.map((prop) => (
                              <Button
                                key={prop}
                                variant="secondary"
                                size="sm"
                                className="h-6 px-2 text-[10px] cursor-pointer hover:bg-primary hover:text-primary-foreground"
                                onClick={() => insertCssProp(prop)}
                              >
                                {prop}
                              </Button>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </Panel>
                  </PanelGroup>
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary/40 transition-colors" />

            <Panel defaultSize={55} minSize={40} className="bg-secondary/10 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-border bg-card flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Builder Preview</span>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => setSampleContent(structuredClone(SAMPLE_CONTENT) as any)}>
                  Reset Sample
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-4 bg-zinc-100/50 text-neutral-900">
                <div className="mx-auto shadow-2xl">
                  <ResumePreview
                    content={sampleContent}
                    template="custom"
                    customTemplate={template}
                    highlightNode={activeNode}
                    onNodeClick={onNodeClick}
                  />
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </div>

      <Dialog open={!!overrideOpen} onOpenChange={(o) => !o && setOverrideOpen(null)}>
        <DialogContent className="sm:max-w-md text-foreground">
          <DialogHeader>
            <DialogTitle>Add {NODE_LABELS[overrideOpen || ""]?.label} Override</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="override-type">Style Tag Identifier</Label>
            <Input id="override-type" placeholder="e.g., contact-bar, skills-grid, subheader" value={newOverrideType} onChange={(e) => setNewOverrideType(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onAddOverride()} />
            <p className="text-[10px] text-muted-foreground">
              This must match the &quot;Style Type&quot; you set in the Resume
              Editor.
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOverrideOpen(null)}>Cancel</Button>
            <Button onClick={onAddOverride}>Add Override</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
