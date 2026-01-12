import { ParseError } from '../errors'
import type { FlagValue } from '../types'

/**
 * Token types for the condition parser
 */
const enum TokenType {
  IDENTIFIER = 'IDENTIFIER',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  NOT = 'NOT',
  AND = 'AND',
  OR = 'OR',
  EQ = 'EQ',
  NEQ = 'NEQ',
  GT = 'GT',
  LT = 'LT',
  GTE = 'GTE',
  LTE = 'LTE',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  EOF = 'EOF',
}

interface Token {
  type: TokenType
  value: string
  position: number
}

/**
 * Tokenizer for condition expressions
 */
class Tokenizer {
  private input: string
  private position: number = 0
  private currentChar: string | null

  constructor(input: string) {
    this.input = input
    this.currentChar = input.length > 0 ? (input[0] ?? null) : null
  }

  private advance(): void {
    this.position++
    this.currentChar =
      this.position < this.input.length ? (this.input[this.position] ?? null) : null
  }

  private peek(offset: number = 1): string | null {
    const peekPos = this.position + offset
    return peekPos < this.input.length ? (this.input[peekPos] ?? null) : null
  }

  private skipWhitespace(): void {
    while (this.currentChar !== null && /\s/.test(this.currentChar)) {
      this.advance()
    }
  }

  private readString(quote: string): string {
    let result = ''
    this.advance() // Skip opening quote

    while (this.currentChar !== null && this.currentChar !== quote) {
      const char = this.currentChar
      if (char === '\\') {
        this.advance()
        // After advance, currentChar may be null (end of string)
        const nextChar = this.currentChar
        if (!nextChar) {
          throw new ParseError('Unterminated string escape', this.position, this.input)
        }
        // Handle escaped characters
        switch (nextChar) {
          case 'n':
            result += '\n'
            break
          case 't':
            result += '\t'
            break
          case 'r':
            result += '\r'
            break
          default:
            // For quotes and backslash, just add the character
            result += nextChar
        }
        this.advance()
      } else {
        result += char
        this.advance()
      }
    }

    if (this.currentChar !== quote) {
      throw new ParseError('Unterminated string literal', this.position, this.input)
    }

    this.advance() // Skip closing quote
    return result
  }

  private readNumber(): string {
    const startPos = this.position
    let hasDecimal = false

    if (this.currentChar === '-') {
      this.advance()
    }

    while (this.currentChar !== null && /[0-9.]/.test(this.currentChar)) {
      if (this.currentChar === '.') {
        if (hasDecimal) {
          throw new ParseError('Invalid number format', startPos, this.input)
        }
        hasDecimal = true
      }
      this.advance()
    }

    return this.input.slice(startPos, this.position)
  }

  private readIdentifier(): string {
    const startPos = this.position

    while (this.currentChar !== null && /[a-zA-Z0-9_.-]/.test(this.currentChar)) {
      this.advance()
    }

    return this.input.slice(startPos, this.position)
  }

