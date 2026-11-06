import { configDefaults, defineConfig } from 'vitest/config'

// Leaves out the copies of the repo in .claude/worktrees, so `npm test` runs this checkout's tests only.
export default defineConfig({ test: { exclude: [...configDefaults.exclude, '.claude/**'] } })
