'use client';
import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import Select from 'react-select';
import monacoThemes from 'monaco-themes/themes/themelist';
import { defineTheme } from './themes';
import { languageOptions } from './language';
import OutputSection from './output';
import axios from 'axios';
import dotenv from 'dotenv';
import Explorer from './fileExplorer';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase-config';
import { useRouter, useSearchParams } from 'next/navigation';

dotenv.config();

const apiKey = process.env.NEXT_PUBLIC_JUDGE0_API_;
console.log(apiKey);
const customStyles = {
  control: (base) => ({
    ...base,
    backgroundColor: '#111',
    color: '#fff',
    border: '1px solid #444',
    boxShadow: '3px 3px 0px rgba(0,0,0,0.25)',
    transition: 'all 0.3s ease',
  }),
  singleValue: (base) => ({
    ...base,
    color: '#fff',
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: '#111',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? '#333' : '#111',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  }),
};

const normalizeLang = (langStr) => {
  if (!langStr) return '';
  const lower = langStr.toLowerCase();
  if (lower.includes('c++') || lower === 'cpp') return 'cpp';
  if (lower.includes('c#') || lower === 'csharp') return 'csharp';
  return lower.replace(/-[^ ]+/, ''); 
};

const detectLanguageFromFileName = (fileName) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript-node12';
    case 'ts':
    case 'tsx':
      return 'typescript-3.7';
    case 'py':
      return 'python-3.8'; 
    case 'cpp':
    case 'cxx':
    case 'cc':
      return 'cpp-gcc9'; 
    case 'c':
      return 'c-gcc9'; 
    case 'java':
      return 'java-openjdk13';
    case 'cs':
      return 'csharp-mono6';
    case 'go':
      return 'go-1.13';
    case 'rb':
      return 'ruby-2.7';
    case 'php':
      return 'php-7.4';
    case 'swift':
      return 'swift-5.2';
    case 'kt':
      return 'kotlin-1.3';
    case 'rs':
      return 'rust-1.40';
    case 'scala':
      return 'scala-2.13';
    case 'pl':
      return 'prolog-gnu';
    case 'perl':
      return 'perl-5.28';
    case 'sh':
      return 'bash-5.0';
    case 'ps1':
      return 'powershell-7.0';
    case 'sql':
      return 'sql-sqlite3';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'xml':
      return 'xml';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'dockerfile':
      return 'dockerfile';
    case 'r':
      return 'r-4.0';
    case 'dart':
      return 'dart-2.10';
    case 'lua':
      return 'lua-5.3';
    case 'groovy':
      return 'groovy-3.0';
    case 'hs':
      return 'haskell-ghc8';
    case 'ex':
    case 'exs':
      return 'elixir-1.9';
    case 'clj':
      return 'clojure-1.10';
    case 'fs':
      return 'fsharp-mono6';
    case 'm':
      return 'octave-5.1';
    case 'objc':
      return 'objective-c-clang7';
    case 'vb':
      return 'vbnet-mono6';
    case 'pas':
      return 'pascal-fpc3';
    case 'ada':
      return 'ada-gnat9';
    case 'cbl':
      return 'cobol-gnucobol2';
    case 'f':
    case 'for':
      return 'fortran-gfortran9';
    case 'd':
      return 'd-dmd';
    case 'scm':
      return 'scheme-guile2';
    case 'lisp':
      return 'lisp-sbcl';
    case 'erl':
      return 'erlang-22';
    case 'ml':
      return 'ocaml-4.09';
    case 'jl':
      return 'julia-1.5';
    case 'nim':
      return 'nim-1.4';
    case 'cr':
      return 'crystal-0.33';
    case 'rkt':
      return 'racket-7.9';
    case 'v':
      return 'vlang-0.2';
    case 'zig':
      return 'zig-0.8';
    case 'abap':
      return 'abap';
    case 'apex':
      return 'apex';
    case 'bat':
      return 'batch';
    case 'coffee':
      return 'coffeescript-2.5';
    case 'hbs':
      return 'handlebars';
    case 'ini':
      return 'ini';
    case 'less':
      return 'less';
    case 'scss':
      return 'scss';
    case 'svelte':
      return 'svelte';
    case 'asm':
      return 'assembly-nasm';
    case 'bas':
      return 'basic-fbc';
    case 'txt':
      return 'plaintext';
    default:
      return 'plaintext';
  }
};

