import { describe, it, expect } from "vitest";
import { computeOpenSlots, openSlotsForDate } from "./availability";

describe("computeOpenSlots", () => {
  it("tiles a single window by step", () => {
    // 9:00–10:00, 30-min service, 30-min step → 09:00, 09:30
    expect(
      computeOpenSlots({ windows: [{ start: 540, end: 600 }], busy: [], durationMin: 30, stepMin: 30 }),
    ).toEqual([540, 570]);
  });

  it("excludes slots that overlap a busy interval", () => {
    // busy 09:30–10:00 removes the 09:30 slot, keeps 09:00
    expect(
      computeOpenSlots({
        windows: [{ start: 540, end: 600 }],
        busy: [{ start: 570, end: 600 }],
        durationMin: 30,
        stepMin: 30,
      }),
    ).toEqual([540]);
  });

  it("treats touching intervals as non-overlapping", () => {
    // busy 09:30–10:00; a 09:00–09:30 slot ends exactly at busy start → allowed
    const slots = computeOpenSlots({
      windows: [{ start: 540, end: 600 }],
      busy: [{ start: 570, end: 600 }],
      durationMin: 30,
      stepMin: 30,
    });
    expect(slots).toContain(540);
  });

  it("returns nothing when the service can't fit the window", () => {
    expect(
      computeOpenSlots({ windows: [{ start: 540, end: 560 }], busy: [], durationMin: 30, stepMin: 15 }),
    ).toEqual([]);
  });

  it("handles multiple windows", () => {
    expect(
      computeOpenSlots({
        windows: [
          { start: 540, end: 600 },
          { start: 780, end: 840 },
        ],
        busy: [],
        durationMin: 60,
        stepMin: 60,
      }),
    ).toEqual([540, 780]);
  });

  it("rejects non-positive duration or step", () => {
    expect(computeOpenSlots({ windows: [{ start: 540, end: 600 }], busy: [], durationMin: 0, stepMin: 30 })).toEqual([]);
    expect(computeOpenSlots({ windows: [{ start: 540, end: 600 }], busy: [], durationMin: 30, stepMin: 0 })).toEqual([]);
  });
});

describe("openSlotsForDate", () => {
  const rules = [{ weekday: 1, startMinute: 540, endMinute: 660 }]; // Monday 09:00–11:00

  it("produces UTC instants matching the business-local wall clock", () => {
    // 2026-07-27 is a Monday. In Asia/Manila (UTC+8) 09:00 local = 01:00 UTC.
    const slots = openSlotsForDate({
      date: "2026-07-27",
      timezone: "Asia/Manila",
      rules,
      durationMin: 60,
      stepMin: 60,
      appointments: [],
    });
    expect(slots.map((d) => d.toISOString())).toEqual([
      "2026-07-27T01:00:00.000Z",
      "2026-07-27T02:00:00.000Z",
    ]);
  });

  it("returns no slots on a weekday with no rule", () => {
    // 2026-07-28 is a Tuesday; only Monday has a rule.
    expect(
      openSlotsForDate({ date: "2026-07-28", timezone: "Asia/Manila", rules, durationMin: 60, appointments: [] }),
    ).toEqual([]);
  });

  it("removes a slot blocked by an existing appointment", () => {
    // Block 10:00–11:00 local (02:00–03:00 UTC) → only the 09:00 slot remains.
    const slots = openSlotsForDate({
      date: "2026-07-27",
      timezone: "Asia/Manila",
      rules,
      durationMin: 60,
      stepMin: 60,
      appointments: [
        { startsAt: new Date("2026-07-27T02:00:00.000Z"), endsAt: new Date("2026-07-27T03:00:00.000Z") },
      ],
    });
    expect(slots.map((d) => d.toISOString())).toEqual(["2026-07-27T01:00:00.000Z"]);
  });
});
