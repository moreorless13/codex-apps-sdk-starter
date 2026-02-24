// Prompt pipeline: simple string builder + summary inject
// In real projects you’d compose @openai/codex-sdk pipelines.
export function buildTodoPrompt(context, summary) {
  return [
    '## Agent workflow prompt (demo)',
    '- You are a small agent managing a todo list for the user.',
    '- Keep responses short and actionable.',
    '',
    `Context: ${context}`,
    `Current todo list:\n${summary || '(no todos)'}`,
  ].join('\n');
}
