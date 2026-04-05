import type { JSONContent } from "@tiptap/core";

export const emptyDocument: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Your Name" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "City, State · email@example.com · +1 555 000 0000 · linkedin.com/in/you",
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
          content: [{ type: "text", text: "Summary" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Concise overview of your role, strengths, and what you are looking for next.",
            },
          ],
        },
      ],
    },
  ],
};

export const sectionTemplates: Record<
  string,
  { label: string; content: JSONContent }
> = {
  work: {
    label: "Work Experience",
    content: {
      type: "resumeSection",
      attrs: { sectionType: "work" },
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Work Experience" }],
        },
        {
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: "Company — Role" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Jan 2022 – Present · City" }],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Impactful bullet with metrics.",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  education: {
    label: "Education",
    content: {
      type: "resumeSection",
      attrs: { sectionType: "education" },
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Education" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "University — Degree, Field of Study (Year)",
            },
          ],
        },
      ],
    },
  },
  skills: {
    label: "Skills",
    content: {
      type: "resumeSection",
      attrs: { sectionType: "skills" },
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Skills" }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Languages: …  Tools: …  Frameworks: …" },
          ],
        },
      ],
    },
  },
  projects: {
    label: "Projects",
    content: {
      type: "resumeSection",
      attrs: { sectionType: "projects" },
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Projects" }],
        },
        {
          type: "heading",
          attrs: { level: 3 },
          content: [{ type: "text", text: "Project name" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Short description, stack, and outcome.",
            },
          ],
        },
      ],
    },
  },
  certifications: {
    label: "Certifications",
    content: {
      type: "resumeSection",
      attrs: { sectionType: "certifications" },
      content: [
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Certifications" }],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: "Certification — Issuer (Year)" },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
};
