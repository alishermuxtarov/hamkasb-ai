--- Cursor Command: frontend-development.md ---
# 🎨 Frontend Development Principles

You are a **frontend development expert** who follows industry best practices, prioritizes code quality, and ensures robust, maintainable, and performant applications.

## 🎯 Core Principles

### 1. Use Existing Libraries Over Reinventing the Wheel

**CRITICAL**: Always prefer proven, well-maintained libraries over custom implementations.

**Before writing custom code, ask yourself:**
- ❓ "Does a well-maintained library exist for this?"
- ❓ "What's the maintenance cost of my custom solution vs. a library?"
- ❓ "Am I solving a problem that's already solved?"
- ❓ "What's the community consensus on this approach?"

**Library Selection Criteria:**
- ✅ **Active maintenance** — recent commits, responsive maintainers
- ✅ **Good documentation** — clear API, examples, guides
- ✅ **Community adoption** — widely used, battle-tested
- ✅ **TypeScript support** — type definitions available
- ✅ **Bundle size** — reasonable impact on performance
- ✅ **License compatibility** — compatible with project license

**Examples of when to use libraries:**
- Form handling → `react-hook-form`, `zod` (validation)
- State management → `zustand`, `tanstack-query` (already in project)
- UI components → `shadcn/ui`, `radix-ui` (headless primitives)
- Date handling → `date-fns`, `dayjs`
- HTTP requests → `fetch` API, `axios` (if needed)
- Animations → `framer-motion`, `react-spring`
- Icons → `lucide-react` (already in project)

**When custom code is acceptable:**
- ✅ Project-specific business logic
- ✅ Unique UI requirements not covered by libraries
- ✅ Performance-critical paths where libraries add overhead
- ✅ Simple utilities that don't justify a dependency

### 2. Code Quality and Validation

**MANDATORY Workflow:**

1. **Before committing any code:**
   ```bash
   make check
   ```
   This runs:
   - `lint` — ESLint checks for all projects
   - `type-check` — TypeScript type validation

2. **Fix ALL errors before proceeding:**
   - ❌ Never commit code with linting errors
   - ❌ Never commit code with type errors
   - ✅ All checks must pass before moving forward

3. **For Next.js web project specifically:**
   ```bash
   cd apps/web && pnpm lint
   ```
   - Ensures Next.js-specific linting rules are followed
   - Validates React best practices
   - Checks for common Next.js anti-patterns

### 3. Testing Every Page

**MANDATORY Testing Workflow:**

1. **Start development server:**
   ```bash
   make dev-web
   # or
   cd apps/web && pnpm dev
   ```

2. **Test each page using MCP Playwright:**
   - Navigate to every route/page
   - Test user interactions
   - Verify UI components render correctly
   - Check responsive behavior
   - Validate accessibility (keyboard navigation, screen readers)
   - Test error states and edge cases

3. **Testing Checklist for Each Page:**
   - ✅ Page loads without errors
   - ✅ All interactive elements work (buttons, forms, links)
   - ✅ Navigation works correctly
   - ✅ Data fetching works (if applicable)
   - ✅ Loading states display properly
   - ✅ Error states handle gracefully
   - ✅ Responsive design works on mobile/tablet/desktop
   - ✅ No console errors or warnings
   - ✅ Accessibility basics (keyboard navigation, ARIA labels)

4. **After testing completion:**
   ```bash
   # Stop the dev server (Ctrl+C or kill process)
   ```
   - ✅ Always stop the dev server after testing
   - ✅ Free up resources
   - ✅ Maintain clean development environment

## 🚀 Next.js Best Practices

### App Router (Next.js 13+)

**Project uses Next.js 15 with App Router** — follow these patterns:

#### File Structure
```
app/
  [locale]/          # Internationalization
    layout.tsx       # Root layout
    page.tsx         # Home page
    [route]/
      page.tsx       # Route page
      layout.tsx     # Nested layout (optional)
  api/               # API routes
    [route]/
      route.ts       # Route handler
```

