import { useEffect, useState } from "react";
import api from "./api/client.js";
import { formatMoney } from "./utils/money.js";

const errorText = (error) =>
  error.response?.data?.error?.message ||
  "Something went wrong. Please try again.";

function Login({ onLogin, onSwitch }) {
  const [error, setError] = useState("");
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
    <main className="auth">
      <h1>ExpenseEase</h1>
      <p>Track shared expenses without the awkward math.</p>
      <form onSubmit={submit}>
        <label>
          Email
          <input
            name="email"
            type="email"
            defaultValue="asha@demo.local"
            required
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            defaultValue="Demo@1234"
            required
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button>Log in</button>
      </form>
      <small>Demo: asha@demo.local / Demo@1234</small>
      <p>
        <button type="button" className="link" onClick={onSwitch}>
          Need an account? Register
        </button>
      </p>
    </main>
  );
}

function Register({ onLogin, onSwitch }) {
  const [error, setError] = useState("");

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
    <main className="auth">
      <h1>Create your account</h1>
      <p>Start splitting shared expenses with your group.</p>
      <form onSubmit={submit}>
        <label>
          Name
          <input name="name" required maxLength={100} autoComplete="name" />
        </label>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button>Register</button>
      </form>
      <small>Password must be at least 8 characters.</small>
      <p>
        <button type="button" className="link" onClick={onSwitch}>
          Already registered? Log in
        </button>
      </p>
    </main>
  );
}

