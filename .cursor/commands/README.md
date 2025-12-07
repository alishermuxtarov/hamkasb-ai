# Cursor Slash Commands

Professional, universal slash commands for enhanced AI assistant capabilities. All commands are technology-agnostic and follow industry best practices.

## 📋 Available Commands

### Development Process Commands

#### `/expert-mode` — Professional Expert Mode
**Purpose:** Enables professional-grade approach to problem-solving with emphasis on quality, communication, and best practices.

**Key Features:**
- Deep understanding and root cause analysis
- Balance between simplicity and quality (SOLID, DRY, KISS)
- Proactive questioning when requirements are unclear
- Comprehensive quality checklist
- Structured documentation of decisions

**When to use:** For any serious development task requiring professional approach.

**Usage:**
```
/expert-mode
Implement user authentication system
```

---

#### `/use-docs` — Documentation-First Mode
**Purpose:** Ensures AI consults current official documentation before using libraries, frameworks, and tools.

**Key Features:**
- Prioritizes official documentation over training knowledge
- Uses Context7 for library-specific documentation
- Checks for API changes and deprecations
- Documents sources consulted
- Hierarchical source authority system

**When to use:** When working with external libraries, frameworks, or when API accuracy is critical.

**Usage:**
```
/use-docs
How do I implement middleware in this framework?
```

---

#### `/research` — Deep Research Mode
**Purpose:** Conducts thorough research of industry best practices and standards before making technical decisions.

**Key Features:**
- Systematic research methodology (5-step process)
- Analyzes 3-5 authoritative sources minimum
- Identifies industry consensus
- Compares alternatives with trade-offs
- Documents research findings and decision rationale

**When to use:** For architectural decisions, choosing between alternatives, security/compliance, or complex technical problems.

**Usage:**
```
/research
What's the best approach for distributed caching in 2024?
```

---

### Git & Version Control Commands

#### `/commit` — Generate Commit Message
**Purpose:** Generate professional, detailed commit message following Conventional Commits specification.

**Key Features:**
- Analyzes git changes (staged and unstaged)
- Reviews conversation context
- Follows Conventional Commits format
- Provides detailed body and footer when appropriate
- Ensures proper type, scope, and description

**When to use:** After completing work and before committing changes.

**Usage:**
```
/commit
```

**Output:** Plain text commit message ready to use.

---

#### `/mr` — Generate Merge Request Description
**Purpose:** Generate comprehensive merge/pull request description based on branch commits and diff.

**Key Features:**
- Analyzes all commits in branch vs base branch
- Reviews git diff comprehensively
- Provides structured description with multiple sections
- Includes impact analysis and testing information
- Documents breaking changes and migration steps

**When to use:** Before creating a merge/pull request.

**Usage:**
```
/mr
```

Or specify base branch:
```
/mr (compare against develop branch)
```

**Output:** Formatted markdown description ready for MR/PR.

---

## 🎯 Command Combinations

Commands can be combined for powerful workflows:

### For Complex Features
```
/expert-mode /use-docs /research
Design and implement a caching layer with optimal patterns
```

### For Library Integration
```
/expert-mode /use-docs
Integrate payment gateway using their SDK
```

### For Architectural Decisions
```
/expert-mode /research
Choose database migration strategy for zero-downtime deployments
```

### Complete Feature Workflow
```
1. /expert-mode /use-docs /research
   [Develop feature]

2. /commit
   [Get commit message]

3. /mr
   [Get MR description]
```

---

## ✨ Design Principles

These commands are designed to be:

### Universal
- ✅ **Language agnostic** — Python, JavaScript, Java, Go, Rust, C#, PHP, Ruby, etc.
- ✅ **Framework agnostic** — Any web framework, ORM, testing framework, etc.
- ✅ **Project agnostic** — Web, mobile, desktop, embedded, data science, DevOps
- ✅ **Team agnostic** — Startups, enterprises, open source, freelance

### Professional
- ✅ Based on industry best practices
- ✅ Follows international standards
- ✅ Encourages proper documentation
- ✅ Promotes code quality and maintainability