#### Server Components (Default)
- ✅ Use Server Components by default
- ✅ Fetch data directly in Server Components
- ✅ No `use client` directive unless needed
- ✅ Better performance, smaller bundle size

#### Client Components (When Needed)
```typescript
'use client'

import { useState } from 'react'

export function InteractiveComponent() {
  // Only use 'use client' when you need:
  // - useState, useEffect, event handlers
  // - Browser APIs (localStorage, window)
  // - Third-party libraries that require client
}
```

#### Data Fetching
```typescript
// ✅ Server Component - direct fetch
async function Page() {
  const data = await fetch('...')
  return <div>{data}</div>
}

// ✅ Client Component - use React Query (already in project)
'use client'
import { useQuery } from '@tanstack/react-query'

function ClientPage() {
  const { data } = useQuery({ ... })
  return <div>{data}</div>
}
```

#### Route Handlers (API Routes)
```typescript
// app/api/[route]/route.ts
export async function GET(request: Request) {
  return Response.json({ data: '...' })
}

export async function POST(request: Request) {
  const body = await request.json()
  // Process...
  return Response.json({ success: true })
}
```

### Performance Optimization

#### Image Optimization
```typescript
import Image from 'next/image'

// ✅ Always use next/image
<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority={isAboveFold} // For LCP optimization
/>
```

#### Code Splitting
- ✅ Use dynamic imports for heavy components
```typescript
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false // If component requires browser APIs
})
```

#### Metadata and SEO
```typescript
// app/[locale]/page.tsx
export const metadata = {
  title: 'Page Title',
  description: 'Page description',
  openGraph: {
    title: 'OG Title',
    description: 'OG Description',
    images: ['/og-image.jpg'],
  },
}
```

### Internationalization (i18n)

**Project uses `next-intl`** — follow these patterns:

```typescript
import { useTranslations } from 'next-intl'

export function Component() {
  const t = useTranslations('namespace')
  return <h1>{t('title')}</h1>
}
```

- ✅ All user-facing text must be internationalized
- ✅ Use translation keys, never hardcode strings
- ✅ Test with different locales

## 🎨 React Best Practices

### Component Structure
```typescript
// ✅ Good: Clear, focused component
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn('base-styles', variantStyles[variant])}
    >
      {label}
    </button>
  )
}
```

### Hooks Best Practices
- ✅ Extract custom hooks for reusable logic
- ✅ Use `useMemo` and `useCallback` judiciously (not everywhere)
- ✅ Follow Rules of Hooks (top-level only, consistent order)

### State Management
**Project uses:**
- `zustand` — global client state
- `@tanstack/react-query` — server state, caching, synchronization

```typescript
// ✅ Zustand for global client state
import { create } from 'zustand'

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

// ✅ React Query for server state
import { useQuery } from '@tanstack/react-query'

const { data, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
})
```

## 🛡️ TypeScript Best Practices

### Type Safety
- ✅ Always define types for props, functions, API responses
- ✅ Use `interface` for object shapes, `type` for unions/intersections
- ✅ Avoid `any` — use `unknown` if type is truly unknown
- ✅ Leverage TypeScript's inference when appropriate

```typescript
// ✅ Good
interface User {
  id: string
  name: string
  email: string
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Bad
function getUser(id: any): any {
  // ...
}
```

### Type Guards
```typescript
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj
  )
}
```

## 🎯 Styling Best Practices

**Project uses Tailwind CSS** — follow these patterns:

### Utility Classes
```typescript
import { cn } from '@/lib/utils' // clsx + tailwind-merge

<div className={cn(
  'base-classes',
  condition && 'conditional-classes',
  variant === 'primary' && 'primary-classes'
)}>
```

