import { describe, expect, it } from "vitest";
import { decideRoute } from "./routing";

describe("decideRoute", () => {
  it("sends anonymous visitors to login, remembering where they were going", () => {
    expect(decideRoute("/employees", "?country=IN", false)).toEqual({
      type: "redirect",
      location: "/login?next=%2Femployees%3Fcountry%3DIN",
    });
  });

  it("lets anonymous visitors see the login page", () => {
    expect(decideRoute("/login", "", false)).toEqual({ type: "next" });
  });

  it("moves signed-in users off the login page", () => {
    expect(decideRoute("/login", "", true)).toEqual({ type: "redirect", location: "/dashboard" });
  });

  it("lets signed-in users through", () => {
    expect(decideRoute("/employees/12", "", true)).toEqual({ type: "next" });
  });
});
