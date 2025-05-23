import React, { useRef } from 'react';
import { FiCopy, FiTrash2 } from 'react-icons/fi';

export default function OutputSection({ output, onClear }) {
  const preRef = useRef();

  const handleCopy = () => {
    if (preRef.current) {
      navigator.clipboard.writeText(preRef.current.innerText);
    }
  };

  return (
    <div className="mt-6 bg-gradient-to-br from-gray-800 to-gray-900 text-gray-100 rounded-2xl shadow-xl border border-gray-700 p-4 flex flex-col">

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-medium">Output</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-gray-700 transition"
            title="Copy to clipboard"
          >
            <FiCopy size={18} />
          </button>
          <button
            onClick={onClear}
            className="p-2 rounded-lg hover:bg-gray-700 transition"
            title="Clear output"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 bg-gray-900 rounded-lg p-4 overflow-auto font-mono text-sm leading-relaxed
                   scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      >
        <pre ref={preRef} className="whitespace-pre-wrap">
          {output || 'No output yet.'}
        </pre>
      </div>
    </div>
  );
}
