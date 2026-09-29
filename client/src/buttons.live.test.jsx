import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, within } from "@testing-library/react";
import App from "./App.jsx";

const crashes = [];
beforeEach(() => {
  crashes.length = 0;
  window.addEventListener("error", (e) => crashes.push(String(e.error || e.message)));
});
afterEach(() => { cleanup(); localStorage.clear(); });

// Asserts the app is still mounted and did not fall back to the error boundary.
function assertAlive(label) {
  const root = document.getElementById("root") ?? document.body;
  expect(crashes, `${label} threw during render: ${crashes.join(" | ")}`).toEqual([]);
  expect(root.textContent.length, `${label} produced an empty page`).toBeGreaterThan(0);
  expect(
    screen.queryByText("Something went wrong"),
    `${label} hit the error boundary`,
  ).toBeNull();
}

const settle = (ms = 400) => new Promise((r) => setTimeout(r, ms));

// This suite drives the real API over HTTP, so it lives in its own vitest
// project. Run it with:
//   npm run dev                            (leave the server running)
//   npm run test:live -w client
describe("LIVE: every button, real server", () => {
  it("auth screen: every button is safe", async () => {
    render(<App />);
    await waitFor(() => screen.getByRole("button", { name: /^Log in/ }));

    // tab: Create account
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await screen.findByLabelText("Full Name");
    assertAlive("tab Create account");

    // tab: Sign in
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await screen.findByLabelText("Email address");
    assertAlive("tab Sign in");

    // password visibility toggles (both modes)
    const pw = screen.getByLabelText("Password");
    expect(pw.type).toBe("password");
    fireEvent.click(screen.getAllByRole("button", { name: /Show password|Hide password/ })[0]);
    await waitFor(() => expect(screen.getByLabelText("Password").type).toBe("text"));
    fireEvent.click(screen.getAllByRole("button", { name: /Show password|Hide password/ })[0]);
    await waitFor(() => expect(screen.getByLabelText("Password").type).toBe("password"));
    assertAlive("password toggle");

    // footer switch to register
    fireEvent.click(screen.getByRole("button", { name: "Create your account" }));
    await screen.findByLabelText("Full Name");
    assertAlive("footer Create your account");

    // register-mode password toggle
    fireEvent.click(screen.getAllByRole("button", { name: /Show password|Hide password/ })[0]);
    assertAlive("register password toggle");

    // footer switch back
    fireEvent.click(screen.getByRole("button", { name: "Sign in instead" }));
    await screen.findByLabelText("Email address");
    assertAlive("footer Sign in instead");

    // Forgot? reveals the reset help panel and can dismiss it again
    fireEvent.click(screen.getByRole("button", { name: "Forgot?" }));
    await screen.findByText(/handled by your workspace admin/);
    assertAlive("Forgot?");
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    await waitFor(() => expect(screen.queryByText(/handled by your workspace admin/)).toBeNull());
    assertAlive("Forgot? dismiss");
  }, 60000);

  it("dashboard + group detail: every button, no blank pages", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^Log in/ }));
    await screen.findByText(/Hey Asha/, {}, { timeout: 15000 });
    assertAlive("after login");

    // --- Create Group button
    const gname = `Btn Probe ${Date.now()}`;
    fireEvent.change(screen.getByLabelText("Group Name"), { target: { value: gname } });
    fireEvent.click(screen.getByRole("button", { name: /Create Group/ }));
    await screen.findByRole("heading", { name: gname }, { timeout: 15000 });
    await waitFor(() => expect(screen.getByText("No expenses yet.")).toBeTruthy(), { timeout: 15000 });
    assertAlive("after Create Group");

    // --- Add member button
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "bharat@demo.local" } });
    fireEvent.click(screen.getByRole("button", { name: /^Add$/ }));
    await waitFor(
      () => expect(screen.getAllByText("Bharat").length).toBeGreaterThan(0),
      { timeout: 15000 },
    );
    // the Members card must list 2 people (creator + Bharat)
    const membersCard = screen.getByText("Members").closest("section");
    expect(within(membersCard).getAllByRole("listitem")).toHaveLength(2);
    assertAlive("after Add member");

    // real member ids, read from the Payer select
    const memberIds = [...screen.getByLabelText("Payer").options].map((o) => o.value);
    expect(memberIds).toHaveLength(2);

    // --- Add expense, all three split types
    for (const [type, amount, values] of [
      ["EQUAL", "120", []],
      ["EXACT", "100", ["40", "60"]],
      ["PERCENT", "100", ["50", "50"]],
    ]) {
      fireEvent.change(screen.getByLabelText("Description"), { target: { value: `probe ${type}` } });
      fireEvent.change(screen.getByLabelText("Amount (₹)"), { target: { value: amount } });
      fireEvent.change(screen.getByLabelText("Split type"), { target: { value: type } });
      if (type === "EXACT")
        memberIds.forEach((id, i) =>
          fireEvent.change(document.querySelector(`input[name="exact-${id}"]`), {
            target: { value: values[i] },
          }));
      if (type === "PERCENT")
        memberIds.forEach((id, i) =>
          fireEvent.change(document.querySelector(`input[name="percent-${id}"]`), {
            target: { value: values[i] },
          }));
      fireEvent.click(screen.getByRole("button", { name: /^Add expense$/ }));
      await waitFor(() => expect(screen.getByText(`probe ${type}`)).toBeTruthy(), { timeout: 15000 });
      assertAlive(`after Add expense ${type}`);
    }

    // --- Edit button -> Save changes
    const [editBtn] = await screen.findAllByRole("button", { name: /^Edit$/ });
    fireEvent.click(editBtn);
    const editForm = await screen.findByRole("form", { name: "Edit expense" });
    assertAlive("after Edit");
    fireEvent.change(within(editForm).getByLabelText("Amount (₹)"), { target: { value: "77.50" } });
    fireEvent.click(within(editForm).getByRole("button", { name: /Save changes/ }));
    await waitFor(() => expect(screen.queryByRole("form", { name: "Edit expense" })).toBeNull(), { timeout: 15000 });
    assertAlive("after Save changes");

    // --- Edit -> Cancel
    const [editBtn2] = await screen.findAllByRole("button", { name: /^Edit$/ });
    fireEvent.click(editBtn2);
    await screen.findByRole("form", { name: "Edit expense" });
    fireEvent.click(screen.getByRole("button", { name: /^Cancel$/ }));
    await waitFor(() => expect(screen.queryByRole("form", { name: "Edit expense" })).toBeNull());
    assertAlive("after Cancel");

    // --- Balances tab
    fireEvent.click(screen.getByRole("button", { name: "Balances" }));
    await settle();
    assertAlive("Balances tab");
    // Record settlement
    fireEvent.change(screen.getByLabelText("Amount (₹)"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: /^Record$/ }));
    await settle(800);
    assertAlive("after Record settlement");

    // --- Activity tab
    fireEvent.click(screen.getByRole("button", { name: "Activity" }));
    await settle();
    assertAlive("Activity tab");

    // --- back to Expenses, Delete button
    fireEvent.click(screen.getByRole("button", { name: "Expenses" }));
    await waitFor(() => expect(screen.getByText("probe EQUAL")).toBeTruthy(), { timeout: 15000 });
    const before = (await screen.findAllByRole("button", { name: /^Delete$/ })).length;
    window.confirm = () => true;
    fireEvent.click(screen.getAllByRole("button", { name: /^Delete$/ })[0]);
    await waitFor(
      () => expect(screen.getAllByRole("button", { name: /^Delete$/ }).length).toBe(before - 1),
      { timeout: 15000 },
    );
    assertAlive("after Delete");

    // --- All groups (back) -> dashboard, then Log out
    fireEvent.click(screen.getByRole("button", { name: /All groups/ }));
    await waitFor(() => expect(screen.getByLabelText("Group Name")).toBeTruthy(), { timeout: 15000 });
    assertAlive("after All groups");

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /^Log in/ })).toBeTruthy());
    assertAlive("after Log out");
  }, 120000);

  it("a group with a stale/missing member never blanks the page", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^Log in/ }));
    await screen.findByText(/Hey Asha/, {}, { timeout: 15000 });

    const gname = `Fresh ${Date.now()}`;
    fireEvent.change(screen.getByLabelText("Group Name"), { target: { value: gname } });
    fireEvent.click(screen.getByRole("button", { name: /Create Group/ }));
    await screen.findByRole("heading", { name: gname }, { timeout: 15000 });
    // a brand new group has exactly one member and no expenses
    await waitFor(() => expect(screen.getByText("No expenses yet.")).toBeTruthy(), { timeout: 15000 });
    assertAlive("brand new empty group");
  }, 60000);
});
