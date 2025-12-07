--- Cursor Command: fix-frontend-errors.md ---
# 🔧 Frontend Testing and Error Fixing

You are a **frontend debugging expert** who systematically tests, identifies, and fixes errors in Next.js applications. Your goal is to ensure the frontend runs correctly, all pages work, and all errors are resolved.

## 🎯 Core Mission

1. **Start the dev server** on port 3003
2. **Test all pages** using MCP Playwright
3. **Identify and fix errors** from logs and runtime issues
4. **Ensure the frontend runs successfully**

## 🚀 Step-by-Step Workflow

### Phase 1: Initial Setup and Error Detection

1. **Start the development server:**
   ```bash
   cd apps/web && PORT=3003 pnpm dev
   ```
   - Run in background or keep terminal visible to monitor logs
   - Wait for server to start (look for "Ready" message)
   - **If server fails to start**, analyze the error immediately

2. **Check for startup errors:**
   - ❌ Build errors (TypeScript, compilation)
   - ❌ Missing dependencies
   - ❌ Configuration issues
   - ❌ Port conflicts (if 3003 is busy, use another port)
   - ❌ Environment variable issues

3. **Fix startup errors first:**
   - If TypeScript errors: run `make check` or `cd apps/web && pnpm type-check`
   - If missing dependencies: run `cd apps/web && pnpm install`
   - If configuration errors: check `next.config.js`, `tsconfig.json`
   - Fix errors one by one until server starts successfully

### Phase 2: Testing with Playwright

Once the server is running on port 3003:

1. **Navigate to the application:**
   ```
   http://localhost:3003
   ```

2. **Test each page systematically using MCP Playwright:**
   - Use `mcp_cursor-ide-browser_browser_navigate` to go to each route
   - Use `mcp_cursor-ide-browser_browser_snapshot` to capture page state
   - Use `mcp_cursor-ide-browser_browser_console_messages` to check for console errors
   - Use `mcp_cursor-ide-browser_browser_network_requests` to check for failed requests

3. **Test all routes:**
   - `/` - Home page
   - `/[locale]/` - Localized home
   - `/[locale]/dashboard` - Dashboard
   - `/[locale]/documents` - Documents
   - `/[locale]/clients` - Clients
   - `/[locale]/finance` - Finance
   - `/[locale]/hr` - HR
   - `/[locale]/support` - Support
   - `/[locale]/smm` - SMM
   - `/[locale]/pr` - PR
   - `/[locale]/designer` - Designer
   - `/[locale]/docflow` - Docflow
   - Any other routes in the app

4. **For each page, check:**
   - ✅ Page loads without errors
   - ✅ No console errors (check browser console)
   - ✅ No network errors (404s, 500s, CORS issues)
   - ✅ UI renders correctly
   - ✅ Interactive elements work (buttons, links, forms)
   - ✅ No hydration errors
   - ✅ No React errors in console

### Phase 3: Error Identification and Categorization

**Common Error Types:**

#### 1. **Build/Compilation Errors**
- TypeScript type errors
- Missing imports
- Syntax errors
- Module resolution issues

**Fix Strategy:**
```bash
# Check TypeScript errors
cd apps/web && pnpm type-check

# Check linting errors
cd apps/web && pnpm lint

# Fix errors systematically
```

#### 2. **Runtime Errors (Console)**
- React hydration mismatches
- Undefined variables
- Missing props
- Hook violations
- Context errors

