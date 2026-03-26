import { Node, mergeAttributes } from "@tiptap/core";

/** Embeds HTML5 `<video controls>` for self-hosted uploads (email clients may still strip — preview / site use). */
export const TipTapVideo = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: "video[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        controls: "true",
        playsInline: "true",
        style: "max-width:100%;height:auto;",
      }),
    ];
  },
});
