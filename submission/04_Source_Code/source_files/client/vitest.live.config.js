import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// End-to-end UI suite that clicks through the real API. Start the app first:
//
//   npm run dev
//   npm run test:live -w client
//
// The jsdom origin is the API origin so relative /api requests are same-origin
// and are not blocked by CORS the way a browser would block them.
export default defineConfig({
  plugins: [react()],
  test: {
    name: "live",
    environment: "jsdom",
    environmentOptions: { jsdom: { url: "http://localhost:3001" } },
    globals: true,
    restoreMocks: true,
    include: ["src/**/*.live.test.jsx"],
    testTimeout: 60000,
  },
});
