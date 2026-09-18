import MarkdownIt from "markdown-it";
import katexPlugin from "@vscode/markdown-it-katex";

import abbr from "markdown-it-abbr";
import anchor from "markdown-it-anchor";
import deflist from "markdown-it-deflist";
import { full as emoji } from "markdown-it-emoji";
import footnote from "markdown-it-footnote";
import ins from "markdown-it-ins";
import mark from "markdown-it-mark";
import sub from "markdown-it-sub";
import sup from "markdown-it-sup";
import taskLists from "markdown-it-task-lists";

import containers from "./containers.js";
import highlight from "./highlight.js";
import strictMathBlocks from "./strictMathBlocks.js";

function callable(mod) {
  let value = mod;
  while (value && typeof value !== "function" && value.default) value = value.default;
  return value;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9-\s]*/g, "")
    .trim()
    .replace(/\s/g, "-");
}

export default function createMarkdownItBase() {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight,
  });

  md.use(abbr).use(deflist).use(emoji).use(footnote);
  md.use(ins).use(mark).use(sub).use(sup);

  md.use(callable(katexPlugin), { throwOnError: false });

  md.use(strictMathBlocks);

  md.use(callable(taskLists), { label: false });
  md.use(anchor, { slugify, tabIndex: false });
  md.use(containers);

  md.linkify.set({ fuzzyLink: true });

  return md;
}
