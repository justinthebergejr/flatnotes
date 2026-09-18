const TAG = /^#[a-zA-Z0-9_-]+/;
const WIKI_LINK = /^\[\[\s*(\S(?:[^[\]]*?\S)?)\s*\]\]/;

function isWhitespace(code) {
  return code === 0x20 || code === 0x09 || code === 0x0a || code === 0x0d;
}

function pushLink(state, href, text, className) {
  const open = state.push("link_open", "a", 1);
  open.attrs = [["href", href]];
  if (className) {
    open.attrPush(["class", className]);
  }
  const content = state.push("text", "", 0);
  content.content = text;
  state.push("link_close", "a", -1);
}

export default function flatnotesLinks(md, options = {}) {
  const { noteHref, tagHref, hashHref } = options;

  if (noteHref) {
    md.inline.ruler.before("link", "wiki_link", (state, silent) => {
      if (state.src.charCodeAt(state.pos) !== 0x5b ) {
        return false;
      }
      const match = WIKI_LINK.exec(state.src.slice(state.pos, state.posMax));
      if (!match) {
        return false;
      }
      if (!silent) {
        pushLink(state, noteHref(match[1]), match[1], "wiki-link");
      }
      state.pos += match[0].length;
      return true;
    });
  }

  if (tagHref) {
    md.inline.ruler.before("link", "tag_link", (state, silent) => {
      if (state.src.charCodeAt(state.pos) !== 0x23 ) {
        return false;
      }

      if (state.pos > 0 && !isWhitespace(state.src.charCodeAt(state.pos - 1))) {
        return false;
      }
      const match = TAG.exec(state.src.slice(state.pos, state.posMax));
      if (!match) {
        return false;
      }
      const after = state.src.charCodeAt(state.pos + match[0].length);
      if (!Number.isNaN(after) && !isWhitespace(after)) {
        return false;
      }
      if (!silent) {
        pushLink(state, tagHref(match[0]), match[0], "tag-link");
      }
      state.pos += match[0].length;
      return true;
    });
  }

  if (hashHref) {
    const renderToken = md.renderer.rules.link_open;
    md.renderer.rules.link_open = function (tokens, idx, opts, env, self) {
      const href = tokens[idx].attrGet("href");

      if (href?.startsWith("#")) {
        tokens[idx].attrSet("href", hashHref(href));
      }
      return renderToken
        ? renderToken(tokens, idx, opts, env, self)
        : self.renderToken(tokens, idx, opts);
    };
  }
}
