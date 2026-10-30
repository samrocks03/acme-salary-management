import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// `server-only` throws when imported outside a React Server environment; tests run modules directly.
vi.mock("server-only", () => ({}));

afterEach(() => {
  cleanup();
});

// jsdom lacks the pointer-capture / scrolling APIs Radix Select uses when opening.
if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
}
