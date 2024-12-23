import React from 'react';
export default  function OutputSection({ output }){
    return (
      <div
        style={{
          border: '1px solid #ccc',
          padding: '10px',
          marginTop: '20px',
          backgroundColor: '#000000',
          minHeight: '200px',
          fontFamily: 'monospace',
        }}
      >
        <strong className="font-white">Output:</strong>
        <pre className='font-white'>{output}</pre>
      </div>
    );
  };