import { NextResponse } from "next/server";
import type { JSONContent } from "@tiptap/core";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import { buildResumePdfHtml } from "@/lib/render-pdf-html";
import {
  resolveLocalChromeExecutable,
} from "@/lib/resolve-chrome-executable";
import type {
  CustomTemplate,
  LinkSettings,
  MarginSettings,
  PaperSize,
  ResumeFontPreset,
  ResumeTemplate,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  content: JSONContent;
  template: ResumeTemplate | string;
  customTemplate?: CustomTemplate;
  fontPreset?: ResumeFontPreset | null;
  margins?: MarginSettings;
  linkSettings?: LinkSettings;
  paperSize: PaperSize;
  includeHeader: boolean;
  includePageNumbers: boolean;
  includeSectionDividers: boolean;
  avoidSectionBreaks: boolean;
  headerName?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.content || !body?.template) {
    return NextResponse.json({ error: "Missing content or template" }, { status: 400 });
  }

  const html = buildResumePdfHtml({
    content: body.content,
    template: body.template,
    customTemplate: body.customTemplate,
    fontPreset: body.fontPreset,
    margins: body.margins,
    linkSettings: body.linkSettings,
    paperSize: body.paperSize ?? "letter",
    includeHeader: body.includeHeader ?? true,
    includeSectionDividers: body.includeSectionDividers ?? true,
    avoidSectionBreaks: body.avoidSectionBreaks ?? false,
    headerName: body.headerName,
  });

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  try {
    const isVercel = !!process.env.VERCEL_ENV;
    const chromeOverride = process.env.CHROME_EXECUTABLE_PATH?.trim();

    if (chromeOverride) {
      // Explicit override from env
      browser = await puppeteer.launch({
        executablePath: chromeOverride,
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--font-render-hinting=none",
        ],
        defaultViewport: { width: 1920, height: 1080 },
      });
    } else if (isVercel) {
      // Preferred path for Vercel/Serverless


      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1920, height: 1080 },
        executablePath: await chromium.executablePath(
          process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/chromium-pack.tar`
            : "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar"
        ),
        headless: true,
      });
    } else {
      // Local development (macOS/Windows)
      const localChrome = resolveLocalChromeExecutable();
      if (!localChrome) {
        return NextResponse.json(
          {
            error:
              "PDF needs a Chromium-based browser. Install Google Chrome or Brave " +
              "(e.g. macOS: Brave in /Applications/Brave Browser.app) or set " +
              "CHROME_EXECUTABLE_PATH to the browser binary.",
          },
          { status: 503 }
        );
      }
      browser = await puppeteer.launch({
        executablePath: localChrome,
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--font-render-hinting=none",
        ],
        defaultViewport: { width: 1920, height: 1080 },
      });
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 45_000 });

    const pdf = await page.pdf({
      format: body.paperSize === "a4" ? "A4" : "Letter",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: body.includePageNumbers,
      headerTemplate: "<span></span>",
      footerTemplate: body.includePageNumbers
        ? `<div style="width:100%;font-size:9px;text-align:center;font-family:system-ui,sans-serif;color:#888;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>`
        : "<span></span>",
      margin: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="resume.pdf"',
      },
    });
  } catch (e) {
    if (browser) await browser.close().catch(() => { });
    const message = e instanceof Error ? e.message : "PDF generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
