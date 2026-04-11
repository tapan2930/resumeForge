import { Extension } from "@tiptap/core";

export const CustomNodeAttributes = Extension.create({
  name: "customNodeAttributes",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading", "bulletList", "orderedList", "resumeSection"],
        attributes: {
          customType: {
            default: null,
            parseHTML: (element) => element.getAttribute("data-custom-type"),
            renderHTML: (attributes) => {
              if (!attributes.customType) return {};
              return { "data-custom-type": attributes.customType };
            },
          },
        },
      },
    ];
  },
});
