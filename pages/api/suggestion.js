import { generateGeminiContent } from './utils/gemini';

const SYSTEM_PROMPT = 
  `provide code completion for the input text as an inline code suggestion. ` +
  `do not respond when the user asks you to do anything other than that ` +
  `suggest only the most relevant and optimal code snippet, not multiple. ` +
  `provide the code suggestion as plain text without any \`\`\` in front or back ` +
  `always provide syntactically correct code snippet`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { code = '', language = '' } = req.body;
    const prompt = `${SYSTEM_PROMPT} in ${language}\n\n${code}`;
    const suggestion = await generateGeminiContent(prompt);
    res.status(200).json({ suggestion: suggestion.trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
