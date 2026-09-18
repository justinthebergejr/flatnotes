import { params, searchSortOptions } from "../../constants.js";
import router from "../../router.js";

import createMarkdownItBase from "./markdownItBase.js";
import flatnotesLinks from "./flatnotesLinks.js";
import sanitizeHtml from "./sanitizeHtml.js";

const md = createMarkdownItBase().use(flatnotesLinks, {
  noteHref: (title) =>
    router.resolve({ name: "note", params: { title: title.trim() } }).href,
  tagHref: (tag) =>
    router.resolve({
      name: "search",
      query: {
        [params.searchTerm]: tag,
        [params.sortBy]: searchSortOptions.title,
      },
    }).href,
  hashHref: (hash) => router.resolve({ ...router.currentRoute.value, hash }).href,
});

export default function renderMarkdown(source) {
  return sanitizeHtml(md.render(source || ""));
}
