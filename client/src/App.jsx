import { Component, useEffect, useState } from "react";
import api from "./api/client.js";
import { formatMoney } from "./utils/money.js";

const errorText = (error) =>
  error.response?.data?.error?.message ||
  "Something went wrong. Please try again.";

const card = "rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30";
const fieldLabel = "block font-label-sm text-label-sm text-on-surface-variant mb-1";
const textInput =
  "w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";
const primaryButton =
  "w-full h-10 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg transition-colors flex items-center justify-center gap-2";

function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <div
      className="p-3 rounded-lg bg-error-container text-on-error-container flex items-start gap-2"
      role="alert"
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[18px] flex-shrink-0 mt-0.5">
        error
      </span>
      <span className="font-body-sm text-body-sm">{children}</span>
    </div>
  );
}

// Any render-time throw would otherwise unmount the whole tree and leave a
// blank page. This keeps the app usable and offers a way back.
class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(previous) {
    if (previous.resetKey !== this.props.resetKey && this.state.failed)
      this.setState({ failed: false });
  }

  retry = () => {
    this.setState({ failed: false });
    this.props.onRetry?.();
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className={`${card} p-8 max-w-md w-full text-center`}>
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-error text-[40px]"
          >
            error
          </span>
          <h1 className="font-headline-sm text-headline-sm text-on-surface mt-2">
            Something went wrong
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            This screen hit an unexpected error. Your data is safe.
          </p>
          <button
            className={`${primaryButton} mt-6`}
            onClick={this.retry}
            type="button"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }
}

