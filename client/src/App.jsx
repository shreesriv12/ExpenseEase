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
function AddExpense({ group, onDone }) {
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const amountPaise = Math.round(Number(form.get("amount")) * 100);
    const participants = group.members.map((member) => ({
      userId: member.user.id,
    }));
    try {
      await api.post("/groups/" + group.id + "/expenses", {
        description: form.get("description"),
        amountPaise,
        category: form.get("category"),
        date: new Date().toISOString(),
        paidById: Number(form.get("payer")),
        splitType: "EQUAL",
        participants,
      });
      e.target.reset();
      onDone();
    } catch (err) {
      setError(errorText(err));
    }
  };
  return (
    <section>
      <h3>Add equal-split expense</h3>
      <form onSubmit={submit} className="inline">
        <label>
          Description
          <input name="description" required />
        </label>
        <label>
          Amount
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
        <button>Add expense</button>
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
                    <strong>{item.description}</strong>
                    <span>
                      {formatMoney(item.amountPaise)} paid by {item.paidBy.name}
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
              {member.user.name}:{" "}
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
                Member {item.from} pays member {item.to}{" "}
                {formatMoney(item.amount)}
              </p>
            ))
          ) : (
            <p>Everyone is settled up.</p>
          )}
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
  const load = async () => {
    try {
      const result = await api.get("/groups");
      setGroups(result.data.groups);
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
    if (user) load();
  }, [user]);
  if (!user) return <Login onLogin={setUser} />;
  if (selected)
    return (
      <GroupDetail
        group={selected}
        onBack={() => {
          setSelected(null);
          load();
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
      {error && <p className="error">{error}</p>}
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