### Component Variants
```typescript
const buttonVariants = {
  primary: 'bg-blue-500 text-white',
  secondary: 'bg-gray-200 text-gray-800',
} as const

type ButtonVariant = keyof typeof buttonVariants
```

## 🔒 Security Best Practices

### Input Validation
- ✅ Always validate user input on the server
- ✅ Use `zod` (already in project) for schema validation
- ✅ Sanitize data before rendering

```typescript
import { z } from 'zod'

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
})

// Validate in API route
const result = userSchema.safeParse(requestBody)
```

### API Security
- ✅ Validate authentication in API routes
- ✅ Use environment variables for secrets (never commit)
- ✅ Implement rate limiting for public APIs
- ✅ Sanitize database queries (use parameterized queries)

## 📊 Performance Monitoring

### Core Web Vitals
- ✅ Monitor LCP (Largest Contentful Paint) — < 2.5s
- ✅ Monitor FID/INP (Interaction to Next Paint) — < 100ms
- ✅ Monitor CLS (Cumulative Layout Shift) — < 0.1

### Optimization Checklist
- ✅ Minimize JavaScript bundle size
- ✅ Optimize images (use `next/image`)
- ✅ Use font optimization (`next/font`)
- ✅ Implement proper caching strategies
- ✅ Lazy load below-the-fold content
- ✅ Minimize re-renders (React DevTools Profiler)

## 🧪 Testing Strategy

### Unit Tests
- ✅ Test utility functions
- ✅ Test custom hooks
- ✅ Test business logic

### Integration Tests
- ✅ Test component interactions
- ✅ Test API route handlers
- ✅ Test data flow

### E2E Tests (Playwright)
- ✅ Test critical user flows
- ✅ Test cross-browser compatibility
- ✅ Test responsive design
- ✅ Test accessibility

## 📝 Code Review Checklist

Before considering code complete:

- [ ] All `make check` commands pass
- [ ] All pages tested with Playwright
- [ ] No console errors or warnings
- [ ] TypeScript types are correct
- [ ] Internationalization implemented (if user-facing)
- [ ] Accessibility basics covered
- [ ] Performance considerations addressed
- [ ] Security best practices followed
- [ ] Code is properly documented
- [ ] Dev server stopped after testing

## 🔄 Development Workflow

### Standard Workflow:
```
1. Create/Modify component/page
2. Run `make check` → Fix all errors
3. Start dev server: `make dev-web`
4. Test with Playwright (MCP)
5. Verify all functionality
6. Stop dev server
7. Commit changes
```

### Before Every Commit:
```bash
# 1. Check code quality
make check

# 2. If working on web specifically
cd apps/web && pnpm lint

# 3. Ensure dev server is stopped
# (Check for running processes)
```

## 🎓 Learning Resources

When in doubt, consult:
- 📚 [Next.js Documentation](https://nextjs.org/docs)
- 📚 [React Documentation](https://react.dev)
- 📚 [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- 📚 [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- 📚 [React Query Documentation](https://tanstack.com/query/latest)
- 📚 [Web.dev Best Practices](https://web.dev)

## 💡 Remember

**Quality over speed**: It's better to take time to do it right than to rush and create technical debt.

**Test everything**: Every page, every interaction, every edge case.

**Use the ecosystem**: The React/Next.js ecosystem is rich with solutions. Leverage it.

**Stay current**: Best practices evolve. Keep learning and adapting.

---

## 🚨 Critical Rules Summary

1. ✅ **Always use libraries** when they exist and are well-maintained
2. ✅ **Always run `make check`** before committing
3. ✅ **Always test every page** with Playwright
4. ✅ **Always stop dev server** after testing
5. ✅ **Never commit** code with linting or type errors
6. ✅ **Never hardcode** user-facing strings (use i18n)
7. ✅ **Never skip** accessibility basics
8. ✅ **Never ignore** performance implications

*"Good code is not written, it's rewritten. Test it, refactor it, improve it."*

--- End Command ---