function AuthLayout({ children, mode, onSwitch, error }) {
  return (
    <div className="flex min-h-[calc(100vh-2rem)] items-center justify-center p-4">
      <main className="w-full max-w-md mx-auto">
        <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm p-6 sm:p-8 relative overflow-hidden transition-all duration-300">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <img alt="ExpenseEase Logo" className="h-10 w-auto object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDeWOAUfRgDfz8uAO-K42O7SO0YBLTSc9R18MVtWtTw2vZq4Xs0amVI2bhXdgeQwCdvKPbhX_2zi6Oh231fAu10bJ3virteB_xrw64BMv7uKHzO4F_a-RiAMS3BXpET7FBnfMkzlk2-z-GUoSeuVxk8AakhegoedNFtbbZ1-kwD8SpEd4lU3gaUsVcaU9P3OW795ullFywF1nPp1R4XMQJtrOjZFLXgcHeC42Y8_0JMItK0BA-iQjYE"/>
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">ExpenseEase</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
              Split group expenses peacefully with friends & roommates.
            </p>
          </div>
          
          <div className="flex p-1 bg-surface-container-low rounded-lg mb-6">
            <button 
              className={`flex-1 py-2 text-center font-label-lg text-label-lg rounded transition-colors duration-150 ${mode === 'login' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              onClick={mode === 'register' ? onSwitch : undefined} type="button">
              Sign in
            </button>
            <button 
              className={`flex-1 py-2 text-center font-label-lg text-label-lg rounded transition-colors duration-150 ${mode === 'register' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              onClick={mode === 'login' ? onSwitch : undefined} type="button">
              Create account
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-error-container text-on-error-container flex items-start gap-2.5 animate-fadeIn" role="alert">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-error flex-shrink-0 mt-0.5">error</span>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-error uppercase tracking-wider font-semibold">Authentication Error</span>
                <span className="font-body-sm text-body-sm">{error}</span>
              </div>
            </div>
          )}

          {children}

          <div className="mt-6 pt-5 text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              <span>{mode === 'login' ? "Don't have an account?" : "Already have an account?"}</span>
              <button className="font-label-lg text-label-lg text-primary hover:underline ml-1 focus:outline-none" onClick={onSwitch} type="button">
                {mode === 'login' ? "Create your account" : "Sign in instead"}
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Login({ onLogin, onSwitch }) {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showResetHelp, setShowResetHelp] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const data = new FormData(e.target);
    try {
      const result = await api.post("/auth/login", {
        email: data.get("email"),
        password: data.get("password"),
      });
      localStorage.setItem("expenseEaseToken", result.data.token);
      onLogin(result.data.user);
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <AuthLayout mode="login" onSwitch={onSwitch} error={error}>
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="block font-label-lg text-label-lg text-on-surface mb-1.5" htmlFor="email">Email address</label>
          <div className="relative">
            <input name="email" type="email" id="email" defaultValue="asha@demo.local" required className="w-full h-11 px-3.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="rahul@collegemail.edu" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block font-label-lg text-label-lg text-on-surface" htmlFor="password">Password</label>
            <button
              type="button"
              onClick={() => setShowResetHelp((v) => !v)}
              aria-expanded={showResetHelp}
              className="font-body-sm text-body-sm text-primary hover:text-primary-container transition-colors"
            >
              Forgot?
            </button>
          </div>
          {showResetHelp && (
            <div className="mb-2.5 rounded-lg border border-outline-variant bg-surface-container-low p-3 text-body-sm text-body-sm text-on-surface-variant space-y-2">
              <p>
                Password resets are handled by your workspace admin, so there is no reset link to
                email you. Sign in with a demo account, or create a new one if you are new here.
              </p>
              <button
                type="button"
                onClick={() => setShowResetHelp(false)}
                className="font-label-md text-label-md text-primary hover:underline"
              >
                Got it
              </button>
            </div>
          )}
          <div className="relative flex items-center">
            <input name="password" id="password" type={showPassword ? "text" : "password"} defaultValue="Demo@1234" required className="w-full h-11 pl-3.5 pr-11 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="••••••••••••" />
            <button aria-label={showPassword ? "Hide password" : "Show password"} type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-outline hover:text-on-surface transition-colors">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
            </button>
          </div>
        </div>
        <div className="pt-2">
          <button type="submit" className="w-full h-11 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg transition-all duration-150 shadow-sm active:scale-[0.99] flex items-center justify-center gap-2">
            <span>Log in</span>
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </form>
      
      <div className="mt-6 p-3.5 rounded-lg bg-surface-container-low text-on-surface-variant flex items-start gap-2.5">
        <span aria-hidden="true" className="material-symbols-outlined text-[18px] text-primary flex-shrink-0 mt-0.5">key</span>
        <div className="flex flex-col w-full text-left">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider text-primary">Demo Credentials</span>
          </div>
          <p className="font-body-sm text-body-sm mt-0.5 select-all">
            <span className="font-medium text-on-surface">Email:</span> asha@demo.local &nbsp;•&nbsp; <span className="font-medium text-on-surface">Password:</span> Demo@1234
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

function Register({ onLogin, onSwitch }) {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const data = new FormData(e.target);
    try {
      const result = await api.post("/auth/register", {
        name: data.get("name"),
        email: data.get("email"),
        password: data.get("password"),
      });
      localStorage.setItem("expenseEaseToken", result.data.token);
      onLogin(result.data.user);
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <AuthLayout mode="register" onSwitch={onSwitch} error={error}>
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="block font-label-lg text-label-lg text-on-surface mb-1.5" htmlFor="name">Full Name</label>
          <div className="relative">
            <input name="name" type="text" id="name" required maxLength={100} autoComplete="name" className="w-full h-11 px-3.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Rahul Sharma" />
          </div>
        </div>
        <div>
          <label className="block font-label-lg text-label-lg text-on-surface mb-1.5" htmlFor="email">Email address</label>
          <div className="relative">
            <input name="email" type="email" id="email" required autoComplete="email" className="w-full h-11 px-3.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="rahul@collegemail.edu" />
          </div>
        </div>
        <div>
          <label className="block font-label-lg text-label-lg text-on-surface mb-1.5" htmlFor="password">Password</label>
          <div className="relative flex items-center">
            <input name="password" id="password" type={showPassword ? "text" : "password"} required minLength={8} autoComplete="new-password" className="w-full h-11 pl-3.5 pr-11 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder:text-outline shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="••••••••••••" />
            <button aria-label={showPassword ? "Hide password" : "Show password"} type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-0 bottom-0 px-3 flex items-center justify-center text-outline hover:text-on-surface transition-colors">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
            </button>
          </div>
        </div>
        <div className="pt-2">
          <button type="submit" className="w-full h-11 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg transition-all duration-150 shadow-sm active:scale-[0.99] flex items-center justify-center gap-2">
            <span>Sign Up</span>
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}

function Header({ user, onLogout }) {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface-container-lowest border-b border-outline-variant/40">
      <div className="h-16 max-w-5xl mx-auto px-margin md:px-margin-md lg:px-space-xl flex items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-md min-w-0">
          <a className="flex items-center gap-space-sm group shrink-0" href="#">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-on-primary transition-transform group-hover:scale-95">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
            <div className="flex flex-col">
              <span className="font-title-md text-title-md text-on-surface leading-tight tracking-tight">ExpenseEase</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant hidden sm:inline">Shared Student Splitter</span>
            </div>
          </a>
        </div>
        <div className="flex items-center gap-space-md">
          <div className="flex items-center gap-space-sm pl-space-xs">
            <div className="flex items-center gap-space-xs">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span aria-hidden="true" className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </div>
              <span className="font-label-lg text-label-lg text-on-surface hidden md:inline truncate max-w-[110px]">{user?.name}</span>
            </div>
            <button className="font-label-lg text-label-lg text-on-surface-variant hover:text-error px-space-xs py-space-xs transition-colors" onClick={onLogout}>
              Log out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function DashboardSummary({ summary, user }) {
  if (!summary) return null;

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
        <div className="space-y-space-xs">
          <div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container-high text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">Active Ledger • Realtime Sync</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Hey {user.name} <span className="inline-block transform hover:rotate-12 transition-transform cursor-default">👋</span></h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
            Here is your overall shared balance across all groups. Keep settlements simple, prompt, and stress-free.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md mb-space-lg">
        {/* You Owe Card */}
        <div className="relative overflow-hidden rounded-xl bg-error-container/40 p-space-lg shadow-sm flex flex-col justify-between transition-all duration-200 hover:shadow-md">
          <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full bg-error/5 pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between gap-space-sm mb-space-md">
              <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold">
                <span aria-hidden="true" className="material-symbols-outlined text-[14px]">arrow_outward</span> Owed by you
              </span>
            </div>
            <div className="space-y-space-xs">
              <div className="font-currency-display text-currency-display font-semibold text-error tracking-tight">
                {formatMoney(summary.youOwePaise)}
              </div>
            </div>
          </div>
        </div>

        {/* You Are Owed Card */}
        <div className="relative overflow-hidden rounded-xl bg-tertiary-container/15 p-space-lg shadow-sm flex flex-col justify-between transition-all duration-200 hover:shadow-md">
          <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full bg-tertiary/5 pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between gap-space-sm mb-space-md">
              <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                <span aria-hidden="true" className="material-symbols-outlined text-[14px]">south_west</span> Owed to you
              </span>
            </div>
            <div className="space-y-space-xs">
              <div className="font-currency-display text-currency-display font-semibold text-tertiary tracking-tight">
                {formatMoney(summary.youAreOwedPaise)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CreateGroup({ onCreated }) {
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const form = new FormData(e.target);
    try {
      const result = await api.post("/groups", {
        name: form.get("name"),
        description: form.get("description") || "",
      });
      e.target.reset();
      onCreated(result.data.group);
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <div className="rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 overflow-hidden">
      <div className="p-space-md border-b border-outline-variant/30 bg-surface-container-lowest flex items-center justify-between">
        <div className="flex items-center gap-space-xs">
          <span aria-hidden="true" className="material-symbols-outlined text-primary text-[20px]">add_circle</span>
          <h3 className="font-title-md text-title-md font-semibold text-on-surface">Create a group</h3>
        </div>
      </div>
      <div className="p-space-md">
        <form className="space-y-space-md" onSubmit={submit}>
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1" htmlFor="name">Group Name</label>
            <input name="name" required className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" id="name" placeholder="e.g. Goa Trip 2024" type="text" />
          </div>
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1" htmlFor="description">Description (Optional)</label>
            <textarea name="description" className="w-full p-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none" id="description" placeholder="What's this group for?" rows="2"></textarea>
          </div>
          {error && (
            <p className="text-error font-body-sm text-body-sm" role="alert">
              {error}
            </p>
          )}
          <button className="w-full h-10 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-lg transition-colors flex items-center justify-center gap-2" type="submit">
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">group_add</span>
            Create Group
          </button>
        </form>
      </div>
    </div>
  );
}

function AddMember({ group, onDone }) {
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const form = new FormData(e.target);
    try {
      await api.post("/groups/" + group.id + "/members", {
        email: form.get("email"),
      });
      e.target.reset();
      onDone();
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <section className={`${card} overflow-hidden`}>
      <div className="p-space-md border-b border-outline-variant/30 flex items-center gap-space-xs">
        <span aria-hidden="true" className="material-symbols-outlined text-primary text-[20px]">
          person_add
        </span>
        <h3 className="font-title-md text-title-md font-semibold text-on-surface">
          Add member
        </h3>
      </div>
      <div className="p-space-md">
        <form className="space-y-space-sm" onSubmit={submit}>
          <div>
            <label className={fieldLabel} htmlFor="member-email">
              Email
            </label>
            <input
              className={textInput}
              id="member-email"
              name="email"
              placeholder="friend@demo.local"
              required
              type="email"
            />
          </div>
          <ErrorNote>{error}</ErrorNote>
          <button className={primaryButton} type="submit">
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
              person_add
            </span>
            Add
          </button>
        </form>
      </div>
    </section>
  );
}

const SPLIT_TYPES = [
  { value: "EQUAL", label: "Equal" },
  { value: "EXACT", label: "Exact" },
  { value: "PERCENT", label: "Percentage" },
];

function readParticipants(form, members, splitType, amountPaise) {
  const participants = members.map((member) => {
    const userId = Number(member.user.id);
    if (splitType === "EXACT")
      return {
        userId,
        sharePaise: Math.round(Number(form.get(`exact-${userId}`) || 0) * 100),
      };
    if (splitType === "PERCENT")
      return { userId, percent: Number(form.get(`percent-${userId}`) || 0) };
    return { userId };
  });

  if (splitType === "EXACT") {
    const total = participants.reduce((sum, p) => sum + p.sharePaise, 0);
    if (total !== amountPaise)
      return { error: `Exact shares must total ${formatMoney(amountPaise)}.` };
  }

  if (splitType === "PERCENT") {
    if (participants.some((p) => !Number.isInteger(p.percent)))
      return { error: "Percentages must be whole numbers." };
    const total = participants.reduce((sum, p) => sum + p.percent, 0);
    if (total !== 100)
      return { error: "Percentage shares must total exactly 100%." };
  }

  return { participants };
}

function SplitFields({ members, splitType, setSplitType, defaults = {}, idPrefix = "" }) {
  const memberInput = (userId, name, label) => (
    <div key={userId}>
      <label className={fieldLabel} htmlFor={`${idPrefix}${name}-${userId}`}>
        {label}
      </label>
      <input
        className={textInput}
        defaultValue={defaults[name]?.[userId] ?? 0}
        id={`${idPrefix}${name}-${userId}`}
        max={name === "percent" ? "100" : undefined}
        min="0"
        name={`${name}-${userId}`}
        required
        step={name === "percent" ? "1" : "0.01"}
        type="number"
      />
    </div>
  );

  return (
    <>
      <div>
        <label className={fieldLabel} htmlFor={`${idPrefix}split-type`}>
          Split type
        </label>
        <select
          className={textInput}
          id={`${idPrefix}split-type`}
          onChange={(e) => setSplitType(e.target.value)}
          value={splitType}
        >
          {SPLIT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {splitType === "EXACT" && (
        <div className="space-y-space-sm">
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Shares in ₹
          </p>
          {members.map((member) =>
            memberInput(
              member.user.id,
              "exact",
              `${member.user.name} share (₹)`,
            ),
          )}
        </div>
      )}

      {splitType === "PERCENT" && (
        <div className="space-y-space-sm">
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Shares in %
          </p>
          {members.map((member) =>
            memberInput(
              member.user.id,
              "percent",
              `${member.user.name} share (%)`,
            ),
          )}
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Whole percentages only. Shares must total exactly 100%.
          </p>
        </div>
      )}
    </>
  );
}

function AddExpense({ group, onDone }) {
  const [error, setError] = useState("");
  const [splitType, setSplitType] = useState("EQUAL");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const form = new FormData(e.target);
    const amountPaise = Math.round(Number(form.get("amount")) * 100);
    const { participants, error: splitError } = readParticipants(
      form,
      group.members,
      splitType,
      amountPaise,
    );
    if (splitError) {
      setError(splitError);
      return;
    }

    try {
      await api.post("/groups/" + group.id + "/expenses", {
        description: form.get("description"),
        amountPaise,
        category: form.get("category") || "General",
        date: new Date().toISOString(),
        paidById: Number(form.get("payer")),
        splitType,
        participants,
      });
      e.target.reset();
      setSplitType("EQUAL");
      onDone();
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <section className={`${card} overflow-hidden`}>
      <div className="p-space-md border-b border-outline-variant/30 flex items-center gap-space-xs">
        <span aria-hidden="true" className="material-symbols-outlined text-primary text-[20px]">
          add_circle
        </span>
        <h3 className="font-title-md text-title-md font-semibold text-on-surface">
          Add an expense
        </h3>
      </div>
      <div className="p-space-md">
        <form
          aria-label="Add expense"
          className="space-y-space-md"
          onSubmit={submit}
        >
          <div>
            <label className={fieldLabel} htmlFor="exp-description">
              Description
            </label>
            <input
              className={textInput}
              id="exp-description"
              name="description"
              placeholder="Dinner at the beach shack"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div>
              <label className={fieldLabel} htmlFor="exp-amount">
                Amount (₹)
              </label>
              <input
                className={textInput}
                id="exp-amount"
                min="0.01"
                name="amount"
                required
                step="0.01"
                type="number"
              />
            </div>
            <div>
              <label className={fieldLabel} htmlFor="exp-category">
                Category
              </label>
              <input
                className={textInput}
                defaultValue="Food"
                id="exp-category"
                name="category"
                required
              />
            </div>
          </div>
          <div>
            <label className={fieldLabel} htmlFor="exp-payer">
              Payer
            </label>
            <select className={textInput} id="exp-payer" name="payer">
              {group.members.map((member) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.name}
                </option>
              ))}
            </select>
          </div>

          <SplitFields
            members={group.members}
            setSplitType={setSplitType}
            splitType={splitType}
          />

          <ErrorNote>{error}</ErrorNote>
          <button className={primaryButton} type="submit">
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">add</span>
            Add expense
          </button>
        </form>
      </div>
    </section>
  );
}

function EditExpense({ group, expense, onDone, onCancel }) {
  const [error, setError] = useState("");
  const [splitType, setSplitType] = useState(expense.splitType);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const form = new FormData(e.target);
    const amountPaise = Math.round(Number(form.get("amount")) * 100);
    const { participants, error: splitError } = readParticipants(
      form,
      group.members,
      splitType,
      amountPaise,
    );
    if (splitError) {
      setError(splitError);
      return;
    }

    try {
      await api.put("/expenses/" + expense.id, {
        description: form.get("description"),
        amountPaise,
        category: form.get("category") || "General",
        date: expense.date,
        paidById: Number(form.get("payer")),
        splitType,
        participants,
      });
      onDone();
    } catch (err) {
      setError(errorText(err));
    }
  };

  const defaults = {
    exact: Object.fromEntries(
      expense.splits.map((s) => [s.userId, (s.sharePaise / 100).toFixed(2)]),
    ),
    percent: Object.fromEntries(
      expense.splits.map((s) => [s.userId, s.percent ?? 0]),
    ),
  };

  return (
    <form
      aria-label="Edit expense"
      className="space-y-space-md p-space-md rounded-lg bg-surface-container-low border border-outline-variant/30"
      onSubmit={submit}
    >
      <div>
        <label className={fieldLabel} htmlFor="edit-description">
          Description
        </label>
        <input
          className={textInput}
          defaultValue={expense.description}
          id="edit-description"
          name="description"
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
        <div>
          <label className={fieldLabel} htmlFor="edit-amount">
            Amount (₹)
          </label>
          <input
            className={textInput}
            defaultValue={(expense.amountPaise / 100).toFixed(2)}
            id="edit-amount"
            min="0.01"
            name="amount"
            required
            step="0.01"
            type="number"
          />
        </div>
        <div>
          <label className={fieldLabel} htmlFor="edit-category">
            Category
          </label>
          <input
            className={textInput}
            defaultValue={expense.category}
            id="edit-category"
            name="category"
            required
          />
        </div>
      </div>
      <div>
        <label className={fieldLabel} htmlFor="edit-payer">
          Payer
        </label>
        <select
          className={textInput}
          defaultValue={expense.paidById}
          id="edit-payer"
          name="payer"
        >
          {group.members.map((member) => (
            <option key={member.user.id} value={member.user.id}>
              {member.user.name}
            </option>
          ))}
        </select>
      </div>

      <SplitFields
        defaults={defaults}
        idPrefix="edit-"
        members={group.members}
        setSplitType={setSplitType}
        splitType={splitType}
      />

      <ErrorNote>{error}</ErrorNote>
      <div className="flex items-center gap-space-sm">
        <button className={primaryButton} type="submit">
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">check</span>
          Save changes
        </button>
        <button
          className="h-10 px-4 rounded-lg border border-outline-variant text-on-surface-variant font-label-lg text-label-lg hover:bg-surface-container-low transition-colors"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function RecordSettlement({ group, balances, onDone }) {
  const [error, setError] = useState("");
  const first = group.members[0]?.user.id;
  const second = group.members[1]?.user.id;
  const suggestion = balances?.simplifiedSettlements?.[0];
  const defaultFrom = suggestion?.from ?? first;
  const defaultTo = suggestion?.to ?? (second ?? first);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const form = new FormData(e.target);
    const fromUserId = Number(form.get("fromUserId"));
    const toUserId = Number(form.get("toUserId"));
    const amountPaise = Math.round(Number(form.get("amount")) * 100);

    if (fromUserId === toUserId) {
      setError("A settlement must be between two different members.");
      return;
    }

    try {
      await api.post("/groups/" + group.id + "/settlements", {
        fromUserId,
        toUserId,
        amountPaise,
        note: form.get("note") || "",
      });
      e.target.reset();
      onDone();
    } catch (err) {
      setError(errorText(err));
    }
  };

  return (
    <section className={`${card} overflow-hidden`}>
      <div className="p-space-md border-b border-outline-variant/30 flex items-center gap-space-xs">
        <span aria-hidden="true" className="material-symbols-outlined text-primary text-[20px]">
          handshake
        </span>
        <h3 className="font-title-md text-title-md font-semibold text-on-surface">
          Record settlement
        </h3>
      </div>
      <div className="p-space-md">
        <form className="space-y-space-md" onSubmit={submit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div>
              <label className={fieldLabel} htmlFor="settle-from">
                From
              </label>
              <select
                className={textInput}
                defaultValue={defaultFrom}
                id="settle-from"
                name="fromUserId"
              >
                {group.members.map((member) => (
                  <option key={member.user.id} value={member.user.id}>
                    {member.user.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={fieldLabel} htmlFor="settle-to">
                To
              </label>
              <select
                className={textInput}
                defaultValue={defaultTo}
                id="settle-to"
                name="toUserId"
              >
                {group.members.map((member) => (
                  <option key={member.user.id} value={member.user.id}>
                    {member.user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={fieldLabel} htmlFor="settle-amount">
              Amount (₹)
            </label>
            <input
              className={textInput}
              id="settle-amount"
              min="0.01"
              name="amount"
              required
              step="0.01"
              type="number"
            />
          </div>
          <div>
            <label className={fieldLabel} htmlFor="settle-note">
              Note (Optional)
            </label>
            <input
              className={textInput}
              id="settle-note"
              name="note"
              placeholder="UPI to Asha"
            />
          </div>
          <ErrorNote>{error}</ErrorNote>
          <button className={primaryButton} type="submit">
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">check</span>
            Record
          </button>
        </form>
      </div>
    </section>
  );
}

function GroupDetail({ group, currentUserId, onBack }) {
  const [tab, setTab] = useState("expenses");
  const [currentGroup, setCurrentGroup] = useState(group);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const myRole = currentGroup.members.find(
    (member) => member.user.id === currentUserId,
  )?.role;
  const canModify = (expense) =>
    myRole === "ADMIN" || expense.createdById === currentUserId;

  const nameOf = (userId) =>
    currentGroup.members.find((member) => member.user.id === userId)
      ?.user.name ?? `User ${userId}`;

  const removeExpense = async (expense) => {
    if (!window.confirm(`Delete "${expense.description}"?`)) return;
    try {
      await api.delete("/expenses/" + expense.id);
      setEditingId(null);
      refresh();
    } catch (err) {
      setError(errorText(err));
    }
  };

  // showSpinner is only for the very first load. Later refreshes (after an
  // add/edit/delete) keep the current list on screen instead of flashing the
  // "Loading expenses…" skeleton over it.
  const refresh = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const [list, balance, feed, groupData] = await Promise.all([
        api.get("/groups/" + currentGroup.id + "/expenses"),
        api.get("/groups/" + currentGroup.id + "/balances"),
        api.get("/groups/" + currentGroup.id + "/activity"),
        api.get("/groups/" + currentGroup.id),
      ]);
      setCurrentGroup(groupData.data.group);
      setExpenses(list.data.expenses);
      setBalances(balance.data);
      setActivity(feed.data.activity);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh(true);
  }, [currentGroup.id]);

  const TABS = [
    { id: "expenses", label: "Expenses" },
    { id: "balances", label: "Balances" },
    { id: "activity", label: "Activity" },
  ];

  return (
    <main className="w-full pt-16 bg-surface min-h-[calc(100vh-80px)]">
      <div className="max-w-5xl mx-auto px-margin md:px-margin-md lg:px-space-xl py-space-lg">
        <button
          className="inline-flex items-center gap-1 font-label-lg text-label-lg text-primary hover:underline mb-space-md"
          onClick={onBack}
          type="button"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          All groups
        </button>

        <div className={`${card} p-space-lg mb-space-lg`}>
          <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">
            {currentGroup.name}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            {currentGroup.description || "Shared group expenses"}
          </p>
        </div>

        <ErrorNote>{error}</ErrorNote>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          <div className="lg:col-span-8 flex flex-col gap-space-md">
            <nav className="flex p-1 bg-surface-container-low rounded-lg gap-1">
              {TABS.map(({ id, label }) => (
                <button
                  aria-current={tab === id ? "page" : undefined}
                  className={`flex-1 py-2 px-3 text-center rounded font-label-lg text-label-lg transition-colors duration-150 ${
                    tab === id
                      ? "bg-surface-container-lowest text-primary shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                  key={id}
                  onClick={() => setTab(id)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </nav>

            {tab === "expenses" && (
              <>
                <AddExpense group={currentGroup} onDone={refresh} />
                <section className={`${card} overflow-hidden`}>
                  <div className="p-space-md border-b border-outline-variant/30 flex items-center gap-space-xs">
                    <span aria-hidden="true" className="material-symbols-outlined text-primary text-[20px]">
                      receipt_long
                    </span>
                    <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                      Expenses
                    </h2>
                  </div>
                  {loading ? (
                    <p className="p-space-md font-body-md text-body-md text-on-surface-variant">
                      Loading expenses…
                    </p>
                  ) : expenses.length ? (
                    <ul>
                      {expenses.map((item) => (
                        <li
                          className="p-space-md border-b border-outline-variant/20 last:border-b-0 flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm"
                          key={item.id}
                        >
                          {editingId === item.id ? (
                            <EditExpense
                              expense={item}
                              group={currentGroup}
                              onCancel={() => setEditingId(null)}
                              onDone={() => {
                                setEditingId(null);
                                refresh();
                              }}
                            />
                          ) : (
                            <>
                              <div className="min-w-0">
                                <p className="font-label-lg text-label-lg text-on-surface font-medium truncate">
                                  {item.description}
                                </p>
                                <p className="font-body-sm text-body-sm text-on-surface-variant">
                                  {formatMoney(item.amountPaise)} · {item.category}
                                </p>
                              </div>
                              <div className="flex items-center gap-space-sm shrink-0">
                                <span className="font-body-sm text-body-sm text-on-surface-variant">
                                  Paid by {item.paidBy.name}
                                </span>
                                {canModify(item) && (
                                  <div className="flex items-center gap-space-xs">
                                    <button
                                      className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-outline-variant text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-low transition-colors"
                                      onClick={() => setEditingId(item.id)}
                                      type="button"
                                    >
                                      <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                                        edit
                                      </span>
                                      Edit
                                    </button>
                                    <button
                                      className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-outline-variant text-error font-label-sm text-label-sm hover:bg-error-container transition-colors"
                                      onClick={() => removeExpense(item)}
                                      type="button"
                                    >
                                      <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                                        delete
                                      </span>
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="p-space-md font-body-md text-body-md text-on-surface-variant">
                      No expenses yet.
                    </p>
                  )}
                </section>
              </>
            )}

            {tab === "balances" && (
              <>
                <section className={`${card} overflow-hidden`}>
                  <div className="p-space-md border-b border-outline-variant/30 flex items-center gap-space-xs">
                    <span aria-hidden="true" className="material-symbols-outlined text-primary text-[20px]">
                      balance
                    </span>
                    <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                      Balances
                    </h2>
                  </div>
                  <div className="p-space-md">
                    {loading ? (
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        Loading balances…
                      </p>
                    ) : balances?.members.length ? (
                      <ul className="space-y-space-sm">
                        {balances.members.map((member) => (
                          <li
                            className="flex items-center justify-between gap-space-md"
                            key={member.user.id}
                          >
                            <span className="font-body-md text-body-md text-on-surface">
                              {member.user.name}
                            </span>
                            <span
                              className={`font-currency-md text-currency-md ${
                                member.netPaise >= 0 ? "text-tertiary" : "text-error"
                              }`}
                            >
                              {formatMoney(member.netPaise)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        No members yet.
                      </p>
                    )}
                  </div>
                  <div className="p-space-md border-t border-outline-variant/30 bg-surface-container-low/40">
                    <h3 className="font-label-lg text-label-lg text-on-surface font-semibold mb-space-sm">
                      Suggested settlements
                    </h3>
                    {balances?.simplifiedSettlements.length ? (
                      <ul className="space-y-space-xs">
                        {balances.simplifiedSettlements.map((item, index) => (
                          <li
                            className="font-body-sm text-body-sm text-on-surface-variant"
                            key={index}
                          >
                            {nameOf(item.from)} pays {nameOf(item.to)}{" "}
                            <span className="font-medium text-on-surface">
                              {formatMoney(item.amount)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Everyone is settled up.
                      </p>
                    )}
                  </div>
                </section>

                <RecordSettlement
                  balances={balances}
                  group={currentGroup}
                  key={`${balances?.simplifiedSettlements?.[0]?.from}-${balances?.simplifiedSettlements?.[0]?.to}`}
                  onDone={refresh}
                />
              </>
            )}

            {tab === "activity" && (
              <section className={`${card} overflow-hidden`}>
                <div className="p-space-md border-b border-outline-variant/30 flex items-center gap-space-xs">
                  <span aria-hidden="true" className="material-symbols-outlined text-primary text-[20px]">
                    history
                  </span>
                  <h2 className="font-title-md text-title-md font-semibold text-on-surface">
                    Activity
                  </h2>
                </div>
                {loading ? (
                  <p className="p-space-md font-body-md text-body-md text-on-surface-variant">
                    Loading activity…
                  </p>
                ) : activity.length ? (
                  <ul>
                    {activity.map((item) => (
                      <li
                        className="p-space-md border-b border-outline-variant/20 last:border-b-0 font-body-md text-body-md text-on-surface-variant"
                        key={item.id}
                      >
                        {item.message}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="p-space-md font-body-md text-body-md text-on-surface-variant">
                    No activity yet.
                  </p>
                )}
              </section>
            )}
          </div>

          <div className="lg:col-span-4 flex flex-col gap-space-md">
            <section className={`${card} overflow-hidden`}>
              <div className="p-space-md border-b border-outline-variant/30 flex items-center justify-between gap-space-xs">
                <div className="flex items-center gap-space-xs">
                  <span aria-hidden="true" className="material-symbols-outlined text-primary text-[20px]">
                    group
                  </span>
                  <h3 className="font-title-md text-title-md font-semibold text-on-surface">
                    Members
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                  {currentGroup.members.length}
                </span>
              </div>
              <ul>
                {currentGroup.members.map((member) => (
                  <li
                    className="px-space-md py-space-sm flex items-center gap-space-sm border-b border-outline-variant/20 last:border-b-0"
                    key={member.user.id}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                        person
                      </span>
                    </div>
                    <span className="font-body-md text-body-md text-on-surface truncate min-w-0">
                      {member.user.name}
                    </span>
                    <span
                      className={`ml-auto px-2 py-0.5 rounded-full font-label-sm text-label-sm ${
                        member.role === "ADMIN"
                          ? "bg-primary-container text-on-primary-container"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {member.role}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <AddMember group={currentGroup} onDone={refresh} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [loadingGroups, setLoadingGroups] = useState(false);

  const load = async () => {
    setLoadingGroups(true);
    try {
      const result = await api.get("/groups");
      setGroups(result.data.groups);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoadingGroups(false);
    }
  };

  const loadSummary = async () => {
    try {
      const result = await api.get("/dashboard/summary");
      setDashboardSummary(result.data);
    } catch (err) {
      setError(errorText(err));
    }
  };

  useEffect(() => {
    if (localStorage.getItem("expenseEaseToken")) {
      api
        .get("/auth/me")
        .then((result) => setUser(result.data.user))
        .catch(() => localStorage.removeItem("expenseEaseToken"));
    }
  }, []);

  useEffect(() => {
    if (user) {
      load();
      loadSummary();
    }
  }, [user]);

  if (!user)
    return (
      <ErrorBoundary
        onRetry={() => {
          setAuthMode("login");
          setUser(null);
        }}
        resetKey={`auth-${authMode}`}
      >
        {authMode === "register" ? (
          <Register
            onLogin={setUser}
            onSwitch={() => setAuthMode("login")}
          />
        ) : (
          <Login onLogin={setUser} onSwitch={() => setAuthMode("register")} />
        )}
      </ErrorBoundary>
    );

  if (selected)
    return (
      <ErrorBoundary
        onRetry={() => {
          setSelected(null);
          load();
          loadSummary();
        }}
        resetKey={`group-${selected.id}`}
      >
        <GroupDetail
          group={selected}
          currentUserId={user.id}
          onBack={() => {
            setSelected(null);
            load();
            loadSummary();
          }}
        />
      </ErrorBoundary>
    );

  return (
    <ErrorBoundary
      onRetry={() => {
        load();
        loadSummary();
      }}
      resetKey="dashboard"
    >
    <>
      <Header user={user} onLogout={() => {
        localStorage.removeItem("expenseEaseToken");
        setUser(null);
      }} />
      <main className="w-full pt-16 bg-surface min-h-[calc(100vh-80px)]">
        <div className="max-w-5xl mx-auto px-margin md:px-margin-md lg:px-space-xl py-space-lg">
          
          <DashboardSummary summary={dashboardSummary} user={user} />
          
          {error && (
            <div className="mb-5 p-3.5 rounded-lg bg-error-container text-on-error-container flex items-start gap-2.5" role="alert">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-error flex-shrink-0 mt-0.5">error</span>
              <div className="flex flex-col">
                <span className="font-body-sm text-body-sm">{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            <div className="lg:col-span-8 flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-space-xs">
                <div className="flex items-center gap-space-sm">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Your Groups</h2>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">{groups.length} Active</span>
                </div>
              </div>

              <div className="flex flex-col gap-space-sm">
                {loadingGroups ? (
                  <p className="text-on-surface-variant">Loading groups…</p>
                ) : groups.length ? (
                  groups.map((group) => (
                    <button
                      className="w-full text-left p-space-md md:p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md group"
                      key={group.id}
                      onClick={() => setSelected(group)}
                      type="button"
                    >
                      <div className="flex items-center gap-space-md min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <span aria-hidden="true" className="material-symbols-outlined text-[26px]">home_work</span>
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <div className="flex items-center gap-space-xs">
                            <span className="font-title-md text-title-md text-on-surface font-semibold truncate group-hover:text-primary transition-colors">{group.name}</span>
                          </div>
                          <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
                            <span>{group.members.length} members</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-on-surface-variant">No groups yet.</p>
                )}
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-space-lg">
              <CreateGroup
                onCreated={(group) => {
                  setSelected(group);
                  load();
                  loadSummary();
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </>
    </ErrorBoundary>
  );
}
