'use client';
import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import Select from "react-select";
import monacoThemes from "monaco-themes/themes/themelist";
import { defineTheme } from "./themes";
import { languageOptions } from "./language";
import OutputSection from "./output";
import axios from "axios";
import useKeyPress from "@/hooks/keypress";
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.NEXT_PUBLIC_JUDGE0_API_KEY;
console.log(apiKey);
const customStyles = {
  control: (base) => ({
    ...base,
    backgroundColor: "#111",
    color: "#fff",
    border: "1px solid #444",
    boxShadow: "3px 3px 0px rgba(0,0,0,0.25)",
  }),
  singleValue: (base) => ({
    ...base,
    color: "#fff",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "#111",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused ? "#333" : "#111",
    color: "#fff",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  }),
};

const normalizeLang = (langStr) => {
  if (!langStr) return "";
  const lower = langStr.toLowerCase();
  if (lower === "c++") return "cpp";
  return lower;
};

export default function CodeEditorWindow({
  onChange,
  initialLanguage = "javascript",
  code = "Write your code here....",
}) {
  const [value, setValue] = useState(code);
  const [language, setLanguage] = useState(initialLanguage);
  const [theme, setTheme] = useState("vs-dark");
  const [customInput, setCustomInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("Pending");
  const [timeTaken, setTimeTaken] = useState("N/A");
  const [memoryUsed, setMemoryUsed] = useState("N/A");
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const selectedLanguageRef = useRef(language);
  const isCtrlEnterPressed = useKeyPress(["Ctrl", "Enter"]);

  useEffect(() => { selectedLanguageRef.current = language; }, [language]);

  

  const handleEditorChange = (newValue) => {
    setValue(newValue);
    onChange && onChange("code", newValue);
  };

  const handleLanguageChange = (selectedOption) => setLanguage(selectedOption.value);
  const handleThemeChange = (selectedOption) => {
    const themeName = selectedOption.value;

    if (["light", "vs-dark"].includes(themeName)) {
      setTheme(themeName);
    } else {
      defineTheme(themeName).then(() => setTheme(themeName));
    }
  };
  
  const handleRunCode = async () => {
    try {
      setStatus("Running...");
      setTimeTaken("N/A");
      setMemoryUsed("N/A");
      const submissionResponse = await axios.post(
        "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=false&fields=*",
        {
          source_code: value,
          language_id:
            languageOptions.find((opt) => opt.value === language)?.id || 63,
          stdin: customInput,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
            "x-rapidapi-key":
              apiKey,
          },
        }
      );
      const { token } = submissionResponse.data;
      const fetchResult = async () => {
        const resultResponse = await axios.get(
          `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=false&fields=*`,
          {
            headers: {
              "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
              "x-rapidapi-key":
                apiKey,
            },
          }
        );
        const result = resultResponse.data;
        setOutput(result.stdout || result.stderr || "No output.");
        setStatus(result.status.description);
        setTimeTaken(result.time || "N/A");
        setMemoryUsed(result.memory || "N/A");
      };
      setTimeout(fetchResult, 1000);
    } catch (error) {
      setOutput("Error: " + error.message);
      setStatus("Error");
    }
  };
  useEffect(() => {
    if (isCtrlEnterPressed) {
        handleRunCode();
    }
}, [isCtrlEnterPressed]);
  const handleBugFix = async () => {
    try {
      setStatus("Fixing code...");
      const response = await axios.post("http://localhost:5000/api/bugfix", {
        code: value,
        language: normalizeLang(language)
      });
      const fixedCode = response.data.fixed_code;
      if (fixedCode) {
        setValue(fixedCode);
        setOutput("Bug fix applied.");
        setStatus("Fixed");
      } else {
        setOutput("No fix available.");
        setStatus("No fix");
      }
    } catch (error) {
      console.error("Error fixing code:", error);
      setOutput("Error fixing code: " + error.message);
      setStatus("Error");
    }
  };

  const updateBugMarkers = async (model) => {
    if (normalizeLang(language) !== "python") return;
    try {
      console.log("Updating markers for language:", normalizeLang(language));
      const response = await axios.post("http://localhost:5000/api/bugdetect", {
        code: model.getValue(),
        language: normalizeLang(language)
      });
      const errors = response.data.errors || [];
      monaco.editor.setModelMarkers(model, "bugDiagnostics", errors);
    } catch (error) {
      console.error("Error fetching bug diagnostics:", error);
    }
  };

  const registerHoverProvider = (monacoInstance) => {
    monacoInstance.languages.registerHoverProvider(language, {
      provideHover: (model, position) => {
        const markers = monaco.editor.getModelMarkers({ resource: model.uri });
        const hovered = markers.find(marker =>
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
            { value: `**${hovered.severity === monaco.MarkerSeverity.Error ? "Error" : "Warning"}:** ${hovered.message}` },
            { value: fixLink }
          ]
        };
      }
    });
  };

  const registerInlineCompletionsProvider = (monacoInstance) => {
    const langs = monacoInstance.languages.getLanguages();
    langs.forEach((lang) => {
      monacoInstance.languages.registerInlineCompletionsProvider(lang.id, {
        provideInlineCompletions: async (model, position) => {
          const code = model.getValue();
          if (!code) return { items: [] };
          try {
            const response = await axios.post("http://localhost:5000/api/suggestion", {
              code,
              language: normalizeLang(selectedLanguageRef.current)
            });
            let suggestion = response.data.suggestion || "";
            if (!suggestion) return { items: [] };
            return {
              items: [
                {
                  insertText: suggestion,
                  range: new monacoInstance.Range(
                    position.lineNumber,
                    position.column,
                    position.lineNumber,
                    position.column
                  ),
                },
              ],
              dispose: () => { },
            };
          } catch (error) {
            console.error("Error fetching suggestion:", error);
            return { items: [] };
          }
        },
        handleItemDidShow: () => { },
        freeInlineCompletions: () => { },
      });
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
      run: () => { handleBugFix(); }
    });
    editor.onDidChangeModelContent(() => {
      const model = editor.getModel();
      if (model) {
        updateBugMarkers(model);
        setTimeout(() => {
          editor.trigger("keyboard", "editor.action.inlineSuggest.trigger");
        }, 300);
      }
    });
    setTimeout(() => {
      editor.trigger("keyboard", "editor.action.inlineSuggest.trigger");
      const model = editor.getModel();
      if (model) updateBugMarkers(model);
    }, 1500);
    const bugInterval = setInterval(() => {
      const model = editor.getModel();
      if (model) updateBugMarkers(model);
    }, 10000);
    editor.onDidDispose(() => {
      clearInterval(bugInterval);
    });
  };

  return (
    <div className="flex flex-col md:flex-row justify-center gap-8 p-4">
      <div className="flex-1 md:w-[70%]">
        <div className="flex flex-wrap justify-between gap-4 mb-4">
          <div className="w-full md:w-64">
            <Select
              options={languageOptions}
              value={languageOptions.find((opt) => opt.value === language)}
              onChange={handleLanguageChange}
              placeholder="Select Language"
              styles={customStyles}
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
              styles={customStyles}
              onChange={handleThemeChange}
            />
          
          </div>
        </div>
        <div className="relative rounded-md overflow-hidden shadow-lg bg-black">
          <Editor
            height="85vh"
            width="100%"
            language={language}
            value={value}
            theme={theme}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{ inlineSuggest: { enabled: true }, tabCompletion: "on" }}
          />
        </div>
      </div>
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <textarea
            rows="10"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Custom input"
            className="focus:outline-none text-white w-full border-2 border-white rounded-md shadow-md hover:shadow-lg px-4 py-2 bg-black transition-all duration-300"
          />
          <OutputSection output={output} />
        </div>
        <div className="text-white text-sm flex flex-col gap-2 mb-4">
          <div><span className="font-bold">Status:</span> {status}</div>
          <div><span className="font-bold">Time Taken:</span> {timeTaken} seconds</div>
          <div><span className="font-bold">Memory Used:</span> {memoryUsed} KB</div>
        </div>
        <button
          className="bg-white text-black rounded-md px-6 py-2 transition-all duration-300 transform hover:bg-gray-200 shadow-md hover:shadow-lg"
          onClick={handleRunCode}
        >
          Run
        </button>
        <button
          className="bg-green-500 text-white rounded-md px-6 py-2 transition-all duration-300 transform hover:bg-green-400 shadow-md hover:shadow-lg"
          onClick={handleBugFix}
        >
          Fix Code
        </button>
      </div>
    </div>
  );
}
