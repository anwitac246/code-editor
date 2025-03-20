const filesData = {
    id: 1,
    type: "folder",
    name: "root",
    children: [
      {
        id: 2,
        type: "folder",
        name: "src",
        children: [
          {
            id: 3,
            type: "file",
            name: "main.py",
            data: "# Start coding in Python\nprint('Hello, world!')",
          },
          {
            id: 4,
            type: "folder",
            name: "components",
            children: [
              {
                id: 5,
                type: "file",
                name: "Button.jsx",
                data: "// React component\nexport default function Button() {\n  return <button>Click Me</button>;\n}",
              },
            ],
          },
        ],
      },
      {
        id: 6,
        type: "file",
        name: "README.md",
        data: "# Project Documentation\nWelcome to your project!",
      },
    ],
  };
  
  export default filesData;
  