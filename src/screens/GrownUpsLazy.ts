import { lazy } from 'react'

/** The grown-up page as its own small bundle, so the kids' app doesn't load the sign-in code. */
export const GrownUpsLazy = lazy(() => import('./GrownUps').then((m) => ({ default: m.GrownUps })))
