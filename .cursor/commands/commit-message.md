# 📝 Generate Commit Message

Generate a professional, detailed commit message in English based on git changes and conversation context.

## 🎯 Core Objective

Analyze git changes (staged and unstaged) and conversation history to create a commit message that clearly communicates:
- **What** changed
- **Why** it changed
- **How** it impacts the system

## 📋 Commit Message Structure

### Format: Conventional Commits
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Type Categories

**Primary types:**
- `feat`: New feature for the user
- `fix`: Bug fix for the user
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code change that neither fixes bug nor adds feature
- `perf`: Performance improvement
- `test`: Adding/updating tests
- `build`: Changes to build system or dependencies
- `ci`: Changes to CI/CD configuration
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

### Subject Line (First Line)

**Requirements:**
- Maximum 72 characters
- Use imperative mood ("Add feature" not "Added feature")
- No period at the end
- Capitalize first letter
- Be specific and descriptive

**Examples:**
```
✅ feat: Add user authentication with JWT tokens
✅ fix: Resolve race condition in payment processing
✅ refactor: Extract validation logic into separate module
❌ feat: Updates (too vague)
❌ Fixed bug (not imperative, no type prefix)
```

### Body (Optional but Recommended)

**Include when:**
- Change is non-trivial
- Context or reasoning needs explanation
- Multiple files or concerns involved
- Breaking changes present

**Guidelines:**
- Wrap at 72 characters per line
- Separate from subject with blank line
- Explain **what** and **why**, not **how**
- Use bullet points for multiple points
- Reference conversation context when relevant

### Footer (Optional)

**Use for:**
- Breaking changes: `BREAKING CHANGE: <description>`
- Issue references: `Fixes #123`, `Closes #456`, `Refs #789`
- Co-authors: `Co-authored-by: Name <email>`
- Other metadata as needed

## 🔍 Analysis Process

### 1. Examine Git Changes
- Run `git status` to see changed files
- Review `git diff` for actual changes
- Check both staged and unstaged changes
- Identify patterns (new files, deletions, modifications)

### 2. Review Conversation Context
- What problem was being solved?
- What decisions were made?
- Were there any trade-offs discussed?
- Any important technical details mentioned?

### 3. Determine Commit Type
- New functionality → `feat`
- Bug resolution → `fix`
- Code improvement → `refactor`
- Performance boost → `perf`
- Documentation → `docs`
- Tests → `test`

### 4. Identify Scope (if applicable)
- Module/component affected (e.g., `auth`, `api`, `database`)
- Keep it short and meaningful
- Use when it adds clarity

### 5. Craft the Message
- Write concise subject line
- Add detailed body if needed
- Include footer for breaking changes or references

## 📊 Message Quality Checklist

Before finalizing, verify:

- [ ] Follows Conventional Commits format
- [ ] Subject line ≤ 72 characters
- [ ] Uses imperative mood
- [ ] Type prefix is accurate
- [ ] Description is specific, not generic
- [ ] Body explains **why**, not just **what**
- [ ] Breaking changes clearly marked
- [ ] No spelling or grammar errors
- [ ] Readable by someone unfamiliar with the work

## 💡 Examples

### Example 1: Feature Addition
```
feat(auth): Add JWT token refresh mechanism

Implement automatic token refresh to improve user experience by
preventing unexpected session timeouts. The refresh happens 5 minutes
before token expiration using a background process.

- Add refresh token storage with encryption
- Implement background refresh scheduler
- Add error handling for refresh failures
- Update authentication middleware to use new flow

This prevents users from being logged out during active sessions.
```

### Example 2: Bug Fix
```
fix(api): Resolve race condition in concurrent requests

Fix data corruption issue when multiple requests modify the same
resource simultaneously. Added pessimistic locking at database level
to ensure consistency.

The issue occurred in production when users rapidly clicked submit
button, creating duplicate records with inconsistent state.

Fixes #2847
```

### Example 3: Refactoring
```
refactor: Extract validation logic into reusable module

Move validation logic from individual handlers into centralized
validation module to improve maintainability and reduce duplication.

Changes:
- Create validation module with common validators
- Update handlers to use shared validators
- Add comprehensive tests for validation module
- Remove duplicate validation code (DRY principle)

No functional changes; purely structural improvement.
```

### Example 4: Breaking Change
```
feat(api)!: Change response format to follow REST standards

Restructure API responses to use consistent envelope format with
metadata. This improves API consistency and makes error handling
more predictable for clients.

Old format:
  { "data": [...] }

New format:
  {
    "data": [...],
    "meta": { "count": 10, "page": 1 },
    "status": "success"
  }

BREAKING CHANGE: All API endpoints now return responses wrapped in
standard envelope. Clients must update response parsing logic.
Migration guide: docs/api-migration-v2.md
```

### Example 5: Simple Fix
```
fix: Correct typo in error message

Change "Occured" to "Occurred" in database connection error message.
```

## 🚫 Anti-Patterns to Avoid

**❌ Too vague:**
```
feat: Updates
chore: Various changes
fix: Bug fixes
```

**❌ Past tense:**
```
feat: Added new feature
fix: Fixed the bug
```

**❌ Too long subject:**
```
feat: Add comprehensive user authentication system with JWT tokens and refresh mechanism and password reset functionality
```

**❌ Including "how" instead of "why":**
```
refactor: Change variable names from x to user_id
(Better: refactor: Improve code readability with descriptive variable names)
```

## 🎯 Output Format

**IMPORTANT:** 
- Output **ONLY** the commit message text
- Do **NOT** execute any git commands
- Do **NOT** create markdown files
- Just return the plain text message for user review

---

## 💡 Remember

**A good commit message:**
- Helps future developers (including yourself) understand the change
- Makes code review easier
- Aids in debugging when searching history
- Documents decisions and trade-offs
- Facilitates changelog generation

*"Write commit messages as if you're writing to a colleague who will maintain the code in a year."*