  public tokenize(): Token[] {
    const tokens: Token[] = []

    while (this.currentChar !== null) {
      this.skipWhitespace()

      if (!this.currentChar) break

      const startPos = this.position

      // String literals
      if (this.currentChar === '"' || this.currentChar === "'") {
        const quote = this.currentChar
        const value = this.readString(quote)
        tokens.push({ type: TokenType.STRING, value, position: startPos })
        continue
      }

      // Parentheses
      if (this.currentChar === '(') {
        tokens.push({ type: TokenType.LPAREN, value: '(', position: startPos })
        this.advance()
        continue
      }

      if (this.currentChar === ')') {
        tokens.push({ type: TokenType.RPAREN, value: ')', position: startPos })
        this.advance()
        continue
      }

      // Operators
      if (this.currentChar === '!') {
        if (this.peek() === '=') {
          tokens.push({ type: TokenType.NEQ, value: '!=', position: startPos })
          this.advance()
          this.advance()
          continue
        } else {
          tokens.push({ type: TokenType.NOT, value: '!', position: startPos })
          this.advance()
          continue
        }
      }

      if (this.currentChar === '=') {
        if (this.peek() === '=') {
          tokens.push({ type: TokenType.EQ, value: '==', position: startPos })
          this.advance()
          this.advance()
          continue
        }
      }

      if (this.currentChar === '>') {
        if (this.peek() === '=') {
          tokens.push({ type: TokenType.GTE, value: '>=', position: startPos })
          this.advance()
          this.advance()
          continue
        } else {
          tokens.push({ type: TokenType.GT, value: '>', position: startPos })
          this.advance()
          continue
        }
      }

      if (this.currentChar === '<') {
        if (this.peek() === '=') {
          tokens.push({ type: TokenType.LTE, value: '<=', position: startPos })
          this.advance()
          this.advance()
          continue
        } else {
          tokens.push({ type: TokenType.LT, value: '<', position: startPos })
          this.advance()
          continue
        }
      }

      // Numbers (including negative)
      const nextChar = this.peek()
      if (this.currentChar === '-' && nextChar !== null && /[0-9]/.test(nextChar)) {
        const value = this.readNumber()
        tokens.push({ type: TokenType.NUMBER, value, position: startPos })
        continue
      }

      // Identifiers, keywords, and positive numbers
      if (/[a-zA-Z0-9_.-]/.test(this.currentChar)) {
        const value = this.readIdentifier()
        const lowerValue = value.toLowerCase()

        // Check for boolean literals
        if (lowerValue === 'true' || lowerValue === 'false') {
          tokens.push({ type: TokenType.BOOLEAN, value: lowerValue, position: startPos })
        }
        // Check for logical operators
        else if (lowerValue === 'and') {
          tokens.push({ type: TokenType.AND, value: 'AND', position: startPos })
        } else if (lowerValue === 'or') {
          tokens.push({ type: TokenType.OR, value: 'OR', position: startPos })
        } else if (lowerValue === 'not') {
          tokens.push({ type: TokenType.NOT, value: 'NOT', position: startPos })
        }
        // Check if it's a number
        else if (/^[0-9]/.test(value)) {
          tokens.push({ type: TokenType.NUMBER, value, position: startPos })
        }
        // Otherwise it's an identifier
        else {
          tokens.push({ type: TokenType.IDENTIFIER, value, position: startPos })
        }
        continue
      }

      throw new ParseError(`Unexpected character '${this.currentChar}'`, this.position, this.input)
    }

    tokens.push({ type: TokenType.EOF, value: '', position: this.position })
    return tokens
  }
}

/**
 * Parser for condition expressions using recursive descent
 */
class Parser {
  private tokens: Token[]
  private current: number = 0
  private getFlagValue: (key: string) => FlagValue | undefined

  constructor(tokens: Token[], getFlagValue: (key: string) => FlagValue | undefined) {
    this.tokens = tokens
    this.getFlagValue = getFlagValue
  }

  private currentToken(): Token {
    return this.tokens[this.current] as Token
  }

  private peek(): Token {
    const nextToken = this.tokens[this.current + 1]
    return nextToken ?? (this.tokens[this.tokens.length - 1] as Token)
  }

  private advance(): Token {
    const token = this.currentToken()
    this.current++
    return token
  }

  private expect(type: TokenType): Token {
    const token = this.currentToken()
    if (token.type !== type) {
      throw new ParseError(
        `Expected ${type}, got ${token.type}`,
        token.position,
        this.tokens[0]?.value ?? ''
      )
    }
    return this.advance()
  }

  private isAtEnd(): boolean {
    return this.currentToken().type === TokenType.EOF
  }

  /**
   * Parse the expression
   * Grammar:
   *   expression := orExpr
   *   orExpr := andExpr (OR andExpr)*
   *   andExpr := comparison (AND comparison)*
   *   comparison := unary ((==|!=|>|<|>=|<=) unary)?
   *   unary := (NOT | !) unary | primary
   *   primary := IDENTIFIER | NUMBER | STRING | BOOLEAN | (expression)
   */
  public parse(): boolean {
    if (this.isAtEnd()) {
      throw new ParseError('Condition cannot be empty', 0, '')
    }

    const result = this.parseOrExpr()

    if (!this.isAtEnd()) {
      const token = this.currentToken()
      throw new ParseError(`Unexpected token: ${token.value}`, token.position, '')
    }

    return result
  }

  private parseOrExpr(): boolean {
    let left = this.parseAndExpr()

    while (this.currentToken().type === TokenType.OR) {
      this.advance() // consume OR
      const right = this.parseAndExpr()
      left = left || right
    }

    return left
  }

  private parseAndExpr(): boolean {
    let left = this.parseComparison()

    while (this.currentToken().type === TokenType.AND) {
      this.advance() // consume AND
      const right = this.parseComparison()
      left = left && right
    }

    return left
  }

