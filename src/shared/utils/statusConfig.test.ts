import { describe, expect, it } from "vitest";
import { getStatusConfig } from "./statusConfig";

describe("getStatusConfig", () => {
  it("names a meaning, not a palette", () => {
    // The whole point of the tone: a caller renders it through `Chip` and
    // cannot compose a conflicting border rule on top of it, which is what the
    // old className string invited.
    expect(getStatusConfig("FILEDGR_VAULT_COMPLETED")).toEqual({
      label: "Completed",
      tone: "verified",
    });
  });

  it("gives the same tone to every spelling of the same state", () => {
    const tones = [
      "FILEDGR_VAULT_COMPLETED",
      "FILEDGR_VAULT_FINISHED",
      "FILEDGR_STREAM_COMPLETED",
      "FILEDGR_DATA_ATTACHMENT_COMPLETED",
    ].map((status) => getStatusConfig(status).tone);

    expect(new Set(tones).size).toBe(1);
  });

  it("reads in-flight states as a warning and failures as an alert", () => {
    expect(getStatusConfig("FILEDGR_RECEIVED").tone).toBe("warn");
    expect(getStatusConfig("ERROR").tone).toBe("alert");
  });

  it("is case- and whitespace-insensitive", () => {
    expect(getStatusConfig("  filedgr_vault_completed ")).toEqual(
      getStatusConfig("FILEDGR_VAULT_COMPLETED"),
    );
  });

  it("falls back to a readable label with no colour claim", () => {
    // An unmapped status must not borrow green: we do not know that it is good.
    expect(getStatusConfig("DLT_SOMETHING_NEW")).toEqual({
      label: "Something New",
      tone: "neutral",
    });
  });
});
