'use client';
import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import Select from "react-select";
import monacoThemes from "monaco-themes/themes/themelist";
import { defineTheme } from "./themes";
import { languageOptions } from "./language";
import OutputSection from "./output";
import useKeyPress from "@/hooks/keypress";
import axios from "axios";

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
    const isCtrlEnterPressed = useKeyPress(["Ctrl", "Enter"]);

    const handleEditorChange = (newValue) => {
        setValue(newValue);
        onChange && onChange("code", newValue);
    };

    const handleLanguageChange = (selectedOption) => {
        setLanguage(selectedOption.value);
    };

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
                    language_id: languageOptions.find((opt) => opt.value === language)?.id || 63,
                    stdin: customInput,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
                        "x-rapidapi-key": "2828e8221amshd5adc8be0b83e95p1a4e10jsn8cc8a019ac9a", // Replace with your key
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
                            "x-rapidapi-key": "2828e8221amshd5adc8be0b83e95p1a4e10jsn8cc8a019ac9a",
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
                    ></textarea>
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
            </div>
        </div>
    );
}
