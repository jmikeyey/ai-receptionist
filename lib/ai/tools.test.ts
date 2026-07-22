import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  listServices: vi.fn(),
  getOpenSlots: vi.fn(),
  bookAppointment: vi.fn(),
  captureLead: vi.fn(),
  notifyNewAppointment: vi.fn(),
  notifyNewLead: vi.fn(),
  retrieveKnowledge: vi.fn(),
}));

vi.mock("@/lib/db/queries", () => ({ listServices: mocks.listServices }));
vi.mock("@/lib/booking/booking", () => ({ getOpenSlots: mocks.getOpenSlots, bookAppointment: mocks.bookAppointment }));
vi.mock("@/lib/leads/capture", () => ({ captureLead: mocks.captureLead }));
vi.mock("@/lib/knowledge/retrieve", () => ({ retrieveKnowledge: mocks.retrieveKnowledge }));
vi.mock("@/lib/notify/send-owner-email", () => ({
  notifyNewAppointment: mocks.notifyNewAppointment,
  notifyNewLead: mocks.notifyNewLead,
}));

import { buildReceptionistTools } from "./tools";

const business = {
  id: "b1",
  name: "Bright Smile Dental",
  description: "",
  timezone: "Asia/Manila",
  freeformKnowledge: "Free parking is available behind the building.",
  createdAt: new Date(),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const run = (t: any, input: unknown) => t.execute(input, { toolCallId: "t", messages: [] });

beforeEach(() => Object.values(mocks).forEach((m) => m.mockReset()));

describe("receptionist tools", () => {
  it("searchKnowledge returns semantically-retrieved snippets", async () => {
    mocks.retrieveKnowledge.mockResolvedValue(["Free parking is available behind the building."]);
    const tools = buildReceptionistTools(business as never);
    const out = await run(tools.searchKnowledge, { query: "is there parking" });
    expect(out.snippets[0]).toMatch(/parking/i);
    expect(mocks.retrieveKnowledge).toHaveBeenCalledWith("b1", "is there parking");
  });

  it("checkAvailability errors on an unknown service", async () => {
    mocks.listServices.mockResolvedValue([{ id: "s1", name: "Cleaning", durationMin: 30, businessId: "b1" }]);
    const tools = buildReceptionistTools(business as never);
    const out = await run(tools.checkAvailability, { serviceName: "Massage", date: "2026-07-27" });
    expect(out.error).toMatch(/don't offer/i);
  });

  it("bookAppointment rejects a time that isn't an open slot (safety net)", async () => {
    mocks.listServices.mockResolvedValue([{ id: "s1", name: "Cleaning", durationMin: 30, businessId: "b1" }]);
    mocks.getOpenSlots.mockResolvedValue([new Date("2026-07-27T01:00:00.000Z")]);
    const tools = buildReceptionistTools(business as never);
    const out = await run(tools.bookAppointment, {
      serviceName: "Cleaning",
      startsAtISO: "2026-07-27T05:00:00.000Z",
      name: "Ada",
      email: "ada@example.com",
    });
    expect(out.error).toMatch(/isn't open/i);
    expect(mocks.bookAppointment).not.toHaveBeenCalled();
  });

  it("bookAppointment books when the requested slot is open", async () => {
    const slot = new Date("2026-07-27T01:00:00.000Z");
    mocks.listServices.mockResolvedValue([{ id: "s1", name: "Cleaning", durationMin: 30, businessId: "b1" }]);
    mocks.getOpenSlots.mockResolvedValue([slot]);
    mocks.bookAppointment.mockResolvedValue({ ok: true, appointmentId: "a1", startsAt: slot, endsAt: slot });
    mocks.notifyNewAppointment.mockResolvedValue(undefined);
    const tools = buildReceptionistTools(business as never);
    const out = await run(tools.bookAppointment, {
      serviceName: "Cleaning",
      startsAtISO: slot.toISOString(),
      name: "Ada",
      email: "ada@example.com",
    });
    expect(out.booked).toBe(true);
    expect(mocks.bookAppointment).toHaveBeenCalledOnce();
  });
});
