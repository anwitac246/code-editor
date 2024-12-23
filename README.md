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

![Code Editor Example](![image](https://github.com/user-attachments/assets/efad8fdc-5d7a-4c2a-84b4-f156d5844f13)
)

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