### Research-Driven
- ✅ Uses current official documentation (Context7)
- ✅ Performs web research for best practices
- ✅ Analyzes multiple authoritative sources
- ✅ Makes informed, justified decisions

---

## 📚 Command Reference Quick Guide

| Command | Purpose | Output Type | Key Use Case |
|---------|---------|-------------|--------------|
| `/expert-mode` | Professional approach | Enhanced behavior | Any serious task |
| `/use-docs` | Check documentation | Enhanced behavior | Library/framework work |
| `/research` | Industry best practices | Enhanced behavior | Technical decisions |
| `/commit` | Commit message | Plain text | Before committing |
| `/mr` | MR/PR description | Markdown text | Before creating MR/PR |

---

## 🔧 Configuration

### For `/commit` Command
No configuration needed. Automatically analyzes:
- Staged changes (`git diff --staged`)
- Unstaged changes (`git diff`)
- Conversation context

### For `/mr` Command
Default base branch: `main`

To specify different base branch, mention it:
```
/mr (compare against develop)
/mr (base branch: staging)
```

---

## 💡 Best Practices

### When to Use Each Command

**Use `/expert-mode`:**
- Starting any non-trivial task
- When quality and professionalism matter
- When you want AI to ask clarifying questions

**Use `/use-docs`:**
- Working with external libraries
- Uncertain about API usage
- Implementing framework-specific features

**Use `/research`:**
- Making architectural decisions
- Choosing between alternatives
- Working with security/compliance
- Solving complex technical problems

**Use `/commit`:**
- After completing a logical unit of work
- Before pushing changes
- When you want a well-structured commit message

**Use `/mr`:**
- Before creating merge/pull request
- When ready to submit work for review
- Want comprehensive description of all changes

### Combining Commands

Start with development commands, end with git commands:
```
1. /expert-mode /use-docs    - During development
2. /commit                    - After completing work
3. /mr                        - Before creating PR
```

---

## 📖 Examples

### Example 1: New Feature
```bash
# Development
> /expert-mode /use-docs
> Implement OAuth2 authentication

[AI develops feature with documentation references]

# Commit
> /commit

Output:
feat(auth): Add OAuth2 authentication support

Implement OAuth2 2.0 authorization code flow with PKCE...

# Merge Request
> /mr

Output:
## Summary
Implements OAuth2 authentication with support for...
```

### Example 2: Bug Fix
```bash
# Investigation & Fix
> /expert-mode
> Fix race condition in payment processing

[AI analyzes and fixes issue]

# Commit
> /commit

Output:
fix(payments): Resolve race condition in concurrent requests

Added pessimistic locking to prevent...

# Merge Request
> /mr

Output:
## Summary
Fixes critical race condition that caused duplicate charges...
```

### Example 3: Research-Based Decision
```bash
# Research
> /research
> What's the best approach for API versioning?

[AI researches and presents options]

# Implementation
> /expert-mode /use-docs
> Implement the recommended versioning approach

# Documentation
> /commit
> /mr
```

---

## 🔄 Updates & Version History

### Version 2.0 (Current) - November 2024
- Complete rewrite for universal applicability
- Changed language to English for international teams
- Removed all project-specific references
- Added `/commit` and `/mr` commands
- Enhanced with industry-standard practices
- Added structured methodologies
- Improved documentation and examples

### Version 1.0 - Initial Release
- Basic commit message generation
- Project-specific commands

---

## 🤝 Contributing

These commands follow industry best practices. If you want to suggest improvements:

1. Research current best practices
2. Ensure suggestions remain universal
3. Provide examples and justification
4. Keep it framework/language agnostic

---

## 📞 Support

For issues or questions about commands:
- Check examples in this README
- Review individual command files for detailed guidance
- Ensure you're using commands as documented

---

*These commands transform the AI assistant into a professional colleague who researches, asks questions, makes informed decisions based on current industry standards, and produces high-quality documentation.*