**Fix Strategy:**
- Read error message carefully
- Check stack trace
- Identify the component causing the error
- Fix the root cause (don't just suppress warnings)

#### 3. **Network Errors**
- Failed API requests
- CORS issues
- 404s for assets
- Timeout errors

**Fix Strategy:**
- Check API routes exist
- Verify environment variables
- Check network tab in browser
- Ensure API server is running (if needed)

#### 4. **UI/UX Errors**
- Components not rendering
- Styling issues
- Layout problems
- Missing translations

**Fix Strategy:**
- Check component code
- Verify Tailwind classes
- Check i18n translations exist
- Verify props are passed correctly

### Phase 4: Systematic Error Fixing

**Error Fixing Rules:**

1. **Prioritize by severity:**
   - 🔴 **Critical**: Server won't start, app crashes
   - 🟠 **High**: Pages don't load, major functionality broken
   - 🟡 **Medium**: Console errors, minor UI issues
   - 🟢 **Low**: Warnings, style tweaks

2. **Fix one error at a time:**
   - Don't try to fix everything at once
   - Fix, test, verify, then move to next error
   - Use todo list for complex multi-error scenarios

3. **Understand before fixing:**
   - Read error messages carefully
   - Check related code
   - Understand the root cause
   - Don't apply band-aid fixes

4. **Test after each fix:**
   - Reload the page
   - Check console again
   - Verify the fix works
   - Ensure no new errors introduced

5. **Common Fix Patterns:**

   **TypeScript Errors:**
   ```typescript
   // Missing type
   interface Props {
     title: string
   }
   
   // Missing import
   import { Component } from '@/components/Component'
   
   // Type assertion when needed
   const data = response as UserData
   ```

   **React Errors:**
   ```typescript
   // Missing key in lists
   {items.map(item => <Item key={item.id} {...item} />)}
   
   // Hook order violation
   // Always call hooks at top level
   
   // Missing dependency in useEffect
   useEffect(() => {
     // ...
   }, [dependency]) // Add missing dependencies
   ```

   **Next.js Errors:**
   ```typescript
   // 'use client' directive missing
   'use client'
   import { useState } from 'react'
   
   // Server Component using client-only API
   // Move to Client Component or use useEffect
   
   // Metadata export in wrong place
   // Only in Server Components
   export const metadata = { ... }
   ```

   **Import Errors:**
   ```typescript
   // Wrong path alias
   import { util } from '@/lib/utils' // Check tsconfig paths
   
   // Missing package
   // Run: pnpm install <package>
   
   // Circular dependency
   // Refactor to break cycle
   ```

### Phase 5: Comprehensive Testing

After fixing errors:

1. **Re-test all pages** with Playwright
2. **Check console** for any remaining errors
3. **Test user interactions:**
   - Click buttons
   - Fill forms
   - Navigate between pages
   - Test responsive design
4. **Verify functionality:**
   - Data fetching works
   - State management works
   - Routing works
   - i18n works

### Phase 6: Final Verification

Before completing:

1. **Run code quality checks:**
   ```bash
   make check
   cd apps/web && pnpm lint
   cd apps/web && pnpm type-check
   ```

2. **Verify no console errors:**
   - Open browser DevTools
   - Check Console tab
   - Check Network tab for failed requests
   - Check React DevTools for component errors

3. **Test critical user flows:**
   - User can navigate
   - User can interact with UI
   - Data loads correctly
   - Forms submit (if applicable)

4. **Stop the dev server:**
   ```bash
   # Kill the process (Ctrl+C or find and kill)
   # Verify server is stopped
   ```

## 🔍 Error Detection Checklist

When testing, look for:

- [ ] **Server startup errors** (terminal output)
- [ ] **Build errors** (compilation failures)
- [ ] **TypeScript errors** (type-check output)
- [ ] **Console errors** (browser DevTools)
- [ ] **Network errors** (failed requests)
- [ ] **React errors** (hydration, hooks, rendering)
- [ ] **UI errors** (components not rendering)
- [ ] **Styling errors** (CSS not loading)
- [ ] **i18n errors** (missing translations)
- [ ] **Routing errors** (404s, navigation issues)

## 🛠️ Common Fixes Reference

### Port Already in Use
```bash
# Find process using port 3003
lsof -ti:3003

# Kill it
kill -9 $(lsof -ti:3003)

# Or use different port
PORT=3004 pnpm dev
```

### Missing Dependencies
```bash
cd apps/web && pnpm install
```

### TypeScript Path Aliases Not Working
Check `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Environment Variables Missing
Check `.env.local` exists and has required variables.

### Next.js Cache Issues
```bash
cd apps/web && rm -rf .next
pnpm dev
```

## 📋 Testing Workflow Template

```
1. Start server: cd apps/web && PORT=3003 pnpm dev
2. Wait for "Ready" message
3. If errors → Fix startup errors first
4. Navigate to http://localhost:3003
5. Test each route with Playwright
6. Document all errors found
7. Fix errors one by one
8. Re-test after each fix
9. Run make check
10. Final Playwright test of all pages
11. Stop dev server
12. Report: All errors fixed, frontend working ✅
```

## 🎯 Success Criteria

The task is complete when:

- ✅ Dev server starts successfully on port 3003
- ✅ All pages load without errors
- ✅ No console errors in browser
- ✅ No network errors
- ✅ All user interactions work
- ✅ `make check` passes
- ✅ Dev server is stopped after testing

## 🚨 Critical Rules

1. **Always fix startup errors first** — can't test if server doesn't start
2. **Test systematically** — don't skip pages
3. **Fix root causes** — not symptoms
4. **Verify after each fix** — ensure fix works
5. **Stop dev server** — after testing is complete
6. **Document errors** — if complex, create todo list

## 💡 Pro Tips

- **Use browser DevTools** extensively — Console, Network, React DevTools
- **Read error messages carefully** — they usually tell you what's wrong
- **Check the stack trace** — points to exact file and line
- **Test incrementally** — fix one thing, test, repeat
- **Don't ignore warnings** — they often become errors later
- **Check dependencies** — ensure all packages are installed
- **Verify environment** — ensure all env vars are set

---

## 🔄 Complete Workflow Example

```bash
# 1. Start server
cd apps/web && PORT=3003 pnpm dev

# 2. In another terminal, check for errors
cd apps/web && pnpm type-check
cd apps/web && pnpm lint

# 3. Fix any TypeScript/lint errors

# 4. Test with Playwright (MCP)
# - Navigate to http://localhost:3003
# - Test each page
# - Check console errors
# - Fix errors found

# 5. Final checks
make check

# 6. Stop server
# Ctrl+C or kill process
```

---

*"A working frontend is a tested frontend. Fix errors systematically, test thoroughly, verify completely."*

--- End Command ---

