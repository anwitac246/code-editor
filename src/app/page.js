'use client'
import React, { useState } from "react";
import CodeEditorWindow from "@/components/code_window";

export default function Home() {
  const [code, setCode] = useState("// Start typing your code here...");
  const [theme, setTheme] = useState("vs-dark");

  const handleCodeChange = (type, newCode) => {
    if (type === "code") {
      setCode(newCode);
    }
  };

  return (
    <div>
      <h1 className="text-left font-bold text-2xl m-4">Online Compiler</h1>
      <CodeEditorWindow
        onChange={handleCodeChange}
        code={code}
        theme={theme}
        initialLanguage="C++"
      />
    </div>
  );
}
