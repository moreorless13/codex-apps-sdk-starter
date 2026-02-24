# Codex Apps SDK starter

Minimal, runnable starter for prototyping with the OpenAI Apps SDK using MCP (server + optional UI).

## Quick start

```bash
npm install
node server.js
```

The MCP server listens on http://localhost:8787/mcp

## Test locally

```bash
npx @modelcontextprotocol/inspector@latest --server-url http://localhost:8787/mcp --transport http
```

## Connect to ChatGPT
- Expose the server to the public internet (example: `ngrok http 8787`) and use `https://<subdomain>.ngrok.app/mcp`
- Enable developer mode in ChatGPT and add a connector pointed at the MCP endpoint.

## Agent workflow (tiny example)
1. Add a todo
2. Complete a todo
3. Persist/return the updated list back to the UI

## Prompt pipeline (example)
1. Restate goal in one sentence
2. Enumerate steps
3. Call the right tool(s) with validated arguments
4. Confirm and summarize outputs
5. Stop when done
