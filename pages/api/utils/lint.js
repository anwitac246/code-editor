import { execFile } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

function normalizeLang(lang) {
  if (!lang) return '';
  const lower = lang.toLowerCase();
  if (lower === 'c++') return 'cpp';
  return lower;
}

export async function lintPythonPyright(code) {
  const tmpFilePath = path.join(process.cwd(), `tmp_pyright_${Date.now()}.py`);
  await fs.writeFile(tmpFilePath, code, 'utf8');

  return new Promise((resolve) => {
    execFile('pyright', ['--outputjson', tmpFilePath], (error, stdout, stderr) => {
      fs.unlink(tmpFilePath).catch(() => {});
      if (error && !stdout) {
        console.error('Pyright execution error:', error);
        return resolve([]);
      }
      const output = stdout || stderr;
      if (!output) {
        console.log('Pyright returned no output.');
        return resolve([]);
      }
      try {
        const pyrightOutput = JSON.parse(output);
        const diagnostics = [];
        if (pyrightOutput.files) {
          for (const fname in pyrightOutput.files) {
            const info = pyrightOutput.files[fname];
            for (const err of info.errors || []) {
              diagnostics.push({
                severity: err.severity === 'error' ? 'error' : 'warning',
                startLineNumber: err.line || 1,
                startColumn: err.column || 1,
                endLineNumber: err.endLine || err.line || 1,
                endColumn: (err.endColumn || err.column || 1) + 1,
                message: err.message || '',
              });
            }
          }
        }
        resolve(diagnostics);
      } catch (parseErr) {
        console.error('Error parsing pyright output:', parseErr);
        console.error('Raw output:', output);
        resolve([]);
      }
    });
  });
}

export async function lintCode(language, code) {
  const lang = normalizeLang(language);
  if (lang === 'python') {
    return await lintPythonPyright(code);
  }
  return [];
}
