# 🔀 Generate Merge Request Description

Generate a professional, comprehensive merge request (MR/PR) description in English based on branch commits, diff from base branch, and conversation context.

## 🎯 Core Objective

Analyze branch commits, git diff from base branch (usually `main` or `master`), and conversation history to create a merge request description that provides:
- Clear overview of all changes
- Context and motivation
- Impact assessment
- Testing information
- Review guidance

## 📋 MR Description Structure

### Template Format
```markdown
## Summary
[Brief overview of what this MR accomplishes - 2-3 sentences]

## Motivation and Context
[Why was this change necessary? What problem does it solve?]

## Changes Made
[Detailed list of changes, organized by category]

### Technical Details
[Important technical decisions, architecture changes, or implementation notes]

## Impact Analysis
[How does this affect the system? Any side effects or considerations?]

## Testing
[What testing was performed? How to verify the changes?]

## Breaking Changes
[Any breaking changes? How to migrate?]

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Code follows project conventions
- [ ] No new warnings or errors
- [ ] Backwards compatible (or migration guide provided)

## Related Issues
[Links to related issues, tickets, or discussions]

## Screenshots/Examples
[If UI changes or important outputs - describe or indicate where to find them]
```

## 🔍 Analysis Process

### 1. Analyze Branch Commits
```bash
# Get commits in current branch not in base branch
git log base_branch..HEAD --oneline
```

**Extract from commits:**
- What features were added?
- What bugs were fixed?
- What refactorings were done?
- Progression and evolution of changes

### 2. Review Diff from Base Branch
```bash
# See all changes compared to base branch
git diff base_branch..HEAD
```

**Identify:**
- Which files were modified/added/deleted?
- Scope of changes (how many files, how extensive?)
- Affected subsystems or modules
- Configuration or dependency changes

### 3. Review Conversation History
- What was the original goal?
- What decisions were made during development?
- Were there any challenges or trade-offs?
- Any important context not obvious from code?

### 4. Assess Impact
- Does this change APIs or interfaces?
- Could this affect existing functionality?
- Are there performance implications?
- Security considerations?
- Deployment requirements?

### 5. Document Testing
- What testing was performed?
- How can reviewers verify changes?
- Are there edge cases to check?
- Manual testing steps if needed?

## 📝 Writing Guidelines

### Summary Section
- **2-3 sentences** maximum
- High-level overview anyone can understand
- Focus on user/business value when applicable

**Examples:**
```
✅ This MR implements user authentication using JWT tokens, replacing
   the legacy session-based approach. It improves security and enables
   stateless API scaling.

✅ Refactors the database query layer to use connection pooling,
   reducing query latency by ~40% under high load.

❌ This MR contains various updates and fixes.
```

### Motivation and Context
- **Why** was this needed?
- What problem does it solve?
- Link to related issues/tickets
- Business or technical context

### Changes Made
Organize by category:
```markdown
### Backend Changes
- Implemented JWT authentication middleware
- Added token refresh endpoint
- Updated user session management

### Frontend Changes
- Added login form with JWT integration
- Implemented auto-refresh mechanism
- Updated API client to include auth headers

### Database Changes
- Added `refresh_tokens` table
- Added index on `user_id` for performance
- Migration script: `migrations/2024_001_add_refresh_tokens.sql`

### Configuration Changes
- Added JWT secret configuration
- Updated environment variable documentation
```

### Technical Details
Highlight important decisions:
- Architecture patterns used
- Why this approach over alternatives
- Performance optimizations
- Security considerations
- Dependencies added/updated

### Impact Analysis
Be transparent about:
- **Breaking changes** (mark clearly!)
- Affected features or modules
- Performance impact (positive or negative)
- Migration steps if needed
- Rollback considerations

### Testing Section
Provide evidence:
- Unit tests added/updated
- Integration tests covered
- Manual testing performed
- How reviewers can test locally
- Edge cases verified

## 💡 MR Description Examples

