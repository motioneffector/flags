export class FlagsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FlagsError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class ValidationError extends FlagsError {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class ParseError extends FlagsError {
  constructor(
    message: string,
    public readonly position?: number,
    public readonly input?: string
  ) {
    super(message)
    this.name = 'ParseError'
  }
}
