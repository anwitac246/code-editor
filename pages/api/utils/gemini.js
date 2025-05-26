
export async function generateGeminiContent(prompt) {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY; 
  console.log(apiKey);
  const url = 'https://generativelanguage.googleapis.com/v1beta2/models/gemini-2.0-flash:generateText'; // update if needed

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: { text: prompt },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.output || '';
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return `// Mock Gemini response for prompt:\n${prompt.slice(0, 100)}...`;
  }
}
