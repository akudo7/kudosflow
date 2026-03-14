/**
 * send-a2a-message.ts
 *
 * CLI script to send a message to a running A2A server and print the response.
 *
 * Usage:
 *   cd /Users/akirakudo/Desktop/MyWork/VSCode/kudosflow && \
 *   npx tsx scripts/send-a2a-message.ts \
 *     --url http://localhost:3011 \
 *     --message "Please create a task list" \
 *     [--timeout 120000] \
 *     [--output text|json]
 */

import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

// Parse CLI arguments
function parseArgs(argv: string[]): {
  url: string;
  message: string;
  timeout: number;
  output: 'text' | 'json';
} {
  const args = argv.slice(2);
  let url = '';
  let message = '';
  let timeout = 60000;
  let output: 'text' | 'json' = 'text';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
      url = args[++i];
    } else if (args[i] === '--message' && args[i + 1]) {
      message = args[++i];
    } else if (args[i] === '--timeout' && args[i + 1]) {
      timeout = parseInt(args[++i], 10);
    } else if (args[i] === '--output' && args[i + 1]) {
      const val = args[++i];
      if (val === 'json' || val === 'text') output = val;
    }
  }

  if (!url) {
    console.error('Error: --url is required');
    process.exit(1);
  }
  if (!message) {
    console.error('Error: --message is required');
    process.exit(1);
  }

  return { url, message, timeout, output };
}

/**
 * Simple HTTP/HTTPS POST request helper (no external dependencies)
 */
function httpPost(urlStr: string, body: object, timeoutMs: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const bodyStr = JSON.stringify(body);

    const options: http.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port) : (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr)
      },
      timeout: timeoutMs
    };

    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    });

    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

/**
 * Extract plain text from the workflow execution result
 */
function extractText(response: any): string {
  // JSON-RPC response
  if (response.result) {
    const r = response.result;
    // result.result.messages (typical WorkflowEngine output)
    if (r.result?.messages && Array.isArray(r.result.messages)) {
      const last = r.result.messages[r.result.messages.length - 1];
      if (last?.content) return last.content;
    }
    // result.messages
    if (r.messages && Array.isArray(r.messages)) {
      const last = r.messages[r.messages.length - 1];
      if (last?.content) return last.content;
    }
    // result as string
    if (typeof r === 'string') return r;
  }

  // REST response
  if (response.result?.messages && Array.isArray(response.result.messages)) {
    const last = response.result.messages[response.result.messages.length - 1];
    if (last?.content) return last.content;
  }
  if (response.messages && Array.isArray(response.messages)) {
    const last = response.messages[response.messages.length - 1];
    if (last?.content) return last.content;
  }

  // Fallback to JSON
  return JSON.stringify(response, null, 2);
}

async function main() {
  const { url, message, timeout, output } = parseArgs(process.argv);

  // Normalize base URL (strip trailing slash)
  const baseUrl = url.replace(/\/$/, '');
  const endpoint = `${baseUrl}/message/send`;

  console.error(`Sending message to: ${endpoint}`);

  const body = {
    message: {
      parts: [{ type: 'text', text: message }]
    }
  };

  let response: any;
  try {
    response = await httpPost(endpoint, body, timeout);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  if (output === 'json') {
    console.log(JSON.stringify(response, null, 2));
  } else {
    console.log(extractText(response));
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
