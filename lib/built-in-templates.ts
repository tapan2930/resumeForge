import type { CustomTemplate, ResumeTemplate } from "./types";
import { resolveFontPreset, RESUME_FONT_PRESETS } from "./resume-fonts";

/**
 * Maps hardcoded PDF styles to the CustomTemplate string format.
 * This allows users to "edit" built-in templates by using them as a starting point.
 */
export function getBuiltInTemplateAsCustom(
  id: ResumeTemplate,
  name?: string
): Omit<CustomTemplate, "id" | "createdAt" | "updatedAt"> {
  // Use default serif preset for consistency
  const fp = resolveFontPreset(undefined);
  const { pdfBody, pdfDisplay } = RESUME_FONT_PRESETS[fp];

  const getHeadingStyle = (level: number) => {
    const font =
      id === "modern" && level === 2
        ? "'Inter',system-ui,sans-serif"
        : level === 1
          ? id === "minimal" || id === "compact"
            ? pdfBody
            : pdfDisplay
          : level === 3 && id === "editorial"
            ? pdfDisplay
            : pdfBody;

    const base = `margin:0;color:#1a1a1a;font-family:${font};`;

    if (id === "minimal") {
      if (level === 1)
        return `${base}font-size:22px;font-weight:400;letter-spacing:-0.02em;border-bottom:1px solid #ddd;padding-bottom:8px;margin-bottom:12px;`;
      if (level === 2)
        return `${base}font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;margin-top:22px;margin-bottom:8px;color:#444;`;
      return `${base}font-size:15px;font-weight:600;margin-top:10px;margin-bottom:4px;`;
    }
    if (id === "classic") {
      if (level === 1)
        return `${base}font-size:28px;font-weight:600;text-align:center;margin-bottom:6px;`;
      if (level === 2)
        return `${base}font-size:12px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #ccc;padding-bottom:4px;margin-top:18px;margin-bottom:8px;`;
      return `${base}font-size:15px;font-weight:600;font-style:italic;margin-top:8px;`;
    }
    if (id === "modern") {
      if (level === 1)
        return `${base}font-size:28px;font-weight:700;margin-bottom:8px;`;
      if (level === 2)
        return `${base}font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.18em;color:#b45309;margin-top:22px;margin-bottom:8px;`;
      return `${base}font-size:15px;font-weight:600;margin-top:8px;`;
    }
    if (id === "executive") {
      if (level === 1)
        return `${base}font-size:24px;font-weight:600;letter-spacing:-0.02em;border-bottom:2px solid #ccc;padding-bottom:10px;margin-bottom:14px;`;
      if (level === 2)
        return `${base}font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.2em;color:#444;margin-top:26px;margin-bottom:8px;`;
      return `${base}font-size:13px;font-weight:600;margin-top:10px;margin-bottom:4px;`;
    }
    if (id === "compact") {
      if (level === 1)
        return `${base}font-size:18px;font-weight:600;letter-spacing:-0.02em;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:8px;`;
      if (level === 2)
        return `${base}font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#555;margin-top:14px;margin-bottom:4px;`;
      return `${base}font-size:12px;font-weight:600;margin-top:6px;margin-bottom:3px;`;
    }
    /* editorial */
    if (level === 1)
      return `${base}font-size:36px;font-weight:700;letter-spacing:-0.03em;line-height:1.05;margin-bottom:22px;`;
    if (level === 2)
      return `${base}font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.28em;color:#92400e;margin-top:32px;margin-bottom:10px;`;
    return `${base}font-size:17px;font-weight:500;font-style:italic;margin-top:6px;margin-bottom:4px;`;
  };

  const getParagraphStyle = () => {
    const compact = id === "compact";
    return `margin:0 0 ${compact ? "6px" : "8px"};font-family:${pdfBody};font-size:${compact ? "11px" : "13px"};line-height:${compact ? "1.35" : "1.55"};color:#222;`;
  };

  const getListStyle = () => {
    const compact = id === "compact";
    return `margin:0 0 12px;padding-left:20px;font-family:${pdfBody};font-size:${compact ? "11px" : "13px"};line-height:${compact ? "1.35" : "1.45"};color:#222;`;
  };

  const getSectionStyle = () => {
    const thick = id !== "minimal" && id !== "compact";
    return id === "compact"
      ? "border-left:1px solid #f59e0b;padding-left:10px;margin-bottom:8px;"
      : thick
        ? "border-left:3px solid #f59e0b;padding-left:12px;margin-bottom:8px;"
        : "margin-bottom:8px;";
  };

  return {
    name: name || `${id.charAt(0).toUpperCase() + id.slice(1)} Custom`,
    nodes: {
      h1: { html: `<h1 style="${getHeadingStyle(1)}">{{content}}</h1>` },
      h2: { html: `<h2 style="${getHeadingStyle(2)}">{{content}}</h2>` },
      h3: { html: `<h3 style="${getHeadingStyle(3)}">{{content}}</h3>` },
      p: { html: `<p style="${getParagraphStyle()}">{{content}}</p>` },
      ul: {
        html: `<ul style="${getListStyle()}list-style-type:disc;">{{content}}</ul>`,
      },
      ol: {
        html: `<ol style="${getListStyle()}list-style-type:decimal;">{{content}}</ol>`,
      },
      li: { html: `<li style="margin-bottom:4px;">{{content}}</li>` },
      hr: {
        html: `<hr style="border:none;border-top:1px solid #ddd;margin:16px 0;" />`,
      },
      section: {
        default: {
          html: `<section style="${getSectionStyle()}">{{content}}</section>`,
        },
        overrides: {},
      } as any,
      page: {
        html: `<div style="background-color:#ffffff; color:#1a1a1a;">{{content}}</div>`,
      },
      overrides: {},
    },
  };
}
