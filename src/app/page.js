'use client';
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
  
      <div className="px-6 py-4 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
        <h1 className="text-white text-3xl font-bold">Online Compiler</h1>
      </div>


     
        <CodeEditorWindow
          onChange={handleCodeChange}
          code={code}
          theme={theme}
          initialLanguage="cpp"
        />
    

      
    </div>
  );
}