### Example 1: Feature Addition
```markdown
## Summary
Implements user authentication system with JWT tokens, including login,
logout, token refresh, and password reset functionality. This replaces
the legacy session-based authentication and enables stateless API scaling.

## Motivation and Context
The current session-based authentication has several limitations:
- Doesn't scale horizontally (session stored on server)
- Complex load balancing setup required
- No support for mobile app authentication

This MR addresses these issues by implementing JWT-based authentication
following industry best practices.

Closes #1247, Refs #1189

## Changes Made

### Backend Changes
- **Authentication Service**: New JWT service with token generation/validation
- **Middleware**: JWT authentication middleware for protected routes
- **Endpoints**:
  - `POST /auth/login` - User login with credentials
  - `POST /auth/refresh` - Refresh access token
  - `POST /auth/logout` - Invalidate refresh token
  - `POST /auth/reset-password` - Password reset flow
- **Database**: Added `refresh_tokens` table with automatic cleanup

### Security Enhancements
- Tokens signed with RS256 algorithm
- Refresh tokens stored hashed in database
- Token rotation on refresh
- Automatic cleanup of expired tokens (daily cron job)

### Configuration
- Added `JWT_SECRET` and `JWT_PUBLIC_KEY` environment variables
- Added `JWT_ACCESS_TOKEN_EXPIRE` (default: 15 min)
- Added `JWT_REFRESH_TOKEN_EXPIRE` (default: 7 days)

## Technical Details

**Why JWT over sessions?**
- Stateless: No server-side session storage required
- Scalable: Works across multiple server instances
- Mobile-friendly: Standard approach for mobile apps
- Industry standard: Well-understood security model

**Token Strategy:**
- Short-lived access tokens (15 min) for security
- Long-lived refresh tokens (7 days) for UX
- Refresh token rotation to prevent replay attacks
- Automatic cleanup prevents database bloat

**Security Considerations:**
- Using RS256 (asymmetric) instead of HS256 for better security
- Refresh tokens hashed before storage (bcrypt)
- Rate limiting on auth endpoints (100 req/min per IP)
- Audit logging for all auth events

## Impact Analysis

**Benefits:**
- ✅ Horizontal scaling without sticky sessions
- ✅ Better mobile/SPA support
- ✅ Reduced server memory usage
- ✅ Simpler deployment architecture

**Considerations:**
- Token invalidation requires database check (refresh tokens)
- Clients need to implement token refresh logic
- Migration required for existing users

**Breaking Changes:**
- Session-based authentication endpoints removed
- All clients must update to use JWT authentication
- See migration guide: `docs/auth-migration.md`

## Testing

### Automated Tests
- Unit tests: Auth service (100% coverage)
- Integration tests: Auth endpoints
- Security tests: Token validation, expiration, rotation
- Load tests: 1000 concurrent authentications/sec ✓

### Manual Testing
1. Login with valid credentials → receives tokens
2. Access protected endpoint with access token → success
3. Wait for token expiration → receives 401
4. Use refresh token → receives new access token
5. Logout → refresh token invalidated

### How to Test Locally
```bash
# 1. Run migrations
npm run migrate

# 2. Set environment variables
export JWT_SECRET="your-secret-key"

# 3. Start server
npm run dev

# 4. Test authentication
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

## Migration Guide

### For Existing Users
Existing sessions will remain valid until expiration. After that, users
will need to login again to receive JWT tokens.

### For API Clients
1. Update authentication to use `/auth/login` endpoint
2. Store both access and refresh tokens
3. Include access token in `Authorization: Bearer <token>` header
4. Implement token refresh when receiving 401 with expired token error
5. Update logout to call `/auth/logout` endpoint

See detailed migration guide: `docs/auth-migration.md`

## Checklist
- [x] Unit tests added (auth service)
- [x] Integration tests added (auth endpoints)
- [x] Security tests added (token validation)
- [x] Documentation updated (API docs, migration guide)
- [x] Environment variables documented
- [x] Database migrations included
- [x] Code follows project conventions
- [x] No new linting warnings
- [x] Backwards compatibility considered (migration guide provided)
- [x] Performance tested (load tests passed)

## Related Issues
- Closes #1247 (Implement JWT authentication)
- Refs #1189 (Remove session-based auth)
- Refs #1302 (Support mobile app authentication)

## Additional Notes
- Deployed to staging environment for testing: https://staging.example.com
- Breaking change - requires client updates before deploying to production
- Recommended to deploy during low-traffic window
- Rollback plan: Revert migration and redeploy previous version
```

### Example 2: Bug Fix
```markdown
## Summary
Fixes race condition in payment processing that caused duplicate charges
when users rapidly clicked the submit button. Implements idempotency key
mechanism to prevent duplicate transactions.

## Motivation and Context
Production incident #5431: Multiple users reported duplicate charges on
their accounts. Investigation revealed that rapid button clicks created
multiple concurrent payment requests, bypassing the existing deduplication
logic which only worked for sequential requests.

