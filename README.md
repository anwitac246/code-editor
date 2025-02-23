
# Web-Based Code Editor with Auto-Completion and Bug Fixing

This project is a web-based code editor built using the **Monaco Editor**, the same technology powering **Visual Studio Code**. It integrates with the **Judge0 API** to provide real-time code compilation and execution across multiple programming languages. 

Additionally, the editor supports **automatic code completion** and **real-time bug detection and fixing**, enhancing the overall development workflow.

---

## Features

### 1. Interactive Code Editing
- Leverages the **Monaco Editor** for advanced syntax highlighting, IntelliSense, and error detection.
- Supports multiple programming languages compatible with the **Judge0 API**.
- Provides an intuitive interface for an efficient coding experience.

### 2. Code Compilation and Execution
- Uses the **Judge0 API** to compile and execute code in real-time.
- Displays detailed outputs, including:
  - Program output
  - Compilation errors
  - Execution status
  - Time taken and memory usage

### 3. Automatic Code Completion and Bug Fixing
- **Inline Code Completion**: Provides intelligent, real-time suggestions as you type.
- **Bug Detection & Fixing**: Automatically detects code errors and applies suggested fixes with the "Fix Code" feature.
  
### 4. Customizable Themes
- Supports light and dark modes for better visual comfort.
- Ability to load additional themes from the **Monaco Editor's** theme list.

### 5. Responsive Design
- Fully responsive layout, ensuring a seamless experience across desktops, tablets, and mobile devices.

---

## How to Use

1. Write or paste your code into the editor.
2. Select the desired programming language from the language dropdown menu.
3. (Optional) Provide custom input for the program.
4. Click the **Run** button to compile and execute the code using the **Judge0 API**.
5. Use the **Fix Code** button to automatically detect and apply potential bug fixes.
6. View the results in the output panel, including:
   - Program output
   - Compilation errors
   - Execution status
   - Time and memory usage

---

## Technology Stack

- **Frontend**: Next.js, React, Monaco Editor, JavaScript
- **Backend Integration**: Judge0 API (via RapidAPI) for compiling and executing code
- **Environment Management**: dotenv for managing API keys securely

---

## API Usage

The application interacts with the **Judge0 API** for compiling and running code.

### 1. Submitting Code:
- **Endpoint**: `POST /submissions`
- **Purpose**: Sends the user's code and language to Judge0 for compilation and execution.

### 2. Retrieving Results:
- **Endpoint**: `GET /submissions/:token`
- **Purpose**: Fetches the output, errors, and execution statistics.

Ensure the `JUDGE0_API_KEY` is set correctly in the `.env.local` file.

Example `.env.local` file:

```bash
JUDGE0_API_KEY=your_api_key_here
```
=======
# Code Editor with Compilation and Execution Support

This project is a **web-based code editor** built using the [**Monaco Editor**](https://microsoft.github.io/monaco-editor/), a powerful code editing library that powers Visual Studio Code. It integrates with the [**Judge0 API**](https://rapidapi.com/judge0-official/api/judge0-ce/) to provide real-time code compilation and execution capabilities for various programming languages.

## Features
1. **Interactive Code Editing**: 
   - Leverages the Monaco Editor for syntax highlighting, IntelliSense, and a user-friendly code editing experience.
   - Supports multiple programming languages, consistent with Judge0 API's offerings.

2. **Code Compilation and Execution**:
   - Uses the Judge0 API to compile and execute code in real-time.
   - Displays outputs, errors, and execution status directly in the interface.

3. **Customizable Themes**:
   - Includes light and dark themes for user comfort while coding.

4. **Responsive Design**:
   - Works seamlessly across desktop and mobile devices.

## Workflow
1. Write or paste your code into the editor.
2. Select the desired programming language and input custom data if necessary.
3. Hit the **Run** button to send the code to the Judge0 API for compilation and execution.
4. View results in the output panel, including runtime errors, compilation messages, or program output.

---

### Screenshot of the Editor

Below is an example screenshot showcasing the editor interface:

![image](https://github.com/user-attachments/assets/a4d6c181-107a-4a04-be5b-3044b9fb631c)

---

### Technology Stack
- **Frontend**: Monaco Editor, JavaScript/TypeScript, HTML, and CSS.
- **Backend Integration**: Judge0 API (via Rapid API) for compiling and running the code.
- **API Usage**:
  - Sends source code, language selection, and optional input to the Judge0 API.
  - Receives and displays the compiled output or errors.

---

### Future Enhancements
- **User Authentication**: Allow users to save code snippets and track submission history.
- **Real-time Collaboration**: Enable multiple users to collaborate on the same code in real-time.
- **Advanced Debugging Tools**: Provide step-by-step debugging features with breakpoints.

This project is ideal for learning environments, coding competitions, or personal development purposes.
>>>>>>> 8da7b33f61b7a2647d3ec5a65538e76de1bf0c9e
