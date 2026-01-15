var q = Object.defineProperty;
var tt = (o, e, s) => e in o ? q(o, e, { enumerable: !0, configurable: !0, writable: !0, value: s }) : o[e] = s;
var T = (o, e, s) => tt(o, typeof e != "symbol" ? e + "" : e, s);
class Q extends Error {
  constructor(e) {
    super(e), this.name = "FlagsError", Object.setPrototypeOf(this, new.target.prototype);
  }
}
class w extends Q {
  constructor(e, s) {
    super(e), this.field = s, this.name = "ValidationError";
  }
}
class g extends Q {
  constructor(e, s, h) {
    super(e), this.position = s, this.input = h, this.name = "ParseError";
  }
}
class et {
  constructor(e) {
    T(this, "input");
    T(this, "position", 0);
    T(this, "currentChar");
    this.input = e, this.currentChar = e.length > 0 ? e[0] ?? null : null;
  }
  advance() {
    this.position++, this.currentChar = this.position < this.input.length ? this.input[this.position] ?? null : null;
  }
  peek(e = 1) {
    const s = this.position + e;
    return s < this.input.length ? this.input[s] ?? null : null;
  }
  skipWhitespace() {
    for (; this.currentChar !== null && /\s/.test(this.currentChar); )
      this.advance();
  }
  readString(e) {
    let s = "";
    for (this.advance(); this.currentChar !== null && this.currentChar !== e; ) {
      const h = this.currentChar;
      if (h === "\\") {
        this.advance();
        const u = this.currentChar;
        if (!u)
          throw new g("Unterminated string escape", this.position, this.input);
        switch (u) {
          case "n":
            s += `
`;
            break;
          case "t":
            s += "	";
            break;
          case "r":
            s += "\r";
            break;
          default:
            s += u;
        }
        this.advance();
      } else
        s += h, this.advance();
    }
    if (this.currentChar !== e)
      throw new g("Unterminated string literal", this.position, this.input);
    return this.advance(), s;
  }
  readNumber() {
    const e = this.position;
    let s = !1;
    for (this.currentChar === "-" && this.advance(); this.currentChar !== null && /[0-9.]/.test(this.currentChar); ) {
      if (this.currentChar === ".") {
        if (s)
          throw new g("Invalid number format", e, this.input);
        s = !0;
      }
      this.advance();
    }
    return this.input.slice(e, this.position);
  }
  readIdentifier() {
    const e = this.position;
    for (; this.currentChar !== null && /[a-zA-Z0-9_.-]/.test(this.currentChar); )
      this.advance();
    return this.input.slice(e, this.position);
  }
  tokenize() {
    const e = [];
    for (; this.currentChar !== null && (this.skipWhitespace(), !!this.currentChar); ) {
      const s = this.position;
      if (this.currentChar === '"' || this.currentChar === "'") {
        const u = this.currentChar, l = this.readString(u);
        e.push({ type: "STRING", value: l, position: s });
        continue;
      }
      if (this.currentChar === "(") {
        e.push({ type: "LPAREN", value: "(", position: s }), this.advance();
        continue;
      }
      if (this.currentChar === ")") {
        e.push({ type: "RPAREN", value: ")", position: s }), this.advance();
        continue;
      }
      if (this.currentChar === "!")
        if (this.peek() === "=") {
          e.push({ type: "NEQ", value: "!=", position: s }), this.advance(), this.advance();
          continue;
        } else {
          e.push({ type: "NOT", value: "!", position: s }), this.advance();
          continue;
        }
      if (this.currentChar === "=" && this.peek() === "=") {
        e.push({ type: "EQ", value: "==", position: s }), this.advance(), this.advance();
        continue;
      }
      if (this.currentChar === ">")
        if (this.peek() === "=") {
          e.push({ type: "GTE", value: ">=", position: s }), this.advance(), this.advance();
          continue;
        } else {
          e.push({ type: "GT", value: ">", position: s }), this.advance();
          continue;
        }
      if (this.currentChar === "<")
        if (this.peek() === "=") {
          e.push({ type: "LTE", value: "<=", position: s }), this.advance(), this.advance();
          continue;
        } else {
          e.push({ type: "LT", value: "<", position: s }), this.advance();
          continue;
        }
      const h = this.peek();
      if (this.currentChar === "-" && h !== null && /[0-9]/.test(h)) {
        const u = this.readNumber();
        e.push({ type: "NUMBER", value: u, position: s });
        continue;
      }
      if (/[a-zA-Z0-9_.-]/.test(this.currentChar)) {
        const u = this.readIdentifier(), l = u.toLowerCase();
        l === "true" || l === "false" ? e.push({ type: "BOOLEAN", value: l, position: s }) : l === "and" ? e.push({ type: "AND", value: "AND", position: s }) : l === "or" ? e.push({ type: "OR", value: "OR", position: s }) : l === "not" ? e.push({ type: "NOT", value: "NOT", position: s }) : /^[0-9]/.test(u) ? e.push({ type: "NUMBER", value: u, position: s }) : e.push({ type: "IDENTIFIER", value: u, position: s });
        continue;
      }
      throw new g(`Unexpected character '${this.currentChar}'`, this.position, this.input);
    }
    return e.push({ type: "EOF", value: "", position: this.position }), e;
  }
}
class rt {
  constructor(e, s) {
    T(this, "tokens");
    T(this, "current", 0);
    T(this, "getFlagValue");
    this.tokens = e, this.getFlagValue = s;
  }
  currentToken() {
    return this.tokens[this.current];
  }
  peek() {
    return this.tokens[this.current + 1] ?? this.tokens[this.tokens.length - 1];
  }
  advance() {
    const e = this.currentToken();
    return this.current++, e;
  }
  expect(e) {
    var h;
    const s = this.currentToken();
    if (s.type !== e)
      throw new g(
        `Expected ${e}, got ${s.type}`,
        s.position,
        ((h = this.tokens[0]) == null ? void 0 : h.value) ?? ""
      );
    return this.advance();
  }
  isAtEnd() {
    return this.currentToken().type === "EOF";
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
  parse() {
    if (this.isAtEnd())
      throw new g("Condition cannot be empty", 0, "");
    const e = this.parseOrExpr();
    if (!this.isAtEnd()) {
      const s = this.currentToken();
      throw new g(`Unexpected token: ${s.value}`, s.position, "");
    }
    return e;
  }
  parseOrExpr() {
    let e = this.parseAndExpr();
    for (; this.currentToken().type === "OR"; ) {
      this.advance();
      const s = this.parseAndExpr();
      e = e || s;
    }
    return e;
  }
  parseAndExpr() {
    let e = this.parseComparison();
    for (; this.currentToken().type === "AND"; ) {
      this.advance();
      const s = this.parseComparison();
      e = e && s;
    }
    return e;
  }
  parseComparison() {
    const e = this.parseUnary(), s = this.currentToken();
    if (s.type === "EQ" || s.type === "NEQ" || s.type === "GT" || s.type === "LT" || s.type === "GTE" || s.type === "LTE") {
      const h = this.advance(), u = this.parseUnary();
      return this.evaluateComparison(e, h.type, u);
    }
    return this.isTruthy(e);
  }
  parseUnary() {
    if (this.currentToken().type === "NOT") {
      this.advance();
      const s = this.parseUnary();
      return !this.isTruthy(s);
    }
    return this.parsePrimary();
  }
  parsePrimary() {
    const e = this.currentToken();
    if (e.type === "LPAREN") {
      this.advance();
      const s = this.parseOrExpr();
      return this.expect(
        "RPAREN"
        /* RPAREN */
      ), s;
    }
    if (e.type === "IDENTIFIER")
      return this.advance(), this.getFlagValue(e.value);
    if (e.type === "NUMBER")
      return this.advance(), parseFloat(e.value);
    if (e.type === "STRING")
      return this.advance(), e.value;
    if (e.type === "BOOLEAN")
      return this.advance(), e.value === "true";
    throw e.type === "RPAREN" ? new g("Unexpected closing parenthesis", e.position, "") : e.type === "EOF" ? new g("Unexpected end of expression", e.position, "") : new g(`Unexpected token: ${e.value}`, e.position, "");
  }
  isTruthy(e) {
    return typeof e == "boolean" ? e : !(e === void 0 || e === 0 || e === "");
  }
  evaluateComparison(e, s, h) {
    const u = e ?? 0, l = h ?? 0, b = typeof u, d = typeof l;
    if (s === "EQ")
      return b !== d ? !1 : u === l;
    if (s === "NEQ")
      return b !== d ? !1 : u !== l;
    if (b === "string" && d === "string")
      throw new g("String ordering not supported for strings", 0, "");
    if (b === "string" || d === "string" || b !== "number" || d !== "number")
      return !1;
    const m = u, y = l;
    switch (s) {
      case "GT":
        return m > y;
      case "LT":
        return m < y;
      case "GTE":
        return m >= y;
      case "LTE":
        return m <= y;
      default:
        throw new g(`Unknown operator: ${s}`, 0, "");
    }
  }
}
function nt(o, e) {
  const s = o.trim();
  if (s === "")
    throw new g("Condition cannot be empty", 0, o);
  const u = new et(s).tokenize();
  return new rt(u, e).parse();
}
const st = "@motioneffector/flags", j = 100, z = 1e3, H = 1e5, B = 1e4, it = ["and", "or", "not"], k = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]), ot = [">", "<", ">=", "<=", "==", "!=", "!"];
function v(o) {
  if (o === "")
    throw new w("Key cannot be empty", "key");
  if (o.length > z)
    throw new w(
      `Key exceeds maximum length of ${z}. Received length: ${o.length}`,
      "key"
    );
  if (o.includes(" "))
    throw new w(`Key cannot contain spaces. Received: "${o}"`, "key");
  if (o.startsWith("!"))
    throw new w(`Key cannot start with '!'. Received: "${o}"`, "key");
  if (k.has(o))
    throw new w(
      `Key cannot be a prototype property (__proto__, constructor, prototype). Received: "${o}"`,
      "key"
    );
  for (const s of ot)
    if (o.includes(s))
      throw new w(
        `Key cannot contain comparison operators. Received: "${o}"`,
        "key"
      );
  const e = o.toLowerCase();
  if (it.includes(e))
    throw new w(
      `Key cannot be a reserved word (AND, OR, NOT). Received: "${o}"`,
      "key"
    );
}
function S(o) {
  const e = typeof o;
  if (e !== "boolean" && e !== "number" && e !== "string")
    throw new w(
      `Value must be boolean, number, or string. Received: ${e}`,
      "value"
    );
  if (e === "number" && !Number.isFinite(o))
    throw new w(
      "Number values must be finite (not NaN, Infinity, or -Infinity)",
      "value"
    );
  if (e === "string") {
    const s = o;
    if (s.length > H)
      throw new w(
        `String value exceeds maximum length of ${H}. Received length: ${s.length}`,
        "value"
      );
  }
}
function ut(o) {
  var M, P, G;
  const e = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map(), h = [], u = /* @__PURE__ */ new Map(), l = (o == null ? void 0 : o.history) !== void 0 && o.history !== !1, b = typeof (o == null ? void 0 : o.history) == "object" ? o.history.maxHistory ?? j : j, d = [], m = [], y = (o == null ? void 0 : o.persist) !== void 0, E = (M = o == null ? void 0 : o.persist) == null ? void 0 : M.storage, F = ((P = o == null ? void 0 : o.persist) == null ? void 0 : P.key) ?? st, X = ((G = o == null ? void 0 : o.persist) == null ? void 0 : G.autoSave) !== !1;
  let p = 0, O = null, _ = [];
  function V() {
    return new Map(e);
  }
  function K(t) {
    const n = [];
    for (const [r, i] of e.entries())
      !t.has(r) && !s.has(r) && n.push({ key: r, newValue: void 0, oldValue: i });
    for (const [r, i] of t.entries()) {
      const a = e.get(r);
      a !== i && n.push({ key: r, newValue: i, oldValue: a });
    }
    e.clear();
    for (const [r, i] of t.entries())
      e.set(r, i);
    x();
    for (const r of n)
      C(r.key, r.newValue, r.oldValue);
  }
  function R() {
    if (!l) return;
    const t = V();
    d.push({ state: t }), d.length > b && d.shift(), m.length = 0;
  }
  function C(t, n, r) {
    if (p > 0) {
      _.push({ key: t, newValue: n, oldValue: r });
      return;
    }
    Y(t, n, r);
  }
  function Y(t, n, r) {
    U(t, n, r), L(t, n, r);
  }
  function U(t, n, r) {
    const i = [...h];
    for (const a of i)
      if (h.includes(a))
        try {
          a(t, n, r);
        } catch (f) {
          console.error("Subscriber error:", f);
        }
  }
  function L(t, n, r) {
    const i = u.get(t);
    if (i) {
      const a = [...i];
      for (const f of a)
        if (i.includes(f))
          try {
            f(n, r);
          } catch (N) {
            console.error("Key subscriber error:", N);
          }
    }
  }
  function $() {
    if (!(!y || !E || !X))
      try {
        const t = {};
        for (const [n, r] of e.entries())
          t[n] = r;
        E.setItem(F, JSON.stringify(t));
      } catch (t) {
        console.error("Failed to persist state:", t);
      }
  }
  function J() {
    if (!(!y || !E))
      try {
        const t = E.getItem(F);
        if (t === null) return;
        const n = JSON.parse(t);
        for (const r of Object.keys(n)) {
          if (k.has(r) || !Object.hasOwn(n, r)) continue;
          const i = n[r];
          v(r), S(i), e.set(r, i);
        }
      } catch (t) {
        console.error("Failed to load state from storage:", t);
      }
  }
  function D(t) {
    const n = s.get(t);
    if (n)
      try {
        const r = n.dependencies.map((f) => e.get(f));
        let i = n.fn(...r);
        typeof i == "number" && (isNaN(i) ? i = 0 : isFinite(i) || (i = i > 0 ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER));
        const a = e.get(t);
        i !== a && (e.set(t, i), C(t, i, a));
      } catch (r) {
        console.error(`Error computing flag '${t}':`, r);
      }
  }
  function I(t) {
    for (const [n, r] of s.entries())
      r.dependencies.includes(t) && D(n);
  }
  function x() {
    for (const t of s.keys())
      D(t);
  }
  function A(t) {
    return s.has(t);
  }
  if (o != null && o.initial)
    for (const [t, n] of Object.entries(o.initial))
      v(t), S(n), e.set(t, n);
  J();
  const c = {
    set(t, n) {
      if (t = t.trim(), v(t), A(t))
        throw new Error(`Cannot set computed flag: ${t}`);
      if (n == null)
        return c.delete(t);
      S(n);
      const r = e.get(t);
      return p === 0 && R(), e.set(t, n), I(t), C(t, n, r), p === 0 && $(), c;
    },
    get(t) {
      return t = t.trim(), e.get(t);
    },
    has(t) {
      return t = t.trim(), e.has(t);
    },
    delete(t) {
      if (t = t.trim(), A(t))
        throw new Error(`Cannot delete computed flag: ${t}`);
      const n = e.get(t);
      return e.has(t) && (p === 0 && R(), e.delete(t), I(t), C(t, void 0, n), p === 0 && $()), c;
    },
    clear() {
      return p === 0 && R(), e.clear(), x(), C("__clear__", void 0, void 0), p === 0 && $(), c;
    },
    toggle(t) {
      if (t = t.trim(), v(t), A(t))
        throw new Error(`Cannot toggle computed flag: ${t}`);
      const n = e.get(t);
      if (n === void 0)
        return c.set(t, !0), !0;
      if (typeof n != "boolean")
        throw new TypeError(`Cannot toggle non-boolean flag: ${t}`);
      const r = !n;
      return c.set(t, r), r;
    },
    increment(t, n = 1) {
      if (t = t.trim(), v(t), A(t))
        throw new Error(`Cannot increment computed flag: ${t}`);
      const r = e.get(t);
      if (r === void 0) {
        const a = n;
        return c.set(t, a), a;
      }
      if (typeof r != "number")
        throw new TypeError(`Cannot increment non-numeric flag: ${t}`);
      const i = r + n;
      return c.set(t, i), i;
    },
    decrement(t, n = 1) {
      if (t = t.trim(), v(t), A(t))
        throw new Error(`Cannot decrement computed flag: ${t}`);
      const r = e.get(t);
      if (r === void 0) {
        const a = -n;
        return c.set(t, a), a;
      }
      if (typeof r != "number")
        throw new TypeError(`Cannot decrement non-numeric flag: ${t}`);
      const i = r - n;
      return c.set(t, i), i;
    },
    all() {
      const t = {};
      for (const [n, r] of e.entries())
        t[n] = r;
      return t;
    },
    keys() {
      return Array.from(e.keys());
    },
    setMany(t) {
      for (const n of Object.keys(t)) {
        const r = n.trim();
        v(r);
      }
      p === 0 && R();
      for (const [n, r] of Object.entries(t)) {
        const i = n.trim();
        r == null ? e.has(i) && (e.delete(i), I(i)) : (S(r), e.set(i, r), I(i));
      }
      return C("__setMany__", void 0, void 0), p === 0 && $(), c;
    },
    check(t) {
      if (t.length > B)
        throw new w(
          `Condition exceeds maximum length of ${B}. Received length: ${t.length}`,
          "condition"
        );
      return nt(t, (n) => c.get(n));
    },
    subscribe(t) {
      h.push(t);
      let n = !1;
      return () => {
        if (n) return;
        n = !0;
        const r = h.indexOf(t);
        r !== -1 && h.splice(r, 1);
      };
    },
    subscribeKey(t, n) {
      t = t.trim(), u.has(t) || u.set(t, []);
      const r = u.get(t);
      r == null || r.push(n);
      let i = !1;
      return () => {
        if (i) return;
        i = !0;
        const a = u.get(t);
        if (a) {
          const f = a.indexOf(n);
          f !== -1 && a.splice(f, 1), a.length === 0 && u.delete(t);
        }
      };
    },
    namespace(t) {
      t = t.trim();
      const n = {
        set(r, i) {
          return c.set(`${t}.${r}`, i), n;
        },
        get(r) {
          return c.get(`${t}.${r}`);
        },
        has(r) {
          return c.has(`${t}.${r}`);
        },
        delete(r) {
          return c.delete(`${t}.${r}`), n;
        },
        clear() {
          const r = c.keys().filter((i) => i.startsWith(`${t}.`));
          for (const i of r)
            c.delete(i);
          return n;
        },
        toggle(r) {
          return c.toggle(`${t}.${r}`);
        },
        increment(r, i) {
          return c.increment(`${t}.${r}`, i);
        },
        decrement(r, i) {
          return c.decrement(`${t}.${r}`, i);
        },
        all() {
          const r = {}, i = `${t}.`;
          for (const [a, f] of e.entries())
            if (a.startsWith(i)) {
              const N = a.slice(i.length);
              r[N] = f;
            }
          return r;
        },
        keys() {
          const r = `${t}.`;
          return c.keys().filter((i) => i.startsWith(r)).map((i) => i.slice(r.length));
        },
        setMany(r) {
          const i = {};
          for (const [a, f] of Object.entries(r))
            i[`${t}.${a}`] = f;
          return c.setMany(i), n;
        },
        check(r) {
          return c.check(at(r, t));
        },
        subscribe(r) {
          const i = (a, f, N) => {
            const W = `${t}.`;
            if (a.startsWith(W)) {
              const Z = a.slice(W.length);
              r(Z, f, N);
            }
          };
          return c.subscribe(i);
        },
        subscribeKey(r, i) {
          return c.subscribeKey(`${t}.${r}`, i);
        },
        namespace(r) {
          return c.namespace(`${t}.${r}`);
        },
        batch(r) {
          return c.batch(r);
        },
        compute(r, i, a) {
          const f = i.map((N) => `${t}.${N}`);
          c.compute(`${t}.${r}`, f, a);
        }
      };
      return n;
    },
    batch(t) {
      p++, p === 1 && (O = V(), _ = [], R());
      try {
        const n = t();
        if (p--, p === 0) {
          for (const r of _)
            L(r.key, r.newValue, r.oldValue);
          U("__batch__", void 0, void 0), $(), O = null, _ = [];
        }
        return n;
      } catch (n) {
        if (p === 1 && O) {
          e.clear();
          for (const [r, i] of O.entries())
            e.set(r, i);
          x();
        }
        throw p--, p === 0 && (O = null, _ = []), n;
      }
    },
    compute(t, n, r) {
      if (t = t.trim(), v(t), n.includes(t))
        throw new Error(`Computed flag cannot depend on itself: ${t}`);
      for (const i of n) {
        const a = s.get(i);
        if (a != null && a.dependencies.includes(t))
          throw new Error(`Circular dependency detected: ${t} <-> ${i}`);
      }
      s.set(t, { dependencies: n, fn: r }), D(t);
    }
  };
  if (l) {
    const t = c;
    t.undo = () => {
      if (d.length === 0)
        return !1;
      const n = V();
      m.push({ state: n });
      const r = d.pop();
      return r && (K(r.state), $()), !0;
    }, t.redo = () => {
      if (m.length === 0)
        return !1;
      const n = V();
      d.push({ state: n });
      const r = m.pop();
      return r && (K(r.state), $()), !0;
    }, t.canUndo = () => d.length > 0, t.canRedo = () => m.length > 0, t.clearHistory = () => {
      d.length = 0, m.length = 0;
    };
  }
  if (y) {
    const t = c;
    t.save = () => {
      if (E)
        try {
          const n = {};
          for (const [r, i] of e.entries())
            n[r] = i;
          E.setItem(F, JSON.stringify(n));
        } catch (n) {
          console.error("Failed to save state:", n);
        }
    }, t.load = () => {
      if (E)
        try {
          const n = E.getItem(F);
          if (n === null) return;
          const r = JSON.parse(n);
          e.clear();
          for (const i of Object.keys(r)) {
            if (k.has(i) || !Object.hasOwn(r, i)) continue;
            const a = r[i], f = e.get(i);
            v(i), S(a), e.set(i, a), C(i, a, f);
          }
          x();
        } catch (n) {
          console.error("Failed to load state:", n);
        }
    };
  }
  return c;
}
function at(o, e) {
  const s = o.match(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:AND|OR|NOT|and|or|not|true|false|TRUE|FALSE)\b|\d+\.?\d*|[a-zA-Z_][a-zA-Z0-9_.-]*|[()!<>=]+)/gi
  );
  if (!s) return o;
  const h = [], u = /* @__PURE__ */ new Set(["and", "or", "not", "true", "false"]);
  for (const l of s)
    l.startsWith('"') || l.startsWith("'") || /^[0-9]/.test(l) || /^[()!<>=]+$/.test(l) || u.has(l.toLowerCase()) ? h.push(l) : h.push(`${e}.${l}`);
  return h.join(" ");
}
export {
  Q as FlagsError,
  g as ParseError,
  w as ValidationError,
  ut as createFlagStore
};