Fixes #5431, Refs #5432

## Changes Made
- Added idempotency key generation on client side
- Implemented idempotency key validation in payment service
- Added database unique constraint on `idempotency_key`
- Added client-side button disable during processing
- Added comprehensive logging for duplicate detection

## Technical Details
Uses UUID v4 as idempotency key, stored for 24 hours to catch duplicates.
Database constraint ensures atomicity even if validation logic fails.

## Impact Analysis
- No breaking changes
- Prevents duplicate charges (critical bug fix)
- Minimal performance impact (~5ms per request)
- Backwards compatible (old clients work, just without protection)

## Testing
- Unit tests for idempotency validation
- Integration tests with concurrent requests
- Manually tested rapid button clicking (50+ clicks)
- Verified in staging with production data patterns

## Checklist
- [x] Tests added (unit + integration)
- [x] Code reviewed by security team
- [x] Tested in staging
- [x] Monitoring alerts configured
- [x] Backwards compatible

## Related Issues
Fixes #5431
```

### Example 3: Refactoring
```markdown
## Summary
Refactors data validation layer into a centralized, reusable module,
eliminating code duplication across 23 API endpoints and improving
maintainability.

## Motivation and Context
Validation logic was scattered across individual endpoint handlers,
leading to:
- Code duplication (~800 lines of repeated logic)
- Inconsistent error messages
- Difficult to update validation rules
- High risk of bugs due to copy-paste errors

This refactoring consolidates all validation into a single, well-tested
module.

## Changes Made

### New Validation Module
- Created `core/validation/` module with common validators
- Implemented schema-based validation
- Added custom validator support
- Comprehensive error formatting

### Updated Components
- Updated 23 API endpoint handlers to use new validators
- Removed ~800 lines of duplicate validation code
- Standardized error response format
- Added validation middleware

### Documentation
- Added validation module documentation
- Created validator usage guide
- Updated API error response documentation

## Technical Details

**Pattern Used:** Schema-based validation with fluent API
**Benefits:**
- Single source of truth for validation rules
- Easier to test (one place to test vs 23 handlers)
- Consistent error messages
- Type-safe validation rules

**No Functional Changes:**
This is a pure refactoring - no changes to validation logic or behavior.
All existing tests pass without modification.

## Impact Analysis
- ✅ Reduces codebase by ~800 lines
- ✅ Improves maintainability
- ✅ No breaking changes
- ✅ No performance impact
- ✅ Easier to add new validation rules

## Testing
- All existing tests pass (489 tests, 0 failures)
- Added 45 new unit tests for validation module
- Tested all 23 endpoints manually
- No regression in functionality

## Checklist
- [x] All existing tests pass
- [x] New tests for validation module
- [x] Documentation updated
- [x] Code follows project conventions
- [x] No functional changes (verified by tests)
- [x] Backwards compatible (100%)

## Related Issues
Refs #3421 (Tech debt: consolidate validation)
```

## 🚫 Anti-Patterns to Avoid

**❌ Too brief:**
```
## Changes
Updated some files

## Testing
Tested locally
```

**❌ Listing file changes:**
```
Changed:
- src/auth/service.ts
- src/auth/middleware.ts
- src/auth/types.ts
```
(Focus on **what** changed functionally, not just file list)

**❌ No context:**
```
Implemented JWT authentication
```
(Why? What problem does it solve? What was the old approach?)

**❌ Missing impact analysis:**
(Always consider and document potential impacts and breaking changes)

## 🎯 Output Format

**IMPORTANT:** 
- Output **ONLY** the MR description text in markdown format
- Do **NOT** create markdown files
- Do **NOT** create the MR/PR
- Just return the formatted description for user review

## 💡 Tips for Reviewers Section (Optional)

Sometimes helpful to add:
```markdown
## Tips for Reviewers
- Start with `auth/service.ts` to understand core logic
- Focus on security aspects in token validation
- Test locally using provided curl commands
- Pay attention to error handling in refresh flow
- Check migration script for database changes
```

---

## 💡 Remember

**A good MR description:**
- Saves reviewers time by providing context
- Documents why decisions were made
- Makes code archaeology easier in the future
- Facilitates changelog generation
- Demonstrates professionalism and thoroughness

*"Write MR descriptions as if you're onboarding a new team member to this feature."*

