import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PriorityPicker } from "./PriorityPicker";

describe("PriorityPicker", () => {
  it("marks the current value as checked and reports the clicked priority via onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PriorityPicker name="priority" labelledBy="priority-label" value="MEDIUM" onChange={onChange} />);

    expect(screen.getByRole("radio", { name: /moyenne/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /urgente/i })).not.toBeChecked();

    await user.click(screen.getByRole("radio", { name: /élevée/i }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("HIGH");
  });
});
