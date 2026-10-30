import { describe, expect, it } from "vitest";
import { fakeApiClient } from "@/test/fixtures";
import { getPayByJobTitle, getRecentChanges } from "./api";
import { insightKeys, parseCountryParam, payByJobTitleQuery } from "./queries";

describe("insights api", () => {
  it("passes the optional country filter and returns plain data", async () => {
    const data = { currency: "INR", rows: [{ job_title: "Software Engineer", headcount: 3 }] };
    const { client, request } = fakeApiClient({ data });
    expect(await getPayByJobTitle(client, "IN")).toEqual(data);
    expect(request).toHaveBeenCalledWith("insights/by_job_title", expect.objectContaining({ query: { country: "IN" } }));
  });

  it("requests recent changes for a window of days", async () => {
    const { client, request } = fakeApiClient({ data: { days: 90 } });
    await getRecentChanges(client, 90);
    expect(request).toHaveBeenCalledWith("insights/recent_changes", expect.objectContaining({ query: { days: 90 } }));
  });
});

describe("insight keys", () => {
  it("separates per-country caches and nests under one root", () => {
    expect(insightKeys.byJobTitle("IN")).not.toEqual(insightKeys.byJobTitle());
    expect(payByJobTitleQuery(fakeApiClient({ data: null }).client, "IN").queryKey).toEqual(["insights", "by-job-title", "IN"]);
    expect(insightKeys.distribution()[0]).toBe(insightKeys.all[0]);
  });
});

describe("parseCountryParam", () => {
  it("normalises ISO codes and rejects anything else", () => {
    expect(parseCountryParam("in")).toBe("IN");
    expect(parseCountryParam(["de", "fr"])).toBe("DE");
    expect(parseCountryParam("India")).toBeUndefined();
    expect(parseCountryParam("")).toBeUndefined();
    expect(parseCountryParam(null)).toBeUndefined();
  });
});
