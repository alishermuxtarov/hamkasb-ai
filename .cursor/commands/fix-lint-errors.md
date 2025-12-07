Fix linting errors found by running `make check` command in this project.

IMPORTANT CONTEXT:
- This project uses ruff (linter + formatter), black (formatter), and mypy (type checker)
- Run `make check` to identify all linting errors (NOT Cursor's built-in linter errors)
- The errors to fix come from the make check output, not from IDE diagnostics

FIXING STRATEGY:
1. First, run `make check` to see all current linting errors
2. If there are multiple errors, create a todo list to organize the fixes systematically
3. Fix errors in small, targeted steps - one file or one type of error at a time
4. After each fix, run `make check` again to verify the fix and see remaining errors
5. Continue until all linting errors are resolved

FIXING RULES:
- DO NOT change business logic or application behavior
- Only fix linting issues: formatting, type hints, unused imports, code style, etc.
- Follow best practices for each tool:
  - **ruff**: Fix import order, unused variables, line length, complexity issues
  - **black**: Fix code formatting (usually auto-fixable)
  - **mypy**: Add proper type hints, fix type errors, use appropriate type annotations
- Preserve existing functionality exactly as it is
- If a linting rule conflicts with the codebase patterns, consider using inline ignores (# type: ignore, # noqa) with comments explaining why
- Never remove or modify functionality to satisfy linters

APPROACH:
- Break down large sets of errors into manageable chunks
- Prioritize simple fixes first (imports, formatting) before complex ones (type hints)
- Test understanding of the code before making type-related changes
- When adding type hints, ensure they accurately represent the actual types being used

After all fixes are complete, confirm by running `make check` one final time to ensure zero linting errors remain.