function DashboardSummary({ summary }) {
  if (!summary) return null;

  return (
    <section className="summary-grid">
      <div>
        <h3>You owe</h3>
        <p className="negative">{formatMoney(summary.youOwePaise)}</p>
      </div>
      <div>
        <h3>You are owed</h3>
        <p className="positive">{formatMoney(summary.youAreOwedPaise)}</p>
      </div>
    </section>
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
    <section>
      <h3>Create a group</h3>
      <form className="inline" onSubmit={submit}>
        <label>
          Group name
          <input name="name" required />
        </label>
        <label>
          Description
          <input name="description" />
        </label>
        <button>Create</button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
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
    <section>
      <h3>Add member</h3>
      <form className="inline" onSubmit={submit}>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <button>Add</button>
      </form>
      {error && <p className="error">{error}</p>}
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

function SplitFields({ members, splitType, setSplitType, defaults = {} }) {
  return (
    <>
      <label>
        Split type
        <select
          value={splitType}
          onChange={(e) => setSplitType(e.target.value)}
        >
          {SPLIT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>

      {splitType === "EXACT" && (
        <div className="member-splits">
          {members.map((member) => (
            <label key={member.user.id}>
              {member.user.name} share (₹)
              <input
                name={`exact-${member.user.id}`}
                type="number"
                min="0"
                step="0.01"
                defaultValue={defaults.exact?.[member.user.id] ?? 0}
                required
              />
            </label>
          ))}
        </div>
      )}

      {splitType === "PERCENT" && (
        <div className="member-splits">
          {members.map((member) => (
            <label key={member.user.id}>
              {member.user.name} share (%)
              <input
                name={`percent-${member.user.id}`}
                type="number"
                min="0"
                max="100"
                step="1"
                defaultValue={defaults.percent?.[member.user.id] ?? 0}
                required
              />
            </label>
          ))}
          <p className="hint">
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
    <section>
      <h3>Add expense</h3>
      <form onSubmit={submit} className="inline">
        <label>
          Description
          <input name="description" required />
        </label>
        <label>
          Amount (₹)
          <input name="amount" type="number" min="0.01" step="0.01" required />
        </label>
        <label>
          Category
          <input name="category" defaultValue="Food" required />
        </label>
        <label>
          Payer
          <select name="payer">
            {group.members.map((member) => (
              <option key={member.user.id} value={member.user.id}>
                {member.user.name}
              </option>
            ))}
          </select>
        </label>

        <SplitFields
          members={group.members}
          splitType={splitType}
          setSplitType={setSplitType}
        />

        <button>Add expense</button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
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
    <form onSubmit={submit} className="inline" aria-label="Edit expense">
      <label>
        Description
        <input name="description" defaultValue={expense.description} required />
      </label>
      <label>
        Amount (₹)
        <input
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          defaultValue={(expense.amountPaise / 100).toFixed(2)}
          required
        />
      </label>
      <label>
        Category
        <input name="category" defaultValue={expense.category} required />
      </label>
      <label>
        Payer
        <select name="payer" defaultValue={expense.paidById}>
          {group.members.map((member) => (
            <option key={member.user.id} value={member.user.id}>
              {member.user.name}
            </option>
          ))}
        </select>
      </label>

      <SplitFields
        members={group.members}
        splitType={splitType}
        setSplitType={setSplitType}
        defaults={defaults}
      />

      <div className="row">
        <button>Save changes</button>
        <button type="button" className="link" onClick={onCancel}>
          Cancel
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

function RecordSettlement({ group, onDone }) {
  const [error, setError] = useState("");

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
    <section>
      <h3>Record settlement</h3>
      <form className="inline" onSubmit={submit}>
        <label>
          From
          <select name="fromUserId">
            {group.members.map((member) => (
              <option key={member.user.id} value={member.user.id}>
                {member.user.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          To
          <select name="toUserId">
            {group.members.map((member) => (
              <option key={member.user.id} value={member.user.id}>
                {member.user.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Amount (₹)
          <input name="amount" type="number" min="0.01" step="0.01" required />
        </label>
        <label>
          Note
          <input name="note" />
        </label>
        <button>Record</button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}

function GroupDetail({ group, currentUserId, onBack }) {
  const [tab, setTab] = useState("expenses");
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const myRole = group.members.find(
    (member) => member.user.id === currentUserId,
  )?.role;
  const canModify = (expense) =>
    myRole === "ADMIN" || expense.createdById === currentUserId;

  const nameOf = (userId) =>
    group.members.find((member) => member.user.id === userId)?.user.name ??
    `User ${userId}`;

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

  const refresh = async () => {
    try {
      const [list, balance, feed] = await Promise.all([
        api.get("/groups/" + group.id + "/expenses"),
        api.get("/groups/" + group.id + "/balances"),
        api.get("/groups/" + group.id + "/activity"),
      ]);
      setExpenses(list.data.expenses);
      setBalances(balance.data);
      setActivity(feed.data.activity);
    } catch (err) {
      setError(errorText(err));
    }
  };

  useEffect(() => {
    refresh();
  }, [group.id]);

  return (
    <main>
      <button className="link" onClick={onBack}>
        ← All groups
      </button>
      <h1>{group.name}</h1>
      <p>{group.description || "Shared group expenses"}</p>

      <section>
        <h3>Members</h3>
        <ul>
          {group.members.map((member) => (
            <li key={member.user.id}>
              <span>{member.user.name}</span>
              <span>{member.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <AddMember group={group} onDone={refresh} />

      <nav>
        {["expenses", "balances", "activity"].map((name) => (
          <button
            className={tab === name ? "active" : ""}
            key={name}
            onClick={() => setTab(name)}
          >
            {name}
          </button>
        ))}
      </nav>

      {error && <p className="error">{error}</p>}

      {tab === "expenses" && (
        <>
          <AddExpense group={group} onDone={refresh} />
          <section>
            <h2>Expenses</h2>
            {expenses.length ? (
              <ul>
                {expenses.map((item) => (
                  <li key={item.id}>
                    {editingId === item.id ? (
                      <EditExpense
                        group={group}
                        expense={item}
                        onDone={() => {
                          setEditingId(null);
                          refresh();
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <>
                        <div>
                          <strong>{item.description}</strong>
                          <div>
                            {formatMoney(item.amountPaise)} · {item.category}
                          </div>
                        </div>
                        <span>Paid by {item.paidBy.name}</span>
                        {canModify(item) && (
                          <div className="row">
                            <button
                              type="button"
                              className="link"
                              onClick={() => setEditingId(item.id)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="link danger"
                              onClick={() => removeExpense(item)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No expenses yet.</p>
            )}
          </section>
        </>
      )}

      {tab === "balances" && (
        <section>
          <h2>Balances</h2>
          {balances?.members.map((member) => (
            <p key={member.user.id}>
              {member.user.name}: {" "}
              <strong
                className={member.netPaise >= 0 ? "positive" : "negative"}
              >
                {formatMoney(member.netPaise)}
              </strong>
            </p>
          ))}

          <h3>Suggested settlements</h3>
          {balances?.simplifiedSettlements.length ? (
            balances.simplifiedSettlements.map((item, index) => (
              <p key={index}>
                {nameOf(item.from)} pays {nameOf(item.to)}{" "}
                {formatMoney(item.amount)}
              </p>
            ))
          ) : (
            <p>Everyone is settled up.</p>
          )}

          <RecordSettlement group={group} onDone={refresh} />
        </section>
      )}

      {tab === "activity" && (
        <section>
          <h2>Activity</h2>
          {activity.length ? (
            activity.map((item) => <p key={item.id}>{item.message}</p>)
          ) : (
            <p>No activity yet.</p>
          )}
        </section>
      )}
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

  const load = async () => {
    try {
      const result = await api.get("/groups");
      setGroups(result.data.groups);
    } catch (err) {
      setError(errorText(err));
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
    return authMode === "register" ? (
      <Register
        onLogin={setUser}
        onSwitch={() => setAuthMode("login")}
      />
    ) : (
      <Login onLogin={setUser} onSwitch={() => setAuthMode("register")} />
    );

  if (selected)
    return (
      <GroupDetail
        group={selected}
        currentUserId={user.id}
        onBack={() => {
          setSelected(null);
          load();
          loadSummary();
        }}
      />
    );

  return (
    <main>
      <header>
        <h1>ExpenseEase</h1>
        <button
          onClick={() => {
            localStorage.removeItem("expenseEaseToken");
            setUser(null);
          }}
        >
          Log out
        </button>
      </header>

      <h2>Welcome, {user.name}</h2>
      <DashboardSummary summary={dashboardSummary} />
      {error && <p className="error">{error}</p>}

      <CreateGroup
        onCreated={(group) => {
          setSelected(group);
          load();
          loadSummary();
        }}
      />

      <section>
        <h2>Your groups</h2>
        {groups.length ? (
          <ul>
            {groups.map((group) => (
              <li key={group.id}>
                <button className="group" onClick={() => setSelected(group)}>
                  {group.name}
                  <span>{group.members.length} members</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No groups yet.</p>
        )}
      </section>
    </main>
  );
}
