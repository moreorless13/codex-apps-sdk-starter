import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import cors from 'cors';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';

import { buildTodoPrompt } from './prompt-pipeline.js';

// simple in-memory store - replace with your DB of choice
const todos = [];

export function createServer() {
  const server = new McpServer({
    name: 'Codex Apps SDK starter',
    version: '0.1.0',
  });

  const resourceUri = 'ui://todo/todo-widget.html';

  registerAppTool(
    server,
    'todo',
    {
      title: 'Todo demo',
      description: 'List / add todos via MCP tool. The UI renders in the chat.',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'add'] },
          title: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['action'],
        additionalProperties: false,
      },
      _meta: {
        ui: {
          resourceUri,
          // Allow loading the ext-apps App SDK from unpkg.
          csp: "default-src 'self'; script-src 'self' https://unpkg.com; connect-src 'self'; style-src 'self' 'unsafe-inline';",
        },
      },
    },
    async ({ arguments: args }) => {
      const action = args.action ?? 'list';
      if (action === 'add') {
        const title = args.title ?? args.text ?? 'Untitled';
        todos.push({
          id: String(Date.now()),
          title,
          createdAt: new Date().toISOString(),
        });
      }

      const summary = todos.map((t) => `- ${t.title} (${t.createdAt})`).join('\n');
      const agentPrompt = buildTodoPrompt('User asked for todo list updates', summary);

      return {
        // Fallback for hosts without MCP Apps support.
        content: [
          {
            type: 'text',
            text: `${agentPrompt}\n\nCurrent todos:\n${summary || '(none yet)'}`,
          },
        ],
      };
    },
  );

  registerAppResource(
    server,
    resourceUri,
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const html = await fs.readFile(path.join(import.meta.dirname, 'public', 'todo-widget.html'), 'utf-8');
      return {
        contents: [{ uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html }],
      };
    },
  );

  return server;
}

export async function start() {
  const port = parseInt(process.env.PORT ?? '8787', 10);

  const app = createMcpExpressApp({ host: '0.0.0.0' });
  app.use(cors());
  app.use(express.json());

  app.all('/mcp', async (req, res) => {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('MCP error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  });

  const httpServer = app.listen(port, () => {
    console.log(`MCP server listening on http://localhost:${port}/mcp`);
  });

  process.on('SIGINT', () => httpServer.close(() => process.exit(0)));
  process.on('SIGTERM', () => httpServer.close(() => process.exit(0)));
}

if (import.meta.main) {
  start();
}
