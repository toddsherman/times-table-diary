import { createContext, useContext } from 'react'
import { bricks } from './bricks'
import { construction } from './construction'
import { creatures } from './creatures'
import { diary } from './diary'
import { ninja } from './ninja'
import type { Theme, ThemeId } from './types'

export type { Theme, ThemeId } from './types'

/** In picker order. The diary is first and the default. */
export const THEMES: readonly Theme[] = [diary, bricks, creatures, ninja, construction]

export const getTheme = (id: string | undefined): Theme => THEMES.find((t) => t.id === id) ?? diary

export const ThemeContext = createContext<Theme>(diary)

export const useTheme = (): Theme => useContext(ThemeContext)

/** Puts the theme's styles and browser-bar color on the page. */
export function applyTheme(theme: Theme): void {
  // The diary is the base stylesheet, so it needs no attribute (and its page stays exactly as before themes).
  if (theme.id === 'diary') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = theme.id
  if (document.title !== theme.words.appTitle) document.title = theme.words.appTitle
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta && meta.getAttribute('content') !== theme.themeColor) meta.setAttribute('content', theme.themeColor)
}

export const isThemeId = (id: string): id is ThemeId => THEMES.some((t) => t.id === id)
