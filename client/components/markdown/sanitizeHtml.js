import DOMPurify from "dompurify";

const config = {
  ADD_TAGS: ["semantics", "annotation", "annotation-xml"],

  ADD_ATTR: ["encoding", "aria-hidden"],
};

export default function sanitizeHtml(html) {
  return DOMPurify.sanitize(html, config);
}
