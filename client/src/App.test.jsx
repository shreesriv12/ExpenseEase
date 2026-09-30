import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import App from "./App.jsx";

const { api, calls, configure, reset } = vi.hoisted(() => {
  const calls = { get: [], post: [], put: [], del: [] };
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };

  const reset = () => {
    calls.get.length = 0;
    calls.post.length = 0;
    calls.put.length = 0;
    calls.del.length = 0;
  };

  const configure = (routes) => {
    const table = (method) => routes[method] || {};
    const check = (method, url) => {
      const data = table(method)[url];
      if (data === undefined)
        throw new Error(`Unstubbed ${method.toUpperCase()} ${url}`);
      return data;
    };
    api.get.mockImplementation((url) => {
      calls.get.push(url);
      return Promise.resolve({ data: check("get", url) });
    });
    api.post.mockImplementation((url, body) => {
      calls.post.push([url, body]);
      return Promise.resolve({ data: check("post", url) });
    });
    api.put.mockImplementation((url, body) => {
      calls.put.push([url, body]);
      return Promise.resolve({ data: check("put", url) });
    });
    api.delete.mockImplementation((url) => {
      calls.del.push(url);
      return Promise.resolve({ data: check("delete", url) });
    });
  };

  return { api, calls, configure, reset };
});

vi.mock("./api/client.js", () => ({ default: api }));

const members = [
  { role: "ADMIN", user: { id: 1, name: "Asha" } },
  { role: "MEMBER", user: { id: 2, name: "Bilal" } },
];
const group = { id: 10, name: "Goa Trip", description: "", members };
const memberGroup = {
  ...group,
  members: [
    { role: "MEMBER", user: { id: 1, name: "Asha" } },
    { role: "ADMIN", user: { id: 2, name: "Bilal" } },
  ],
};
const user = { id: 1, name: "Asha", email: "asha@example.com" };

const expense = (overrides = {}) => ({
  id: 100,
  description: "Dinner",
  amountPaise: 60000,
  category: "Food",
  paidById: 1,
  paidBy: { id: 1, name: "Asha" },
  createdById: 1,
  splitType: "EQUAL",
  splits: [
    { userId: 1, sharePaise: 30000, percent: null },
    { userId: 2, sharePaise: 30000, percent: null },
  ],
  ...overrides,
});

const groupRoutes = (list = [expense()], g = group) => ({
  get: {
    "/auth/me": { user },
    "/groups": { groups: [g] },
    "/dashboard/summary": { youOwePaise: 5000, youAreOwedPaise: 0 },
    "/groups/10": { group: g },
    "/groups/10/expenses": { expenses: list },
    "/groups/10/balances": {
      members: [
        { user: { id: 1, name: "Asha" }, netPaise: -5000 },
        { user: { id: 2, name: "Bilal" }, netPaise: 5000 },
      ],
      simplifiedSettlements: [{ from: 1, to: 2, amount: 5000 }],
    },
    "/groups/10/activity": { activity: [] },
  },
  post: {
    "/auth/login": { token: "t", user },
    "/auth/register": { token: "t", user },
    "/groups/10/expenses": { expense: expense() },
    "/groups/10/settlements": { settlement: {} },
  },
  put: { "/expenses/100": { expense: expense() } },
  delete: { "/expenses/100": {} },
});

const login = async () => {
  render(<App />);
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: user.email },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "password123" },
  });
  fireEvent.click(await screen.findByRole("button", { name: "Log in" }));
  await screen.findByText(/Hey Asha/);
};

const openGroup = async () => {
  fireEvent.click(await screen.findByRole("button", { name: /Goa Trip/ }));
  await screen.findByRole("button", { name: "Balances" });
};

afterEach(() => {
  cleanup();
  localStorage.clear();
  reset();
  vi.clearAllMocks();
});

describe("authentication screens", () => {
  beforeEach(() => configure(groupRoutes()));

  it("logs in and stores the token", async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: user.email },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    await waitFor(() =>
      expect(localStorage.getItem("expenseEaseToken")).toBe("t"),
    );
    expect(calls.post[0][0]).toBe("/auth/login");
  });

  it("switches to the registration form and posts the new account", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    fireEvent.change(screen.getByLabelText("Full Name"), {
      target: { value: "Asha" },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Secret@123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));
    await waitFor(() => expect(calls.post.length).toBe(1));
    expect(calls.post[0]).toEqual([
      "/auth/register",
      { name: "Asha", email: "new@example.com", password: "Secret@123" },
    ]);
  });

  it("surfaces a server error message on failed login", async () => {
    configure(groupRoutes());
    api.post.mockImplementationOnce(() =>
      Promise.reject({
        response: {
          data: { error: { message: "Invalid email or password" } },
        },
      }),
    );
    render(<App />);
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: user.email },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "incorrect-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Invalid email or password");
  });
});

