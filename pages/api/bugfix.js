import { generateGeminiContent } from './utils/gemini';

const BUGFIX_PROMPT = 
  `Analyze the following code and fix any bugs. ` +
  `Return only the fixed code as plain text without any extra explanation. ` +
  `provide the code suggestion as plain text without any \`\`\` in front or back ` +
  `always provide syntactically correct code snippet`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { code = '', language = '' } = req.body;
    const prompt = `${BUGFIX_PROMPT} in ${language}\n\n${code}`;
    const fixedCode = await generateGeminiContent(prompt);
    res.status(200).json({ fixed_code: fixedCode.trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
