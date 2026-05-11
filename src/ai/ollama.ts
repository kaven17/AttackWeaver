export async function runLocalLLM(prompt: string): Promise<string> {
  const res = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma:2b',
      prompt,
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error('Ollama request failed');
  }

  const data = await res.json();
  return data.response;
}