  private parseComparison(): boolean {
    const left = this.parseUnary()

    const token = this.currentToken()

    if (
      token.type === TokenType.EQ ||
      token.type === TokenType.NEQ ||
      token.type === TokenType.GT ||
      token.type === TokenType.LT ||
      token.type === TokenType.GTE ||
      token.type === TokenType.LTE
    ) {
      const operator = this.advance()
      const right = this.parseUnary()

      return this.evaluateComparison(left, operator.type, right)
    }

    // No comparison operator, just evaluate truthiness
    return this.isTruthy(left)
  }

  private parseUnary(): FlagValue | undefined {
    const token = this.currentToken()

    if (token.type === TokenType.NOT) {
      this.advance()
      const value = this.parseUnary()
      // Return boolean result of negation
      return !this.isTruthy(value)
    }

    return this.parsePrimary()
  }

  private parsePrimary(): FlagValue | undefined {
    const token = this.currentToken()

    if (token.type === TokenType.LPAREN) {
      this.advance() // consume (
      const value = this.parseOrExpr()
      this.expect(TokenType.RPAREN)
      return value
    }

    if (token.type === TokenType.IDENTIFIER) {
      this.advance()
      return this.getFlagValue(token.value)
    }

    if (token.type === TokenType.NUMBER) {
      this.advance()
      return parseFloat(token.value)
    }

    if (token.type === TokenType.STRING) {
      this.advance()
      return token.value
    }

    if (token.type === TokenType.BOOLEAN) {
      this.advance()
      return token.value === 'true'
    }

    if (token.type === TokenType.RPAREN) {
      throw new ParseError('Unexpected closing parenthesis', token.position, '')
    }

    if (token.type === TokenType.EOF) {
      throw new ParseError('Unexpected end of expression', token.position, '')
    }

    throw new ParseError(`Unexpected token: ${token.value}`, token.position, '')
  }

  private isTruthy(value: FlagValue | undefined): boolean {
    if (typeof value === 'boolean') return value
    if (value === undefined) return false
    if (value === 0) return false
    if (value === '') return false
    return true
  }

  private evaluateComparison(
    left: FlagValue | undefined,
    operator: TokenType,
    right: FlagValue | undefined
  ): boolean {
    // Missing flags are treated as 0
    const leftVal = left ?? 0
    const rightVal = right ?? 0

    // Type checking for comparisons
    const leftType = typeof leftVal
    const rightType = typeof rightVal

    // For equality checks
    if (operator === TokenType.EQ) {
      // Type mismatch returns false
      if (leftType !== rightType) return false
      return leftVal === rightVal
    }

    if (operator === TokenType.NEQ) {
      // Type mismatch returns false for != (they are not equal in a type-safe sense)
      if (leftType !== rightType) return false
      return leftVal !== rightVal
    }

    // For ordering operators (>, <, >=, <=)
    // Check if we're comparing strings with strings (or string with anything)
    if (leftType === 'string' && rightType === 'string') {
      // Both strings - not supported, throw error
      throw new ParseError('String ordering not supported for strings', 0, '')
    }

    // String vs non-string comparison for ordering returns false (type mismatch)
    if (leftType === 'string' || rightType === 'string') {
      return false
    }

    // Type mismatch for numeric comparisons returns false
    if (leftType !== 'number' || rightType !== 'number') {
      return false
    }

    const leftNum = leftVal as number
    const rightNum = rightVal as number

    switch (operator) {
      case TokenType.GT:
        return leftNum > rightNum
      case TokenType.LT:
        return leftNum < rightNum
      case TokenType.GTE:
        return leftNum >= rightNum
      case TokenType.LTE:
        return leftNum <= rightNum
      default:
        throw new ParseError(`Unknown operator: ${operator}`, 0, '')
    }
  }
}

/**
 * Parse and evaluate a condition expression
 *
 * @param expression - The condition expression to evaluate
 * @param getFlagValue - Function to retrieve flag values
 * @returns The boolean result of evaluating the condition
 *
 * @throws {ParseError} If the expression has invalid syntax
 */
export function parseCondition(
  expression: string,
  getFlagValue: (key: string) => FlagValue | undefined
): boolean {
  // Trim and validate
  const trimmed = expression.trim()
  if (trimmed === '') {
    throw new ParseError('Condition cannot be empty', 0, expression)
  }

  // Tokenize
  const tokenizer = new Tokenizer(trimmed)
  const tokens = tokenizer.tokenize()

  // Parse and evaluate
  const parser = new Parser(tokens, getFlagValue)
  return parser.parse()
}
