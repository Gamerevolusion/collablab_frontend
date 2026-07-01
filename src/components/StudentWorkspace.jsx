import React, { useRef, useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Hand, Megaphone, X, Eye, Plus, FileText, Trash2 } from 'lucide-react';

const LANGUAGES = [
  { value: 'python', label: 'Python 3', monaco: 'python', ext: '.py' },
  { value: 'javascript', label: 'Node.js', monaco: 'javascript', ext: '.js' },
  { value: 'html', label: 'HTML / CSS', monaco: 'html', ext: '.html' },
  { value: 'java', label: 'Java', monaco: 'java', ext: '.java' },
  { value: 'c', label: 'C', monaco: 'c', ext: '.c' },
  { value: 'cpp', label: 'C++', monaco: 'cpp', ext: '.cpp' },
  { value: 'r', label: 'R', monaco: 'r', ext: '.r' },
  { value: 'sql', label: 'SQL', monaco: 'sql', ext: '.sql' },
];

const LANG_TEMPLATES = {
  python: 'print("Hello, Python!")\n',
  javascript: 'console.log("Hello, Node.js!");\n',
  html: '<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: sans-serif; text-align: center; margin-top: 50px; }\n  </style>\n</head>\n<body>\n  <h1>Hello HTML</h1>\n</body>\n</html>\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Java!");\n    }\n}\n',
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, C!\\n");\n    return 0;\n}\n',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, C++!" << std::endl;\n    return 0;\n}\n',
  r: 'print("Hello, R!")\n',
  sql: "CREATE TABLE users (id INTEGER, name TEXT);\nINSERT INTO users VALUES (1, 'CollabLab');\nSELECT * FROM users;\n"
};

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

const getMonacoLang = (fileName) => {
  const ext = '.' + fileName.split('.').pop().toLowerCase();
  return EXT_TO_LANG[ext] || 'plaintext';
};

