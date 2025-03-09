# Code Analyzer MCP Server

This MCP server provides tools to analyze code for bugs, errors, and functionality issues in both front-end and back-end code, with options to fix them.

## Features

- Analyze JavaScript/TypeScript code using ESLint
- Analyze HTML code using HTMLHint
- Analyze CSS code using Stylelint
- Analyze Python code using Pyright
- Automatically fix issues when possible
- Get suggestions for fixing identified issues

## Available Tools

### 1. analyze_code

Analyzes code for bugs, errors, and functionality issues.

**Parameters:**
- `path` (required): Path to the file or directory to analyze
- `language` (optional): Language of the code (auto-detected if not provided)
  - Options: 'javascript', 'typescript', 'html', 'css', 'python', 'auto'
- `fix` (optional): Whether to automatically fix issues when possible (default: false)

**Example:**
```javascript
use_mcp_tool({
  server_name: "code-analyzer-server",
  tool_name: "analyze_code",
  arguments: {
    path: "/path/to/your/file.js",
    language: "javascript",
    fix: true
  }
});
```

### 2. fix_issues

Fixes identified issues in code.

**Parameters:**
- `path` (required): Path to the file to fix
- `issueIds` (required): Array of issue IDs to fix (from analyze_code results)

**Example:**
```javascript
use_mcp_tool({
  server_name: "code-analyzer-server",
  tool_name: "fix_issues",
  arguments: {
    path: "/path/to/your/file.js",
    issueIds: ["js-/path/to/your/file.js-0", "js-/path/to/your/file.js-1"]
  }
});
```

### 3. get_fix_suggestions

Gets suggestions for fixing identified issues.

**Parameters:**
- `path` (required): Path to the file with issues
- `issueId` (required): ID of the issue to get suggestions for

**Example:**
```javascript
use_mcp_tool({
  server_name: "code-analyzer-server",
  tool_name: "get_fix_suggestions",
  arguments: {
    path: "/path/to/your/file.js",
    issueId: "js-/path/to/your/file.js-0"
  }
});
```

## Usage Examples

### Analyzing JavaScript Code

```javascript
use_mcp_tool({
  server_name: "code-analyzer-server",
  tool_name: "analyze_code",
  arguments: {
    path: "/path/to/your/file.js"
  }
});
```

### Analyzing and Automatically Fixing JavaScript Code

```javascript
use_mcp_tool({
  server_name: "code-analyzer-server",
  tool_name: "analyze_code",
  arguments: {
    path: "/path/to/your/file.js",
    fix: true
  }
});
```

### Analyzing HTML Code

```javascript
use_mcp_tool({
  server_name: "code-analyzer-server",
  tool_name: "analyze_code",
  arguments: {
    path: "/path/to/your/file.html",
    language: "html"
  }
});
```

### Analyzing CSS Code

```javascript
use_mcp_tool({
  server_name: "code-analyzer-server",
  tool_name: "analyze_code",
  arguments: {
    path: "/path/to/your/file.css",
    language: "css"
  }
});
```

### Analyzing Python Code

```javascript
use_mcp_tool({
  server_name: "code-analyzer-server",
  tool_name: "analyze_code",
  arguments: {
    path: "/path/to/your/file.py",
    language: "python"
  }
});
```

## Installation

The server has been installed and configured in your MCP settings. To use it, simply restart your VSCode or Claude application to load the new MCP server.