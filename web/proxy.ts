import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MARKDOWN_PAGES: Record<string, string> = {
  "/": `# Prompt Later

> Let agents test your code in a real browser.

Prompt Later is a CLI tool that lets coding agents (Claude Code, Codex CLI, Cursor) automatically test code changes in a real browser.

## How it works

1. Run \`npx prompt-later\` in your terminal
2. Prompt Later scans your unstaged git changes or branch diff
3. An AI agent generates a test plan describing how to validate the changes
4. You review and approve the plan in an interactive TUI
5. The agent executes the test plan against a live browser instance
6. Results are displayed with pass/fail status and session recordings

## Links

- [Privacy Policy](/privacy)
- [Terms of Service](/terms)
- [Security Policy](/security)

## Installation

\`\`\`bash
npx prompt-later
\`\`\`

## Contact

- https://github.com/brahimhamichan/prompt-later/issues
`,

  "/privacy": `# Privacy Policy

Last updated Dec 13, 2025

Prompt Later ("Prompt Later", "we" or "us") maintains strong commitment to respecting privacy and securing shared information. This Privacy Policy explains how the company collects, uses, discloses, and processes personal data when using Prompt Later's software, platform, APIs, Documentation, and related tools, including the website, and all related software for building, deploying, hosting, and managing software projects ("Service").

For the full privacy policy, visit [https://prompt-later.pages.dev/privacy](https://prompt-later.pages.dev/privacy).

## Contact

- https://github.com/brahimhamichan/prompt-later/issues
`,

  "/terms": `# Terms of Service

Last updated Dec 13, 2025

These Terms of Service govern your access to and use of Prompt Later's software, platform, APIs, Documentation, and related tools, including the website, and all related software made available by Prompt Later to build, deploy, host, and manage software projects ("Service").

For the full terms of service, visit [https://prompt-later.pages.dev/terms](https://prompt-later.pages.dev/terms).

## Contact

- https://github.com/brahimhamichan/prompt-later/issues
`,

  "/security": `# Security Policy

Thank you for helping us keep Prompt Later secure!

## Reporting Security Issues

The security of our systems and user data is our top priority. We appreciate the work of security researchers acting in good faith in identifying and reporting potential vulnerabilities.

Please report any security issues to https://github.com/brahimhamichan/prompt-later/issues.
`,
};

export const proxy = (request: NextRequest) => {
  const accept = request.headers.get("accept") ?? "";
  const pathname = request.nextUrl.pathname;

  if (accept.includes("text/markdown") && pathname in MARKDOWN_PAGES) {
    return new NextResponse(MARKDOWN_PAGES[pathname], {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        Vary: "Accept",
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("Vary", "Accept");
  return response;
};

export const config = {
  matcher: ["/", "/privacy", "/terms", "/security"],
};