export default function StudentWorkspace({
  isDark,
  lobbyCode,
  studentId,
  localCode,
  setLocalCode,
  selectedLanguage,
  setSelectedLanguage,
  terminalOutput,
  isRunning,
  onSyncCode,
  onExecuteCode,
  onRaiseHand,
  onLowerHand,
  isHandRaised,
  announcements,
  onDismissAnnouncement,
  onReportPaste,
  setTerminalOutput
}) {
  const editorRef = useRef(null);
  const [showPreview, setShowPreview] = useState(false);
  const [htmlPreview, setHtmlPreview] = useState('');
  const [stdin, setStdin] = useState('');

  // Handle messages from the iframe for console logs and errors
  useEffect(() => {
    const handleMessage = (event) => {
      // MED-5: Only accept messages from our own iframe (sandboxed iframes have origin 'null')
      if (event.origin !== 'null' && event.origin !== window.location.origin) return;
      if (event.data?.type === 'PREVIEW_LOG') {
        setTerminalOutput(prev => prev === 'Terminal standing by...' ? event.data.payload : prev + '\n' + event.data.payload);
      } else if (event.data?.type === 'PREVIEW_ERROR') {
        setTerminalOutput(prev => prev === 'Terminal standing by...' ? '[ERROR] ' + event.data.payload : prev + '\n[ERROR] ' + event.data.payload);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setTerminalOutput]);

  const INJECTED_SCRIPT = `
<script>
  window.onerror = function(msg, url, line) {
    window.parent.postMessage({ type: 'PREVIEW_ERROR', payload: msg + ' at line ' + line }, '*');
  };
  const originalLog = console.log;
  console.log = function(...args) {
    window.parent.postMessage({ type: 'PREVIEW_LOG', payload: args.join(' ') }, '*');
    originalLog.apply(console, args);
  };
  const originalError = console.error;
  console.error = function(...args) {
    window.parent.postMessage({ type: 'PREVIEW_ERROR', payload: args.join(' ') }, '*');
    originalError.apply(console, args);
  };
</script>
`;

  // Multi-file state
  const [files, setFiles] = useState(() => {
    let defaultName = 'main.js';
    if (selectedLanguage === 'html') defaultName = 'index.html';
    else if (selectedLanguage === 'python') defaultName = 'main.py';
    else if (selectedLanguage === 'java') defaultName = 'Main.java';
    else {
      const langConfig = LANGUAGES.find(l => l.value === selectedLanguage);
      if (langConfig) defaultName = `main${langConfig.ext}`;
    }
    return [{ name: defaultName, content: localCode || LANG_TEMPLATES[selectedLanguage] || '' }];
  });
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const borderClass = isDark ? 'border-neutral-800' : 'border-neutral-200';
  const headerClass = isDark ? 'bg-neutral-900' : 'bg-white shadow-sm';

  const activeFile = files[activeFileIdx] || files[0];
  const isWebMode = selectedLanguage === 'html' || files.some(f => f.name.endsWith('.html') || f.name.endsWith('.htm'));
  const monacoLang = getMonacoLang(activeFile?.name || 'main.py');

  const handleEditorChange = useCallback((value) => {
    const updated = [...files];
    updated[activeFileIdx] = { ...updated[activeFileIdx], content: value || '' };
    setFiles(updated);
    setLocalCode(value || '');
    onSyncCode(value || '', monacoLang, activeFile.name);

    if (isWebMode) {
      // Build combined HTML preview with CSS and JS files
      let htmlContent = updated.find(f => f.name.endsWith('.html') || f.name.endsWith('.htm'))?.content || '';
      const cssFiles = updated.filter(f => f.name.endsWith('.css'));
      const jsFiles = updated.filter(f => f.name.endsWith('.js'));
      const styleTag = cssFiles.map(f => `<style>/* ${f.name} */\n${f.content}</style>`).join('\n');
      const scriptTag = jsFiles.map(f => `<script>/* ${f.name} */\n${f.content}<\/script>`).join('\n');
      
      if (styleTag) {
        if (htmlContent.includes('</head>')) {
          htmlContent = htmlContent.replace('</head>', styleTag + '\n</head>');
        } else {
          htmlContent = styleTag + '\n' + htmlContent;
        }
      }
      htmlContent = INJECTED_SCRIPT + '\n' + htmlContent;
      if (scriptTag) {
        if (htmlContent.includes('</body>')) {
          htmlContent = htmlContent.replace('</body>', scriptTag + '\n</body>');
        } else {
          htmlContent = htmlContent + '\n' + scriptTag;
        }
      }
      setHtmlPreview(htmlContent);
    }
  }, [files, activeFileIdx, monacoLang, activeFile?.name, isWebMode, onSyncCode, setLocalCode]);

  const completionProvidersRegistered = useRef(false);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;

    editor.onDidPaste((e) => {
      const pastedText = editor.getModel().getValueInRange(e.range);
      if (pastedText.length > 10) {
        onReportPaste(pastedText.length);
      }
    });

    // Register IntelliSense completion providers (once)
    if (!completionProvidersRegistered.current) {
      completionProvidersRegistered.current = true;

      // --- Python ---
      const pythonKeywords = [
        'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class',
        'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global',
        'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise',
        'return', 'try', 'while', 'with', 'yield',
      ];
      const pythonBuiltins = [
        { label: 'print', insert: 'print(${1})', detail: 'print(*objects, sep=" ", end="\\n")' },
        { label: 'input', insert: 'input(${1:""})', detail: 'input([prompt]) -> str' },
        { label: 'len', insert: 'len(${1})', detail: 'len(s) -> int' },
        { label: 'range', insert: 'range(${1:stop})', detail: 'range(stop) or range(start, stop[, step])' },
        { label: 'int', insert: 'int(${1})', detail: 'int(x) -> int' },
        { label: 'float', insert: 'float(${1})', detail: 'float(x) -> float' },
        { label: 'str', insert: 'str(${1})', detail: 'str(object) -> str' },
        { label: 'list', insert: 'list(${1})', detail: 'list([iterable]) -> list' },
        { label: 'dict', insert: 'dict(${1})', detail: 'dict(**kwargs) -> dict' },
        { label: 'tuple', insert: 'tuple(${1})', detail: 'tuple([iterable]) -> tuple' },
        { label: 'set', insert: 'set(${1})', detail: 'set([iterable]) -> set' },
        { label: 'sorted', insert: 'sorted(${1})', detail: 'sorted(iterable, key=None, reverse=False)' },
        { label: 'enumerate', insert: 'enumerate(${1})', detail: 'enumerate(iterable, start=0)' },
        { label: 'zip', insert: 'zip(${1})', detail: 'zip(*iterables) -> zip object' },
        { label: 'map', insert: 'map(${1:func}, ${2:iterable})', detail: 'map(func, *iterables)' },
        { label: 'filter', insert: 'filter(${1:func}, ${2:iterable})', detail: 'filter(func, iterable)' },
        { label: 'open', insert: 'open(${1:"file"}, ${2:"r"})', detail: 'open(file, mode="r")' },
        { label: 'type', insert: 'type(${1})', detail: 'type(object) -> type' },
        { label: 'isinstance', insert: 'isinstance(${1:obj}, ${2:classinfo})', detail: 'isinstance(object, classinfo)' },
        { label: 'abs', insert: 'abs(${1})', detail: 'abs(x) -> number' },
        { label: 'max', insert: 'max(${1})', detail: 'max(iterable) or max(a, b, ...)' },
        { label: 'min', insert: 'min(${1})', detail: 'min(iterable) or min(a, b, ...)' },
        { label: 'sum', insert: 'sum(${1})', detail: 'sum(iterable, start=0)' },
        { label: 'round', insert: 'round(${1:number})', detail: 'round(number[, ndigits])' },
        { label: 'any', insert: 'any(${1})', detail: 'any(iterable) -> bool' },
        { label: 'all', insert: 'all(${1})', detail: 'all(iterable) -> bool' },
        { label: 'reversed', insert: 'reversed(${1})', detail: 'reversed(seq) -> iterator' },
        { label: 'hasattr', insert: 'hasattr(${1:obj}, ${2:"name"})', detail: 'hasattr(object, name) -> bool' },
        { label: 'getattr', insert: 'getattr(${1:obj}, ${2:"name"})', detail: 'getattr(object, name[, default])' },
        { label: 'format', insert: 'format(${1})', detail: 'format(value[, format_spec])' },
      ];

      monaco.languages.registerCompletionItemProvider('python', {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          const suggestions = [
            ...pythonKeywords.map(k => ({
              label: k,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: k,
              range,
            })),
            ...pythonBuiltins.map(b => ({
              label: b.label,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: b.insert,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: b.detail,
              range,
            })),
          ];
          return { suggestions };
        },
      });

      // --- Java ---
      const javaKeywords = [
        'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class',
        'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final',
        'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int',
        'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public',
        'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this',
        'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while',
      ];
      const javaBuiltins = [
        { label: 'System.out.println', insert: 'System.out.println(${1});', detail: 'Print to stdout with newline' },
        { label: 'System.out.print', insert: 'System.out.print(${1});', detail: 'Print to stdout' },
        { label: 'System.out.printf', insert: 'System.out.printf(${1:"%s"}, ${2});', detail: 'Formatted print' },
        { label: 'String', insert: 'String ${1:s} = ${2:""};', detail: 'String variable' },
        { label: 'Scanner', insert: 'Scanner ${1:sc} = new Scanner(System.in);', detail: 'Scanner for input' },
        { label: 'ArrayList', insert: 'ArrayList<${1:String}> ${2:list} = new ArrayList<>();', detail: 'ArrayList' },
        { label: 'HashMap', insert: 'HashMap<${1:String}, ${2:String}> ${3:map} = new HashMap<>();', detail: 'HashMap' },
        { label: 'Arrays.sort', insert: 'Arrays.sort(${1:arr});', detail: 'Sort an array' },
        { label: 'Math.max', insert: 'Math.max(${1:a}, ${2:b})', detail: 'Maximum of two values' },
        { label: 'Math.min', insert: 'Math.min(${1:a}, ${2:b})', detail: 'Minimum of two values' },
        { label: 'Math.abs', insert: 'Math.abs(${1:x})', detail: 'Absolute value' },
        { label: 'Math.sqrt', insert: 'Math.sqrt(${1:x})', detail: 'Square root' },
        { label: 'Math.pow', insert: 'Math.pow(${1:base}, ${2:exp})', detail: 'Power' },
        { label: 'Integer.parseInt', insert: 'Integer.parseInt(${1:s})', detail: 'Parse string to int' },
        { label: 'Double.parseDouble', insert: 'Double.parseDouble(${1:s})', detail: 'Parse string to double' },
        { label: 'main', insert: 'public static void main(String[] args) {\n\t${1}\n}', detail: 'Main method' },
      ];

      monaco.languages.registerCompletionItemProvider('java', {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          const suggestions = [
            ...javaKeywords.map(k => ({
              label: k,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: k,
              range,
            })),
            ...javaBuiltins.map(b => ({
              label: b.label,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: b.insert,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: b.detail,
              range,
            })),
          ];
          return { suggestions };
        },
      });

      // --- C / C++ ---
      const cKeywords = [
        'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double',
        'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'inline', 'int', 'long',
        'register', 'restrict', 'return', 'short', 'signed', 'sizeof', 'static', 'struct',
        'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while',
      ];
      const cBuiltins = [
        { label: 'printf', insert: 'printf(${1:"%s\\n"}, ${2});', detail: 'Print formatted output (stdio.h)' },
        { label: 'scanf', insert: 'scanf(${1:"%d"}, ${2:&var});', detail: 'Read formatted input (stdio.h)' },
        { label: 'fprintf', insert: 'fprintf(${1:stderr}, ${2:"%s"}, ${3});', detail: 'Print to file stream' },
        { label: 'malloc', insert: 'malloc(${1:size})', detail: 'Allocate memory (stdlib.h)' },
        { label: 'calloc', insert: 'calloc(${1:n}, ${2:size})', detail: 'Allocate zeroed memory (stdlib.h)' },
        { label: 'free', insert: 'free(${1:ptr});', detail: 'Free allocated memory (stdlib.h)' },
        { label: 'strlen', insert: 'strlen(${1:str})', detail: 'String length (string.h)' },
        { label: 'strcmp', insert: 'strcmp(${1:s1}, ${2:s2})', detail: 'Compare strings (string.h)' },
        { label: 'strcpy', insert: 'strcpy(${1:dest}, ${2:src});', detail: 'Copy string (string.h)' },
        { label: 'strcat', insert: 'strcat(${1:dest}, ${2:src});', detail: 'Concatenate strings (string.h)' },
        { label: 'memset', insert: 'memset(${1:ptr}, ${2:0}, ${3:size});', detail: 'Fill memory (string.h)' },
        { label: '#include', insert: '#include <${1:stdio.h}>', detail: 'Include header' },
      ];

      const cppExtras = [
        { label: 'cout', insert: 'std::cout << ${1} << std::endl;', detail: 'Print to stdout (iostream)' },
        { label: 'cin', insert: 'std::cin >> ${1};', detail: 'Read from stdin (iostream)' },
        { label: 'cerr', insert: 'std::cerr << ${1} << std::endl;', detail: 'Print to stderr (iostream)' },
        { label: 'endl', insert: 'std::endl', detail: 'End line and flush' },
        { label: 'string', insert: 'std::string ${1:s} = ${2:""};', detail: 'std::string (string)' },
        { label: 'vector', insert: 'std::vector<${1:int}> ${2:v};', detail: 'std::vector (vector)' },
        { label: 'map', insert: 'std::map<${1:std::string}, ${2:int}> ${3:m};', detail: 'std::map (map)' },
        { label: 'sort', insert: 'std::sort(${1:v}.begin(), ${1:v}.end());', detail: 'Sort (algorithm)' },
        { label: 'push_back', insert: 'push_back(${1})', detail: 'Append to vector' },
        { label: 'size', insert: 'size()', detail: 'Container size' },
        { label: 'begin', insert: 'begin()', detail: 'Iterator begin' },
        { label: 'end', insert: 'end()', detail: 'Iterator end' },
        { label: 'getline', insert: 'std::getline(std::cin, ${1:line});', detail: 'Read full line' },
        { label: 'using namespace std', insert: 'using namespace std;', detail: 'Use std namespace' },
      ];

      // Register for C
      monaco.languages.registerCompletionItemProvider('c', {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          const suggestions = [
            ...cKeywords.map(k => ({
              label: k,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: k,
              range,
            })),
            ...cBuiltins.map(b => ({
              label: b.label,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: b.insert,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: b.detail,
              range,
            })),
          ];
          return { suggestions };
        },
      });

      // Register for C++ (includes C keywords + C++ extras)
      monaco.languages.registerCompletionItemProvider('cpp', {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          const cppKeywords = [...cKeywords, 'bool', 'catch', 'class', 'const_cast', 'delete',
            'dynamic_cast', 'explicit', 'export', 'false', 'friend', 'mutable', 'namespace',
            'new', 'operator', 'private', 'protected', 'public', 'reinterpret_cast',
            'static_cast', 'template', 'this', 'throw', 'true', 'try', 'typeid', 'typename',
            'using', 'virtual', 'wchar_t', 'nullptr', 'override', 'final', 'constexpr', 'auto'];
          const suggestions = [
            ...cppKeywords.map(k => ({
              label: k,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: k,
              range,
            })),
            ...[...cBuiltins, ...cppExtras].map(b => ({
              label: b.label,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: b.insert,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: b.detail,
              range,
            })),
          ];
          return { suggestions };
        },
      });
    }
  };

  const handleRun = () => {
    if (isWebMode) {
      // Build combined preview
      let htmlContent = files.find(f => f.name.endsWith('.html') || f.name.endsWith('.htm'))?.content || '';
      const cssFiles = files.filter(f => f.name.endsWith('.css'));
      const jsFiles = files.filter(f => f.name.endsWith('.js'));
      const styleTag = cssFiles.map(f => `<style>/* ${f.name} */\n${f.content}</style>`).join('\n');
      const scriptTag = jsFiles.map(f => `<script>/* ${f.name} */\n${f.content}<\/script>`).join('\n');
      
      if (styleTag) {
        if (htmlContent.includes('</head>')) {
          htmlContent = htmlContent.replace('</head>', styleTag + '\n</head>');
        } else {
          htmlContent = styleTag + '\n' + htmlContent;
        }
      }
      htmlContent = INJECTED_SCRIPT + '\n' + htmlContent;
      if (scriptTag) {
        if (htmlContent.includes('</body>')) {
          htmlContent = htmlContent.replace('</body>', scriptTag + '\n</body>');
        } else {
          htmlContent = htmlContent + '\n' + scriptTag;
        }
      }
      setHtmlPreview(htmlContent);
      setShowPreview(true);
      return;
    }
    const codeToRun = editorRef.current ? editorRef.current.getValue() : activeFile.content;
    const lang = getMonacoLang(activeFile.name);
    const execLang = lang === 'css' ? 'html' : (LANGUAGES.find(l => l.monaco === lang)?.value || selectedLanguage);
    onExecuteCode(execLang, codeToRun, stdin);
  };

  const toggleHand = () => {
    if (isHandRaised) onLowerHand();
    else onRaiseHand();
  };

  const addFile = () => {
    const name = newFileName.trim();
    if (!name || files.some(f => f.name === name)) return;
    setFiles(prev => [...prev, { name, content: '' }]);
    setActiveFileIdx(files.length);
    setNewFileName('');
    setShowNewFile(false);
  };

  const removeFile = (idx) => {
    if (files.length <= 1) return;
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    if (activeFileIdx >= updated.length) setActiveFileIdx(updated.length - 1);
    else if (activeFileIdx === idx) setActiveFileIdx(0);
  };

  const switchFile = (idx) => {
    // Save current editor content
    if (editorRef.current) {
      const currentContent = editorRef.current.getValue();
      const updated = [...files];
      updated[activeFileIdx] = { ...updated[activeFileIdx], content: currentContent };
      setFiles(updated);
    }
    setActiveFileIdx(idx);
    const targetFile = files[idx];
    setLocalCode(targetFile?.content || '');
    
    if (targetFile) {
      const lang = getMonacoLang(targetFile.name);
      const execLang = lang === 'css' ? 'html' : (LANGUAGES.find(l => l.monaco === lang)?.value || selectedLanguage);
      onSyncCode(targetFile.content || '', execLang, targetFile.name);
    }
  };

  useEffect(() => {
    if (announcements.length === 0) return;
    const latest = announcements[announcements.length - 1];
    const timer = setTimeout(() => onDismissAnnouncement(latest.id), 15000);
    return () => clearTimeout(timer);
  }, [announcements, onDismissAnnouncement]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {announcements.length > 0 && (
        <div className="space-y-0.5">
          {announcements.map(a => (
            <div
              key={a.id}
              className={`flex items-center justify-between gap-3 px-4 py-2 text-[10px] font-bold animate-pulse ${isDark ? 'bg-indigo-600/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}
            >
              <div className="flex items-center gap-2">
                <Megaphone size={11} />
                <span>{a.message}</span>
              </div>
              <button onClick={() => onDismissAnnouncement(a.id)} className="hover:opacity-60 transition">
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className={`flex items-center justify-between border-b px-4 py-2 ${headerClass} ${borderClass}`}>
        <div className="flex items-center gap-3">
          <select
            value={selectedLanguage}
            onChange={(e) => {
              const newLang = e.target.value;
              setSelectedLanguage(newLang);
              
              let defaultName = 'main.js';
              if (newLang === 'html') defaultName = 'index.html';
              else if (newLang === 'python') defaultName = 'main.py';
              else if (newLang === 'java') defaultName = 'Main.java';
              else {
                const langConfig = LANGUAGES.find(l => l.value === newLang);
                if (langConfig) defaultName = `main${langConfig.ext}`;
              }
              
              const newContent = LANG_TEMPLATES[newLang] || '';
              
              const existingIdx = files.findIndex(f => f.name === defaultName);
              if (existingIdx !== -1) {
                setActiveFileIdx(existingIdx);
                setLocalCode(files[existingIdx].content);
              } else {
                setFiles(prev => [...prev, { name: defaultName, content: newContent }]);
                setActiveFileIdx(files.length);
                setLocalCode(newContent);
              }
            }}
            className={`border rounded text-[10px] px-2 py-1 focus:outline-none ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-neutral-200 text-black'}`}
          >
            {LANGUAGES.map(l => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
          {isWebMode && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition ${
                showPreview
                  ? 'bg-indigo-600 text-white'
                  : isDark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
              }`}
            >
              <Eye size={10} /> {showPreview ? 'HIDE PREVIEW' : 'SHOW PREVIEW'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleHand}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold transition ${
              isHandRaised
                ? 'bg-amber-500 text-white hover:bg-amber-400 animate-pulse'
                : isDark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
            }`}
          >
            <Hand size={10} /> {isHandRaised ? 'HAND RAISED' : 'RAISE HAND'}
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-[10px] font-bold transition disabled:opacity-50"
          >
            <Play size={10} /> {isRunning ? 'RUNNING...' : isWebMode ? 'PREVIEW' : 'RUN CODE'}
          </button>
        </div>
      </div>

      {/* File tabs */}
      <div className={`flex items-center gap-0.5 px-3 py-1.5 border-b overflow-x-auto ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
        {files.map((f, idx) => (
          <div
            key={f.name}
            className={`group flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition ${
              idx === activeFileIdx
                ? (isDark ? 'bg-neutral-700 text-white' : 'bg-white text-black shadow-sm')
                : (isDark ? 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100')
            }`}
            onClick={() => switchFile(idx)}
          >
            <FileText size={9} />
            <span>{f.name}</span>
            {files.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition ml-0.5"
              >
                <X size={8} />
              </button>
            )}
          </div>
        ))}
        {showNewFile ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addFile(); if (e.key === 'Escape') setShowNewFile(false); }}
              placeholder="e.g. style.css"
              autoFocus
              className={`border rounded px-2 py-0.5 text-[10px] w-28 focus:outline-none ${isDark ? 'bg-black border-neutral-700 text-white placeholder:text-neutral-600' : 'bg-white border-neutral-300 text-black placeholder:text-neutral-400'}`}
            />
            <button onClick={addFile} className="text-emerald-500 hover:text-emerald-400 text-[10px] font-bold">✓</button>
            <button onClick={() => setShowNewFile(false)} className="text-red-500 hover:text-red-400 text-[10px] font-bold">✕</button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewFile(true)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition ${isDark ? 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'}`}
            title="Add new file"
          >
            <Plus size={10} />
          </button>
        )}
      </div>

      {/* Editor */}
      <div className={`${isWebMode && showPreview ? 'h-[50%]' : 'h-[60%]'} w-full border-b ${borderClass}`}>
        <Editor
          key={activeFile.name}
          height="100%"
          width="100%"
          theme={isDark ? 'vs-dark' : 'light'}
          language={monacoLang}
          defaultValue={activeFile.content}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{ fontSize: 13, minimap: { enabled: false } }}
        />
      </div>

      {/* Output / Preview */}
      {isWebMode && showPreview ? (
        <div className={`h-[50%] w-full border-b ${borderClass} relative`}>
          <div className="absolute top-1 left-3 text-[9px] text-neutral-500 font-bold uppercase z-10">Live Preview</div>
          <iframe
            srcDoc={htmlPreview}
            title="HTML Preview"
            className="w-full h-full border-none bg-white"
            sandbox="allow-scripts"
          />
        </div>
      ) : (
        <div className={`flex-1 w-full flex border-t ${borderClass}`}>
          {/* Standard Input */}
          <div className={`w-1/3 p-4 border-r ${borderClass} flex flex-col ${isDark ? 'bg-[#0A0A0A]' : 'bg-white'}`}>
            <div className="text-[9px] text-neutral-500 font-bold uppercase mb-2">Standard Input (stdin)</div>
            <textarea
              value={stdin}
              onChange={e => setStdin(e.target.value)}
              placeholder="Enter inputs here (e.g. for Python input())..."
              className={`flex-1 w-full text-xs p-2 rounded focus:outline-none resize-none ${isDark ? 'bg-neutral-900 text-neutral-300 placeholder-neutral-700' : 'bg-neutral-50 text-neutral-700 placeholder-neutral-400'}`}
              spellCheck="false"
            />
          </div>
          {/* Output Console */}
          <div className={`w-2/3 p-4 overflow-y-auto ${isDark ? 'bg-black' : 'bg-neutral-100'}`}>
            <div className="text-[9px] text-neutral-500 font-bold uppercase mb-2">Live Console</div>
            <pre className={`text-xs whitespace-pre-wrap ${isDark ? 'text-neutral-300' : 'text-neutral-700 font-semibold'}`}>
              {terminalOutput}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
