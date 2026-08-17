// Comprehensive language and extension detection
export const languageMap: Record<string, string> = {
  // Web
  html: "html",
  htm: "html",
  xhtml: "html",
  css: "css",
  scss: "scss",
  sass: "sass",
  less: "less",
  styl: "stylus",

  // JavaScript family
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  jsonc: "json",

  // PHP
  php: "php",
  phtml: "php",

  // Ruby
  rb: "ruby",
  erb: "erb",
  gemspec: "ruby",

  // Python
  py: "python",
  pyw: "python",
  pyc: "python",
  pyi: "python",
  pyx: "python",
  ipynb: "jupyter",

  // Java & JVM languages
  java: "java",
  class: "java",
  kt: "kotlin",
  kts: "kotlin",
  groovy: "groovy",
  scala: "scala",

  // C-family
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  hxx: "cpp",
  cs: "csharp",

  // Other languages
  go: "go",
  rs: "rust",
  swift: "swift",
  dart: "dart",
  lua: "lua",
  elm: "elm",
  clj: "clojure",
  cljs: "clojure",
  hs: "haskell",
  lhs: "haskell",

  // Shell/scripts
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  fish: "fish",
  cmd: "batch",
  bat: "batch",
  ps1: "powershell",

  // Config files
  yml: "yaml",
  yaml: "yaml",
  toml: "toml",
  ini: "ini",
  cfg: "ini",
  conf: "configuration",
  xml: "xml",
  plist: "xml",
  dtd: "xml",

  // Markdown & docs
  md: "markdown",
  markdown: "markdown",
  rst: "restructuredtext",
  tex: "latex",
  txt: "text",

  // Database
  sql: "sql",

  // Others
  svg: "svg",
  graphql: "graphql",
  gql: "graphql",
};

/** Formats a byte count into a human-readable size (e.g. "1.5 MB"). */
export function formatFileSize(bytes?: number): string {
  if (bytes == null || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

// Helper functions
export function getLanguageFromFileName(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();

  // First check exact filename matches (for files like .gitignore)
  const lowerFileName = fileName.toLowerCase();
  if (lowerFileName === "dockerfile") return "dockerfile";
  if (lowerFileName === ".gitignore" || lowerFileName === "gitignore")
    return "git";
  if (lowerFileName === ".gitattributes") return "git";
  if (lowerFileName === "makefile") return "makefile";

  return extension && extension in languageMap
    ? languageMap[extension]
    : "text";
}
export const isBinaryFile = (filename: string): boolean => {
  const binaryExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".bmp",
    ".tiff",
    ".ico",
    ".webp",
    ".mp3",
    ".mp4",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".wav",
    ".ogg",
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".zip",
    ".rar",
    ".tar",
    ".gz",
    ".7z",
    ".exe",
    ".dll",
    ".so",
    ".dylib",
    ".ttf",
    ".otf",
    ".woff",
    ".woff2",
  ];

  return binaryExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
};