describe("expense form", () => {
  beforeEach(() => configure(groupRoutes()));

  it("adds an equal-split expense for every group member", async () => {
    await login();
    await openGroup();
    fireEvent.change(await screen.findByLabelText("Description"), {
      target: { value: "Taxi" },
    });
    fireEvent.change(screen.getByLabelText("Amount (₹)"), {
      target: { value: "120" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Add expense" })[0]);
    await waitFor(() =>
      expect(
        calls.post.some(([url]) => url === "/groups/10/expenses"),
      ).toBe(true),
    );
    const [, body] = calls.post.find(
      ([url]) => url === "/groups/10/expenses",
    );
    expect(body.amountPaise).toBe(12000);
    expect(body.splitType).toBe("EQUAL");
    expect(body.participants).toEqual([{ userId: 1 }, { userId: 2 }]);
  });

  it("rejects percentage splits that do not total 100", async () => {
    await login();
    await openGroup();
    fireEvent.change(await screen.findByLabelText("Description"), {
      target: { value: "Museum" },
    });
    fireEvent.change(screen.getByLabelText("Amount (₹)"), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByLabelText("Split type"), {
      target: { value: "PERCENT" },
    });
    fireEvent.change(document.querySelector('input[name="percent-1"]'), {
      target: { value: "40" },
    });
    fireEvent.change(document.querySelector('input[name="percent-2"]'), {
      target: { value: "40" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Add expense" })[0]);
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/must total exactly 100%/);
    expect(calls.post.some(([url]) => url === "/groups/10/expenses")).toBe(
      false,
    );
  });

  it("rejects fractional percentages before calling the API", async () => {
    await login();
    await openGroup();
    fireEvent.change(await screen.findByLabelText("Description"), {
      target: { value: "Museum" },
    });
    fireEvent.change(screen.getByLabelText("Amount (₹)"), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByLabelText("Split type"), {
      target: { value: "PERCENT" },
    });
    fireEvent.change(document.querySelector('input[name="percent-1"]'), {
      target: { value: "50.5" },
    });
    fireEvent.change(document.querySelector('input[name="percent-2"]'), {
      target: { value: "49.5" },
    });
    // Bypass native step validation so the JS guard is what rejects this.
    fireEvent.submit(screen.getByRole("form", { name: "Add expense" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toMatch(/whole numbers/i);
    expect(calls.post.some(([url]) => url === "/groups/10/expenses")).toBe(
      false,
    );
  });

  it("submits an exact split whose shares total the amount", async () => {
    await login();
    await openGroup();
    fireEvent.change(await screen.findByLabelText("Description"), {
      target: { value: "Bills" },
    });
    fireEvent.change(screen.getByLabelText("Amount (₹)"), {
      target: { value: "90" },
    });
    fireEvent.change(screen.getByLabelText("Split type"), {
      target: { value: "EXACT" },
    });
    fireEvent.change(document.querySelector('input[name="exact-1"]'), {
      target: { value: "40" },
    });
    fireEvent.change(document.querySelector('input[name="exact-2"]'), {
      target: { value: "50" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Add expense" })[0]);
    const [, body] = calls.post.find(
      ([url]) => url === "/groups/10/expenses",
    );
    expect(body.participants).toEqual([
      { userId: 1, sharePaise: 4000 },
      { userId: 2, sharePaise: 5000 },
    ]);
  });
});

describe("expense management", () => {
  it("edits an expense and sends the updated amount in paise", async () => {
    configure(groupRoutes());
    await login();
    await openGroup();
    fireEvent.click(await screen.findByRole("button", { name: "Edit" }));
    const form = await screen.findByRole("form", { name: "Edit expense" });
    fireEvent.change(form.querySelector('input[name="amount"]'), {
      target: { value: "75" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    const [url, body] = calls.put[0];
    expect(url).toBe("/expenses/100");
    expect(body.amountPaise).toBe(7500);
  });

  it("deletes an expense after confirmation", async () => {
    configure(groupRoutes());
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await login();
    await openGroup();
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(calls.del).toEqual(["/expenses/100"]));
  });

  it("keeps delete silent when the confirmation is dismissed", async () => {
    configure(groupRoutes());
    vi.spyOn(window, "confirm").mockReturnValue(false);
    await login();
    await openGroup();
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));
    expect(calls.del).toEqual([]);
  });

  it("hides edit and delete from members who did not create the expense", async () => {
    configure(groupRoutes([expense({ createdById: 2 })], memberGroup));
    await login();
    await openGroup();
    await screen.findByText("Dinner");
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  it("allows a group admin to delete another member's expense", async () => {
    configure(groupRoutes([expense({ createdById: 2 })]));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    await login();
    await openGroup();
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(calls.del).toEqual(["/expenses/100"]));
  });
});

describe("balances and settlement", () => {
  beforeEach(() => configure(groupRoutes()));

  it("shows the dashboard totals for the signed-in user", async () => {
    await login();
    expect(await screen.findByText("Owed by you")).toBeTruthy();
    expect(screen.getByText("₹50.00")).toBeTruthy();
  });

  it("renders settlement suggestions with member names, not ids", async () => {
    await login();
    await openGroup();
    fireEvent.click(await screen.findByRole("button", { name: "Balances" }));
    expect(await screen.findByText(/Asha pays Bilal/)).toBeTruthy();
    expect(screen.queryByText(/1 pays 2/)).toBeNull();
  });

  it("records a settlement and refreshes group data", async () => {
    await login();
    await openGroup();
    fireEvent.click(await screen.findByRole("button", { name: "Balances" }));
    const amount = await screen.findByLabelText("Amount (₹)");
    fireEvent.change(amount, { target: { value: "50" } });
    fireEvent.click(screen.getByRole("button", { name: "Record" }));
    await waitFor(() =>
      expect(
        calls.post.some(([url]) => url === "/groups/10/settlements"),
      ).toBe(true),
    );
  });
});
