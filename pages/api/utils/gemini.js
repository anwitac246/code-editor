import axios from 'axios';

export async function generateGeminiContent(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }

  if (!prompt) {
    throw new Error('Prompt is required');
  }

  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        contents: [{ parts: [{ text: prompt }] }],
      },
      {
        params: { key: apiKey },
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const result = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!result) {
      throw new Error('No suggestion returned by Gemini API');
    }
    return result;
  } catch (error) {
    console.error('Error calling Gemini API:', error.response?.data || error.message);
    throw new Error(`Gemini API error: ${error.response?.data?.error?.message || error.message}`);
  }
}