import { beforeEach, describe, expect, it } from "vitest";
import { useListingErrorsStore } from "./listingErrorsStore";
import { useListPropertyStore } from "./listPropertyStore";

const errors = () => useListingErrorsStore.getState().errors;

beforeEach(() => {
  useListingErrorsStore.getState().clearAll();
  useListingErrorsStore.getState().setErrors(
    { salePrice: "Maximum price is ₦1,000,000,000,000", contactEmail: "Enter a valid contact email" },
    "salePrice"
  );
});

describe("a field's message clears when that field changes", () => {
  it("editing the sale price clears only its own message", () => {
    useListPropertyStore.getState().updateData({ salePrice: 5_000_000 });
    expect(errors()).toEqual({ contactEmail: "Enter a valid contact email" });
  });

  it("editing an unrelated field clears nothing", () => {
    useListPropertyStore.getState().updateData({ area: "Ewet" });
    expect(Object.keys(errors()).sort()).toEqual(["contactEmail", "salePrice"]);
  });

  it("a patch touching several fields clears each of them", () => {
    useListPropertyStore.getState().updateData({ salePrice: 1, contactEmail: "a@b.com" });
    expect(errors()).toEqual({});
  });

  it("resetting the wizard clears everything, including the pending scroll target", () => {
    useListPropertyStore.getState().reset();
    expect(errors()).toEqual({});
    expect(useListingErrorsStore.getState().focusField).toBeNull();
  });

  it("loading a saved draft or listing clears stale messages", () => {
    const { data } = useListPropertyStore.getState();
    useListPropertyStore.getState().replaceAll({ data, currentStep: 1, completedSteps: [] });
    expect(errors()).toEqual({});
  });

  it("consuming the scroll target leaves the messages in place", () => {
    useListingErrorsStore.getState().consumeFocus();
    expect(useListingErrorsStore.getState().focusField).toBeNull();
    expect(Object.keys(errors())).toHaveLength(2);
  });
});
