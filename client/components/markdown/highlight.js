import Prism from "prismjs";

import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-c.js";
import "prismjs/components/prism-cpp.js";
import "prismjs/components/prism-csharp.js";
import "prismjs/components/prism-diff.js";
import "prismjs/components/prism-docker.js";
import "prismjs/components/prism-go.js";
import "prismjs/components/prism-graphql.js";
import "prismjs/components/prism-ini.js";
import "prismjs/components/prism-java.js";
import "prismjs/components/prism-json.js";
import "prismjs/components/prism-kotlin.js";
import "prismjs/components/prism-latex.js";
import "prismjs/components/prism-lua.js";
import "prismjs/components/prism-markdown.js";

import "prismjs/components/prism-markup-templating.js";
import "prismjs/components/prism-nginx.js";
import "prismjs/components/prism-perl.js";
import "prismjs/components/prism-php.js";
import "prismjs/components/prism-powershell.js";
import "prismjs/components/prism-python.js";
import "prismjs/components/prism-r.js";
import "prismjs/components/prism-ruby.js";
import "prismjs/components/prism-rust.js";
import "prismjs/components/prism-scss.js";
import "prismjs/components/prism-sql.js";
import "prismjs/components/prism-swift.js";
import "prismjs/components/prism-toml.js";
import "prismjs/components/prism-typescript.js";
import "prismjs/components/prism-yaml.js";

const aliases = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  rb: "ruby",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  md: "markdown",
  tex: "latex",
  ps1: "powershell",
  cs: "csharp",
  "c++": "cpp",
  dockerfile: "docker",

  html: "markup",
  xml: "markup",
  vue: "markup",
};

export default function highlight(code, language) {
  const name = aliases[language?.toLowerCase()] || language?.toLowerCase();
  const grammar = name ? Prism.languages[name] : null;
  if (!grammar) {
    return null;
  }
  return Prism.highlight(code, grammar, name);
}