export default function CodeEditorWindow({
  onChange,
  initialLanguage = 'javascript-node12',
  code = '//Write your code here....',
  projectId,
}) {
  const [value, setValue] = useState(code);
  const [language, setLanguage] = useState(initialLanguage);
  const [theme, setTheme] = useState('vs-dark');
  const [customInput, setCustomInput] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('Pending');
  const [timeTaken, setTimeTaken] = useState('N/A');
  const [memoryUsed, setMemoryUsed] = useState('N/A');
  const [uid, setUid] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeEditorTabs, setActiveEditorTabs] = useState([]);
  const [selectedTabId, setSelectedTabId] = useState(null);
  const [currentFileId, setCurrentFileId] = useState(null);
  const [showGuestNotification, setShowGuestNotification] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const selectedLanguageRef = useRef(language);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const [guestFiles, setGuestFiles] = useState(
    new Map([
      [
        'sample-js',
        {
          id: 'sample-js',
          name: 'sample.js',
          content:
            '// Welcome to the Code Editor!\n// You\'re in guest mode - changes won\'t be saved permanently.\n\nconsole.log("Hello, World!");\n\n// Try writing some code here!',
          language: 'javascript-node12',
        },
      ],
      [
        'sample-py',
        {
          id: 'sample-py',
          name: 'sample.py',
          content:
            '# Welcome to the Code Editor!\n# You\'re in guest mode - changes won\'t be saved permanently.\n\nprint("Hello, World!")\n\n# Try writing some Python code here!',
          language: 'python-3.8',
        },
      ],
    ])
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setShowGuestNotification(true);
      const timer = setTimeout(() => {
        setShowGuestNotification(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowGuestNotification(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    if (!isAuthenticated) {
      setProject(null);
      setLoading(false);
      return;
    }

    const fetchProject = async () => {
      try {
        const res = await axios.get(`/api/getFileTree?uid=${uid}&projectId=${projectId}`);
        setProject({ projectId, fileTree: res.data });
      } catch (err) {
        console.error('Failed to load project:', err);
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    if (uid) {
      fetchProject();
    }
  }, [projectId, isAuthenticated, uid]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        setIsAuthenticated(true);
      } else {
        setUid(null);
        setIsAuthenticated(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    selectedLanguageRef.current = language;
  }, [language]);

  const saveToMongoDB = async (fileId, content, lang) => {
    if (!isAuthenticated || !uid) {
      console.log('Guest mode: Skipping MongoDB save');
      return;
    }

    try {
      await axios.post('/api/saveFile', {
        fileId,
        content,
        language: lang,
        uid,
        projectId,
      });
      console.log(`File ${fileId} saved to MongoDB`);
    } catch (error) {
      console.error('Error saving to MongoDB:', error);
    }
  };

  const saveFileLocally = async (fileId, content) => {
    if (isAuthenticated) {
      return;
    }
    setGuestFiles((prev) => new Map(prev.set(fileId, { ...prev.get(fileId), content })));
  };

  const loadFileLocally = (fileId) => {
    if (isAuthenticated && project?.fileTree) {
      const findFile = (tree) => {
        if (tree.id === fileId && tree.type === 'file') {
          return tree;
        }
        if (tree.children) {
          for (const child of tree.children) {
            const found = findFile(child);
            if (found) return found;
          }
        }
        return null;
      };
      return findFile(project.fileTree);
    }
    return guestFiles.get(fileId) || null;
  };

  const handleEditorChange = async (newValue) => {
    setValue(newValue);
    onChange && onChange('code', newValue);

    if (currentFileId) {
      await saveFileLocally(currentFileId, newValue);
      if (isAuthenticated) {
        saveToMongoDB(currentFileId, newValue, language);
      }
    }
  };

  const handleLanguageChange = (selectedOption) => {
    setLanguage(selectedOption.value);
    if (currentFileId && isAuthenticated) {
      saveToMongoDB(currentFileId, value, selectedOption.value);
    }
  };

  const handleThemeChange = (selectedOption) => {
    const themeName = selectedOption.value;
    if (['light', 'vs-dark'].includes(themeName)) {
      setTheme(themeName);
    } else {
      defineTheme(themeName).then(() => setTheme(themeName));
    }
  };

  const handleRunCode = async () => {
    try {
      setStatus('Running...');
      setOutput('');
      setTimeTaken('N/A');
      setMemoryUsed('N/A');
      const selectedLang = languageOptions.find((opt) => opt.value === language);
      if (!selectedLang?.id) {
        setOutput('Error: Language not supported for compilation.');
        setStatus('Error');
        return;
      }
      const submissionResponse = await axios.post(
        'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true&fields=*',
        {
          source_code: value,
          language_id: selectedLang.id,
          stdin: customInput,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
            'x-rapidapi-key': apiKey,
          },
        }
      );
      const result = submissionResponse.data;
      setOutput(result.stdout || result.stderr || result.compile_output || 'No output.');
      setStatus(result.status?.description || 'Completed');
      setTimeTaken(result.time || 'N/A');
      setMemoryUsed(result.memory || 'N/A');
    } catch (error) {
      setOutput(`Error: ${error.response?.data?.message || error.message}`);
      setStatus('Error');
    }
  };

  const handleBugFix = async () => {
    try {
      setStatus('Fixing code...');
      const response = await axios.post('/api/bugfix', {
        code: value,
        language: normalizeLang(language),
      });
      const fixedCode = response.data.fixed_code;
      if (fixedCode) {
        setValue(fixedCode);
        setOutput('Bug fix applied.');
        setStatus('Fixed');
        if (currentFileId && isAuthenticated) {
          saveToMongoDB(currentFileId, fixedCode, language);
        }
      } else {
        setOutput('No fix available.');
        setStatus('No fix');
      }
    } catch (error) {
      console.error('Error fixing code:', error);
      setOutput('Error fixing code: ' + error.message);
      setStatus('Error');
    }
  };

  const registerInlineCompletionsProvider = (monacoInstance) => {
    const langs = monacoInstance.languages.getLanguages();
    langs.forEach((lang) => {
      monacoInstance.languages.registerInlineCompletionsProvider(lang.id, {
        provideInlineCompletions: async (model, position) => {
          const code = model.getValue();
          if (!code) return { items: [] };
          try {
            const response = await axios.post('/api/suggestion', {
              code,
              language: normalizeLang(selectedLanguageRef.current),
            });
            let suggestion = response.data.suggestion || '';
            if (!suggestion) return { items: [] };
            return {
              items: [
                {
                  insertText: suggestion,
                  range: new monacoRef.current.Range(
                    position.lineNumber,
                    position.column,
                    position.lineNumber,
                    position.column
                  ),
                },
              ],
              dispose: () => {},
            };
          } catch (error) {
            console.error('Error fetching suggestion:', error);
            return { items: [] };
          }
        },
        handleItemDidShow: () => {},
        freeInlineCompletions: () => {},
      });
    });
  };

  const registerHoverProvider = (monacoInstance) => {
    monacoInstance.languages.registerHoverProvider(language, {
      provideHover: (model, position) => {
        const markers = monacoInstance.editor.getModelMarkers({ resource: model.uri });
        const hovered = markers.find(
          (marker) =>
            marker.startLineNumber <= position.lineNumber &&
            marker.endLineNumber >= position.lineNumber &&
            marker.startColumn <= position.column &&
            marker.endColumn >= position.column
        );
        if (!hovered) return null;
        const fixLink = `[Fix Bug](command:openFixDialog)`;
        return {
          range: new monacoInstance.Range(
            hovered.startLineNumber,
            hovered.startColumn,
            hovered.endLineNumber,
            hovered.endColumn
          ),
          contents: [
            {
              value: `**${hovered.severity === monacoInstance.MarkerSeverity.Error ? 'Error' : 'Warning'}:** ${
                hovered.message
              }`,
            },
            { value: fixLink },
          ],
        };
      },
    });
  };

  const handleEditorDidMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;
    editor.updateOptions({ inlineSuggest: { enabled: true } });
    registerInlineCompletionsProvider(monacoInstance);
    registerHoverProvider(monacoInstance);
    editor.addAction({
      id: 'openFixDialog',
      label: 'Fix Code',
      run: () => {
        handleBugFix();
      },
    });
  
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter, () => {
      console.log('Ctrl+Enter triggered');
      handleRunCode();
    });
    editor.onDidChangeModelContent(() => {
      const model = editor.getModel();
      if (model) {
        setTimeout(() => {
          editor.trigger('keyboard', 'editor.action.inlineSuggest.trigger');
        }, 300);
      }
    });
    setTimeout(() => {
      editor.trigger('keyboard', 'editor.action.inlineSuggest.trigger');
    }, 1500);
  };

  const handleFileSelect = async (file) => {
    setCurrentFileId(file.id);
    if (file.name) {
      const detectedLang = detectLanguageFromFileName(file.name);
      setLanguage(detectedLang);
    }
    console.log('Loading file:', file);

    const fileData = isAuthenticated ? file : loadFileLocally(file.id);
    if (fileData && fileData.content !== undefined) {
      setValue(fileData.content);
    } else {
      setValue('');
      await saveFileLocally(file.id, '');
      if (isAuthenticated) {
        saveToMongoDB(file.id, '', language);
      }
    }

    if (!activeEditorTabs.some((tab) => tab.id === file.id)) {
      setActiveEditorTabs([...activeEditorTabs, { id: file.id, name: file.name, data: file.content || '' }]);
    }
    setSelectedTabId(file.id);
  };

  const getMonacoLanguage = () => {
    const selectedLang = languageOptions.find((opt) => opt.value === language);
    return selectedLang ? selectedLang.monacoLanguage : 'plaintext';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center text-gray-200">
        Loading project...
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row justify-center gap-6 p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen text-gray-200">
      {showGuestNotification && (
        <div className="fixed top-4 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-notification">
          <div className="text-sm font-semibold">Guest Mode</div>
          <div className="text-xs">Changes won't be saved permanently</div>
        </div>
      )}

      <Explorer
        uid={uid}
        projectId={isAuthenticated ? projectId : null}
        onFileSelect={handleFileSelect}
        activeEditorTabs={activeEditorTabs}
        setActiveEditorTabs={setActiveEditorTabs}
        setSelectedTabId={setSelectedTabId}
        isAuthenticated={isAuthenticated}
      />

      <div className="flex-1 md:w-[70%] flex flex-col">
        <div className="flex flex-wrap justify-between gap-5 mb-5">
          <div className="w-full md:w-64">
            <Select
              options={languageOptions}
              value={languageOptions.find((opt) => opt.value === language)}
              onChange={handleLanguageChange}
              placeholder="Select Language"
              styles={{
                ...customStyles,
                control: (base) => ({
                  ...base,
                  backgroundColor: '#1f2937',
                  borderColor: '#374151',
                  boxShadow: '0 0 8px rgba(59,130,246,0.5)',
                  transition: 'all 0.3s ease',
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? '#2563eb' : '#1f2937',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                }),
                singleValue: (base) => ({
                  ...base,
                  color: 'white',
                }),
              }}
            />
          </div>

          <div className="w-full md:w-64">
            <Select
              placeholder="Select Theme"
              options={Object.entries(monacoThemes).map(([themeId, themeName]) => ({
                label: themeName,
                value: themeId,
                key: themeId,
              }))}
              value={{ label: theme, value: theme }}
              styles={{
                ...customStyles,
                control: (base) => ({
                  ...base,
                  backgroundColor: '#1f2937',
                  borderColor: '#374151',
                  boxShadow: '0 0 8px rgba(59,130,246,0.5)',
                  transition: 'all 0.3s ease',
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? '#2563eb' : '#1f2937',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease',
                }),
                singleValue: (base) => ({
                  ...base,
                  color: 'white',
                }),
              }}
              onChange={handleThemeChange}
            />
          </div>
        </div>

        <div className="relative rounded-xl overflow-hidden shadow-2xl bg-gradient-to-tr from-gray-800 to-gray-900 animate-fadeIn">
          <Editor
            height="85vh"
            width="100%"
            language={getMonacoLanguage()}
            value={value}
            theme={theme}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 16,
              fontFamily: "'Fira Code', monospace",
              fontLigatures: true,
              lineNumbers: 'on',
              minimap: { enabled: false },
              inlineSuggest: { enabled: true },
              tabCompletion: 'on',
              smoothScrolling: true,
              cursorBlinking: 'phase',
              cursorSmoothCaretAnimation: true,
            }}
          />
        </div>
      </div>

      <div className="w-full md:w-1/3 flex flex-col gap-5">
        <textarea
          rows="10"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Custom input"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-5 py-4 text-gray-200 shadow-inner placeholder-gray-500 resize-y focus:outline-none focus:ring-4 focus:ring-cyan-500 transition duration-300"
          spellCheck={false}
        />

        <OutputSection
          output={output}
          className="bg-gray-900 rounded-lg p-4 shadow-inner font-mono text-sm whitespace-pre-wrap min-h-[150px] overflow-auto"
        />

        <div className="text-gray-300 text-sm flex flex-col gap-2">
          <div>
            <span className="font-semibold text-cyan-400">Status:</span> {status}
          </div>
          <div>
            <span className="font-semibold text-cyan-400">Time Taken:</span> {timeTaken} seconds
          </div>
          <div>
            <span className="font-semibold text-cyan-400">Memory Used:</span> {memoryUsed} KB
          </div>
        </div>

        <button
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg px-6 py-3 font-semibold transition-transform duration-300 transform hover:scale-105 shadow-lg"
          onClick={handleRunCode}
        >
          Run
        </button>
        <button
          className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 py-3 font-semibold transition-transform duration-300 transform hover:scale-105 shadow-lg"
          onClick={handleBugFix}
        >
          Fix Code
        </button>
      </div>

      <style jsx>{`
        @keyframes notification {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          10% {
            opacity: 1;
            transform: translateY(0);
          }
          90% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-10px);
          }
        }
        .animate-notification {
          animation: notification 5s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
}