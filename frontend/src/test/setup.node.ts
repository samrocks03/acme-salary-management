import { vi } from "vitest";

// `server-only` throws when imported outside a React Server environment; tests import modules directly.
vi.mock("server-only", () => ({}));
