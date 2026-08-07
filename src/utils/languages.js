/**
 * Supported languages for the editor and code execution.
 */
export const LANGUAGES = [
  { value: 'python', label: 'Python 3', monaco: 'python', ext: '.py' },
  { value: 'javascript', label: 'Node.js', monaco: 'javascript', ext: '.js' },
  { value: 'html', label: 'HTML / CSS', monaco: 'html', ext: '.html' },
  { value: 'java', label: 'Java', monaco: 'java', ext: '.java' },
  { value: 'c', label: 'C', monaco: 'c', ext: '.c' },
  { value: 'cpp', label: 'C++', monaco: 'cpp', ext: '.cpp' },
  { value: 'r', label: 'R', monaco: 'r', ext: '.r' },
  { value: 'sql', label: 'SQL', monaco: 'sql', ext: '.sql' },
];

/**
 * Default code templates for each language.
 */
export const LANG_TEMPLATES = {
  python: 'print("Hello, Python!")\n',
  javascript: 'console.log("Hello, Node.js!");\n',
  html: '<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: sans-serif; text-align: center; margin-top: 50px; }\n  </style>\n</head>\n<body>\n  <h1>Hello HTML</h1>\n</body>\n</html>\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Java!");\n    }\n}\n',
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, C!\\n");\n    return 0;\n}\n',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, C++!" << std::endl;\n    return 0;\n}\n',
  r: 'print("Hello, R!")\n',
  sql: "CREATE TABLE users (id INTEGER, name TEXT);\nINSERT INTO users VALUES (1, 'CollabLab');\nSELECT * FROM users;\n",
};

/**
 * Map file extension to Monaco language ID.
 */
const EXT_TO_LANG = {
  '.py': 'python',
  '.js': 'javascript',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.r': 'r',
  '.sql': 'sql',
};

/**
 * Get the Monaco editor language from a file name.
 * @param {string} fileName
 * @returns {string} Monaco language ID
 */
export function getMonacoLang(fileName) {
  const ext = '.' + (fileName || '').split('.').pop().toLowerCase();
  return EXT_TO_LANG[ext] || 'plaintext';
}

/**
 * Get the default file name for a language value.
 * @param {string} langValue - e.g. 'python', 'html', 'java'
 * @returns {string}
 */
export function getDefaultFileName(langValue) {
  if (langValue === 'html') return 'index.html';
  if (langValue === 'python') return 'main.py';
  if (langValue === 'java') return 'Main.java';
  const langConfig = LANGUAGES.find(l => l.value === langValue);
  return langConfig ? `main${langConfig.ext}` : 'main.js';
}
