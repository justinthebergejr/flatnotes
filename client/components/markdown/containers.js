import container from "markdown-it-container";

const calloutTypes = [
  "info",
  "note",
  "tip",
  "success",
  "warning",
  "caution",
  "danger",
  "error",
];

function titleFrom(params, name) {
  const title = params.trim().slice(name.length).trim();
  return title || name.charAt(0).toUpperCase() + name.slice(1);
}

function callout(md, name) {
  return {
    validate: (params) =>
      new RegExp(`^\\s*${name}(\\s+.*)?$`, "i").test(params),
    render(tokens, index) {
      const token = tokens[index];
      if (token.nesting !== 1) {
        return "</div>\n";
      }
      const title = md.utils.escapeHtml(titleFrom(token.info, name));
      return (
        `<div class="md-callout md-callout-${name}">` +
        `<p class="md-callout-title">${title}</p>\n`
      );
    },
  };
}

function details(md) {
  return {
    validate: (params) => /^\s*details(\s+.*)?$/i.test(params),
    render(tokens, index) {
      const token = tokens[index];
      if (token.nesting !== 1) {
        return "</details>\n";
      }
      const summary = md.utils.escapeHtml(titleFrom(token.info, "details"));
      return `<details class="md-details"><summary>${summary}</summary>\n`;
    },
  };
}

function generic(md) {
  return {
    validate: (params) => /^\s*\S+/.test(params),
    render(tokens, index) {
      const token = tokens[index];
      if (token.nesting !== 1) {
        return "</div>\n";
      }
      const name = token.info.trim().split(/\s+/)[0].toLowerCase();
      const slug = md.utils.escapeHtml(name.replace(/[^a-z0-9_-]/g, ""));
      return `<div class="md-container md-container-${slug}">\n`;
    },
  };
}

export default function containers(md) {
  calloutTypes.forEach((name) => md.use(container, name, callout(md, name)));
  md.use(container, "details", details(md));
  md.use(container, "container", generic(md));
}
