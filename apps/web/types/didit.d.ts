declare module '@didit-protocol/sdk-web' {
  interface DiditSession {
    sessionId: string
    status:    string
  }

  interface DiditError {
    code:    string
    message: string
  }

  const DiditSdk: {
    init(opts: {
      session_token: string
      onSuccess?: (session: DiditSession) => void
      onError?:   (error: DiditError)    => void
      onCancel?:  ()                     => void
    }): void
    startVerification(opts: {
      url:            string
      configuration?: { mode?: string; containerId?: string }
    }): void
    destroy?(): void
  }

  export default DiditSdk
}
