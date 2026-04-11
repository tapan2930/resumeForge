import { NextResponse } from "next/server";
import type { JSONContent } from "@tiptap/core";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { buildResumePdfHtml } from "@/lib/render-pdf-html";
import {
  resolveLocalChromeExecutable,
  shouldUseSparticuzChromium,
} from "@/lib/resolve-chrome-executable";
import type {
  MarginSettings,
  PaperSize,
  ResumeFontPreset,
  ResumeTemplate,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  content: JSONContent;
  template: ResumeTemplate;
  fontPreset?: ResumeFontPreset | null;
  margins?: MarginSettings;
  linkSettings?: LinkSettings;
  paperSize: PaperSize;
  includeHeader: boolean;
  includePageNumbers: boolean;
  includeSectionDividers: boolean;
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
    fontPreset: body.fontPreset,
    margins: body.margins,
    linkSettings: body.linkSettings,
    paperSize: body.paperSize ?? "letter",
    includeHeader: body.includeHeader ?? true,
    includeSectionDividers: body.includeSectionDividers ?? true,
    headerName: body.headerName,
  });

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
  try {
    const localArgs = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--font-render-hinting=none",
    ];

    const localChrome = resolveLocalChromeExecutable();

    if (localChrome) {
      browser = await puppeteer.launch({
        executablePath: localChrome,
        headless: true,
        args: localArgs,
        defaultViewport: chromium.defaultViewport,
      });
    } else if (shouldUseSparticuzChromium()) {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    } else {
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
    if (browser) await browser.close().catch(() => {});
    const message = e instanceof Error ? e.message : "PDF generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
