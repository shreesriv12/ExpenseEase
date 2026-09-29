import { useEffect, useState } from "react";
import api from "./api/client.js";
import { formatMoney } from "./utils/money.js";

const errorText = (error) =>
  error.response?.data?.error?.message ||
  "Something went wrong. Please try again.";

function Login({ onLogin }) {
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
        {error && <p className="error">{error}</p>}
        <button>Log in</button>
      </form>
      <small>Demo: asha@demo.local / Demo@1234</small>
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

function AddExpense({ group, onDone }) {
  const [error, setError] = useState("");
  const [splitType, setSplitType] = useState("EQUAL");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const form = new FormData(e.target);
    const amountPaise = Math.round(Number(form.get("amount")) * 100);

    const participants = group.members.map((member) => {
      const userId = Number(member.user.id);
      if (splitType === "EXACT") {
        return {
          userId,
          sharePaise: Math.round(Number(form.get(`exact-${userId}`) || 0) * 100),
        };
      }
      if (splitType === "PERCENT") {
        return {
          userId,
          percent: Number(form.get(`percent-${userId}`) || 0),
        };
      }
      return { userId };
    });

    if (splitType === "EXACT") {
      const total = participants.reduce((sum, item) => sum + item.sharePaise, 0);
      if (total !== amountPaise) {
        setError(`Exact shares must total ${formatMoney(amountPaise)}.`);
        return;
      }
    }

    if (splitType === "PERCENT") {
      const total = participants.reduce((sum, item) => sum + item.percent, 0);
      if (Math.abs(total - 100) > 0.0001) {
        setError("Percentage shares must total exactly 100%. ");
        return;
      }
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
        <label>
          Split type
          <select value={splitType} onChange={(e) => setSplitType(e.target.value)}>
            <option value="EQUAL">Equal</option>
            <option value="EXACT">Exact</option>
            <option value="PERCENT">Percentage</option>
          </select>
        </label>

        {splitType === "EXACT" && (
          <div className="member-splits">
            {group.members.map((member) => (
              <label key={member.user.id}>
                {member.user.name} share (₹)
                <input
                  name={`exact-${member.user.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                  required
                />
              </label>
            ))}
          </div>
        )}

        {splitType === "PERCENT" && (
          <div className="member-splits">
            {group.members.map((member) => (
              <label key={member.user.id}>
                {member.user.name} share (%)
                <input
                  name={`percent-${member.user.id}`}
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  defaultValue="0"
                  required
                />
              </label>
            ))}
          </div>
        )}

        <button>Add expense</button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
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

function GroupDetail({ group, onBack }) {
  const [tab, setTab] = useState("expenses");
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState("");

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
                    <div>
                      <strong>{item.description}</strong>
                      <div>
                        {formatMoney(item.amountPaise)} · {item.category}
                      </div>
                    </div>
                    <span>
                      Paid by {item.paidBy.name}
                    </span>
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
                {item.from} pays {item.to} {formatMoney(item.amount)}
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

  if (!user) return <Login onLogin={setUser} />;

  if (selected)
    return (
      <GroupDetail
        group={selected}
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
