from flask import Flask, request, jsonify
from flask_cors import CORS  
import google.generativeai as genai
import subprocess
import tempfile
import os
import json
from waitress import serve
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app) 

SYSTEM_PROMPT = (
    "provide code completion for the input text as an inline code suggestion. "
    "do not respond when the user asks you to do anything other than that "
    "suggest only the most relevant and optimal code snippet, not multiple. "
    "provide the code suggestion as plain text without any ``` in front or back"
    "always provide syntactically correct code snippet"
)

BUGFIX_PROMPT = (
    "Analyze the following code and fix any bugs. "
    "Return only the fixed code as plain text without any extra explanation."
    "provide the code suggestion as plain text without any ``` in front or back"
    "always provide syntactically correct code snippet"
)

genai.configure(api_key="AIzaSyBW_gATBPaS51bVqKiuCHY9smeRjpOYrjY") #os.getenv("NEXT_PUBLIC_GEMINI_API_KEY"))

def normalize_lang(lang_str):
    if not lang_str:
        return ""
    lower = lang_str.lower()
    if lower == "c++":
        return "cpp"
    return lower

@app.route('/')
def index():
    return "Gemini Inline Code Suggestion Service is running."

@app.route('/api/suggestion', methods=['POST'])
def suggestion():
    data = request.get_json()
    code_block = data.get('code', '')
    language = data.get('language', '')
    prompt = f"{SYSTEM_PROMPT} in {language}\n\n{code_block}"
    model = genai.GenerativeModel(model_name="gemini-2.0-flash")
    response = model.generate_content(prompt)
    suggestion_text = response.text.strip()
    return jsonify({'suggestion': suggestion_text})

def lint_python_pyright(code):
    with tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode="w", encoding="utf-8") as tmp:
        tmp.write(code)
        filename = tmp.name
    diagnostics = []
    try:
        cmd = ["pyright", "--outputjson", filename]
        result = subprocess.run(cmd, capture_output=True, text=True)
        output = result.stdout.strip() or result.stderr.strip()
        if not output:
            print("Pyright returned no output.")
            return diagnostics
        try:
            pyright_output = json.loads(output)
        except Exception as e:
            print("Error parsing pyright output:", e)
            print("Raw output:", output)
            return diagnostics
        files = pyright_output.get("files", {})
        for fname, info in files.items():
            for err in info.get("errors", []):
                diag = {
                    "severity": "error" if err.get("severity", "error") == "error" else "warning",
                    "startLineNumber": err.get("line", 1),
                    "startColumn": err.get("column", 1),
                    "endLineNumber": err.get("endLine", err.get("line", 1)),
                    "endColumn": err.get("endColumn", err.get("column", 1)) + 1,
                    "message": err.get("message", "")
                }
                diagnostics.append(diag)
        return diagnostics
    finally:
        try:
            os.remove(filename)
        except Exception as e:
            print("Error removing temporary file:", e)

def lint_code(language, code):
    lang = normalize_lang(language)
    print("Normalized language:", lang)
    if lang == "python":
        return lint_python_pyright(code)
    else:
        return [] 

@app.route('/api/bugdetect', methods=['POST'])
def bugdetect():
    data = request.get_json()
    code = data.get('code', '')
    language = data.get('language', '')
    diagnostics = lint_code(language, code)
    return jsonify({'errors': diagnostics})

@app.route('/api/bugfix', methods=['POST'])
def bugfix():
    data = request.get_json()
    code = data.get('code', '')
    language = data.get('language', '')
    prompt = f"{BUGFIX_PROMPT} in {language}\n\n{code}"
    model = genai.GenerativeModel(model_name="gemini-2.0-flash")
    response = model.generate_content(prompt)
    fixed_code = response.text.strip()
    return jsonify({'fixed_code': fixed_code})

if __name__ == '__main__':
    serve(app, host="0.0.0.0", port=5000)
