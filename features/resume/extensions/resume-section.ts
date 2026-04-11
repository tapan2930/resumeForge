import { Node, mergeAttributes } from "@tiptap/core";

export type ResumeSectionType =
  | "summary"
  | "work"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "custom"
  | (string & {});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    resumeSection: {
      insertResumeSection: (sectionType: ResumeSectionType) => ReturnType;
    };
  }
}

export const ResumeSection = Node.create({
  name: "resumeSection",
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      sectionType: {
        default: "custom",
        parseHTML: (el) =>
          (el.getAttribute("data-section-type") as ResumeSectionType) ||
          "custom",
        renderHTML: (attrs) => ({
          "data-section-type": attrs.sectionType,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="resume-section"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "resume-section",
        class: "resume-section border-l-2 border-amber-500/40 pl-3 my-4",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      insertResumeSection:
        (sectionType: ResumeSectionType) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { sectionType },
            content: [
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Section" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Start writing…" }],
              },
            ],
          });
        },
    };
  },
});
