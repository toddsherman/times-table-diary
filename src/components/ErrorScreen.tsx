import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Catches an error anywhere on screen, which would otherwise leave a blank page. The diary is saved
 * on the device after every answer, so starting the app again picks up where she was.
 */
export class ErrorScreen extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack)
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children
    return (
      <div className="screen error-screen" role="alert">
        <section className="card panel">
          <h2>Oops! Something got stuck.</h2>
          <p>Your work is saved. Tap the button to start again.</p>
          <div className="row">
            <button type="button" className="btn pink big" onClick={() => location.reload()}>
              Start again
            </button>
          </div>
        </section>
      </div>
    )
  }
}
