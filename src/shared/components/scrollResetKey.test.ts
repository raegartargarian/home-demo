import { describe, expect, it } from "vitest";

import { scrollResetKey } from "./scrollResetKey";

describe("scrollResetKey", () => {
  it("gives a vault and its sections one key, so moving between them holds", () => {
    expect(scrollResetKey("/vaults/abc/streams/property-records")).toBe(
      scrollResetKey("/vaults/abc"),
    );
  });

  it("separates two vaults, so opening a project starts at the top", () => {
    expect(scrollResetKey("/vaults/abc")).not.toBe(
      scrollResetKey("/vaults/def"),
    );
  });

  it("leaves the vault list alone", () => {
    expect(scrollResetKey("/vaults")).toBe("/vaults");
  });

  it("leaves every other route as it is", () => {
    expect(scrollResetKey("/")).toBe("/");
    expect(scrollResetKey("/records/xyz")).toBe("/records/xyz");
  });
});
