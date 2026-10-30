import { renderToString } from "react-dom/server";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useHydrated } from "./use-hydrated";

function Probe() {
  return <span>{useHydrated() ? "hydrated" : "server"}</span>;
}

describe("useHydrated", () => {
  it("is false in server-rendered HTML", () => {
    expect(renderToString(<Probe />)).toContain("server");
  });

  it("is true once rendered on the client", () => {
    render(<Probe />);
    expect(screen.getByText("hydrated")).toBeInTheDocument();
  });
});
