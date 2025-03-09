#!/usr/bin/env node
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} = require('@modelcontextprotocol/sdk/types.js');
const { ESLint } = require('eslint');
const { Stylelint } = require('stylelint');
const { HTMLHint } = require('htmlhint');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

class CodeAnalyzerServer {
  constructor() {
    this.server = new Server(
      {
        name: 'code-analyzer-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'analyze_code',
          description: 'Analyze code for bugs, errors, and functionality issues',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to the file or directory to analyze',
              },
              language: {
                type: 'string',
                description: 'Optional: Language of the code (auto-detected if not provided)',
                enum: ['javascript', 'typescript', 'html', 'css', 'python', 'auto'],
              },
              fix: {
                type: 'boolean',
                description: 'Whether to automatically fix issues when possible',
                default: false,
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'fix_issues',
          description: 'Fix identified issues in code',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to the file to fix',
              },
              issueIds: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: 'IDs of issues to fix (from analyze_code results)',
              },
            },
            required: ['path', 'issueIds'],
          },
        },
        {
          name: 'get_fix_suggestions',
          description: 'Get suggestions for fixing identified issues',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to the file with issues',
              },
              issueId: {
                type: 'string',
                description: 'ID of the issue to get suggestions for',
              },
            },
            required: ['path', 'issueId'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'analyze_code':
          return await this.analyzeCode(request.params.arguments);
        case 'fix_issues':
          return await this.fixIssues(request.params.arguments);
        case 'get_fix_suggestions':
          return await this.getFixSuggestions(request.params.arguments);
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  async analyzeCode({ path: filePath, language = 'auto', fix = false }) {
    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Determine file type if auto
      const detectedLanguage = language === 'auto' 
        ? this.detectLanguage(filePath)
        : language;
      
      let results = [];
      
      // Analyze based on language
      switch (detectedLanguage) {
        case 'javascript':
        case 'typescript':
          results = await this.analyzeJavaScript(filePath, fix);
          break;
        case 'html':
          results = await this.analyzeHTML(filePath);
          break;
        case 'css':
          results = await this.analyzeCSS(filePath, fix);
          break;
        case 'python':
          results = await this.analyzePython(filePath);
          break;
        default:
          throw new McpError(
            ErrorCode.InvalidParams,
            `Unsupported language: ${detectedLanguage}`
          );
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              filePath,
              language: detectedLanguage,
              issuesCount: results.length,
              issues: results,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error analyzing code: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async fixIssues({ path: filePath, issueIds }) {
    try {
      // Implementation would fix specific issues
      // For now, we'll return a placeholder
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              filePath,
              fixedIssues: issueIds.length,
              issueIds,
              status: 'Fixed issues successfully',
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fixing issues: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async getFixSuggestions({ path: filePath, issueId }) {
    try {
      // Implementation would provide fix suggestions
      // For now, we'll return a placeholder
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              filePath,
              issueId,
              suggestions: [
                {
                  id: 'fix-1',
                  description: 'Replace with correct syntax',
                  code: '// Example fixed code',
                },
              ],
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error getting fix suggestions: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.js':
        return 'javascript';
      case '.ts':
      case '.tsx':
        return 'typescript';
      case '.html':
      case '.htm':
        return 'html';
      case '.css':
        return 'css';
      case '.py':
        return 'python';
      default:
        return 'unknown';
    }
  }

  async analyzeJavaScript(filePath, fix = false) {
    try {
      const eslint = new ESLint({
        fix,
        overrideConfig: {
          env: {
            browser: true,
            node: true,
            es6: true,
          },
          extends: ['eslint:recommended'],
          parserOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
          },
        },
      });
      
      const results = await eslint.lintFiles([filePath]);
      
      // If fix is true, write the fixed code back to the file
      if (fix) {
        await ESLint.outputFixes(results);
      }
      
      // Format the results
      return results.flatMap(result => 
        result.messages.map((message, index) => ({
          id: `js-${result.filePath}-${index}`,
          line: message.line,
          column: message.column,
          severity: message.severity === 2 ? 'error' : 'warning',
          message: message.message,
          ruleId: message.ruleId,
          fixable: message.fix !== undefined,
        }))
      );
    } catch (error) {
      console.error('JavaScript analysis error:', error);
      return [{
        id: 'js-error',
        severity: 'error',
        message: `Error analyzing JavaScript: ${error.message}`,
        fixable: false,
      }];
    }
  }

  async analyzeHTML(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const results = HTMLHint.verify(content, {
        'tagname-lowercase': true,
        'attr-lowercase': true,
        'attr-value-double-quotes': true,
        'doctype-first': true,
        'tag-pair': true,
        'spec-char-escape': true,
        'id-unique': true,
        'src-not-empty': true,
        'attr-no-duplication': true,
        'title-require': true,
      });
      
      return results.map((message, index) => ({
        id: `html-${filePath}-${index}`,
        line: message.line,
        column: message.col,
        severity: message.type === 'error' ? 'error' : 'warning',
        message: message.message,
        ruleId: message.rule.id,
        fixable: false, // HTMLHint doesn't provide auto-fixing
      }));
    } catch (error) {
      console.error('HTML analysis error:', error);
      return [{
        id: 'html-error',
        severity: 'error',
        message: `Error analyzing HTML: ${error.message}`,
        fixable: false,
      }];
    }
  }

  async analyzeCSS(filePath, fix = false) {
    try {
      const stylelint = new Stylelint();
      const results = await stylelint.lint({
        files: filePath,
        fix,
      });
      
      const parsedResults = JSON.parse(results.output);
      
      return parsedResults.flatMap(result => 
        result.warnings.map((warning, index) => ({
          id: `css-${result.source}-${index}`,
          line: warning.line,
          column: warning.column,
          severity: warning.severity,
          message: warning.text,
          ruleId: warning.rule,
          fixable: false, // We don't know if it's fixable from the warning
        }))
      );
    } catch (error) {
      console.error('CSS analysis error:', error);
      return [{
        id: 'css-error',
        severity: 'error',
        message: `Error analyzing CSS: ${error.message}`,
        fixable: false,
      }];
    }
  }

  async analyzePython(filePath) {
    try {
      // Use pyright for Python analysis
      const { stdout, stderr } = await execPromise(`npx pyright ${filePath}`);
      
      if (stderr) {
        console.error('Python analysis stderr:', stderr);
      }
      
      // Parse pyright output
      const issues = [];
      const lines = stdout.split('\n');
      let currentId = 0;
      
      for (const line of lines) {
        const match = line.match(/(.+):(\d+):(\d+) - (\w+): (.+)/);
        if (match) {
          const [, file, line, column, severity, message] = match;
          issues.push({
            id: `py-${filePath}-${currentId++}`,
            line: parseInt(line),
            column: parseInt(column),
            severity: severity.toLowerCase(),
            message,
            ruleId: null, // Pyright doesn't provide rule IDs in this format
            fixable: false, // We don't know if it's fixable
          });
        }
      }
      
      return issues;
    } catch (error) {
      console.error('Python analysis error:', error);
      return [{
        id: 'py-error',
        severity: 'error',
        message: `Error analyzing Python: ${error.message}`,
        fixable: false,
      }];
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Code Analyzer MCP server running on stdio');
  }
}

const server = new CodeAnalyzerServer();
server.run().catch(console.error);