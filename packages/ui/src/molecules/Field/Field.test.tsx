import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Input } from "../../atoms/Input";
import { Field } from "./Field";

function renderField(props: Partial<Parameters<typeof Field>[0]> = {}) {
  return render(
    <Field label="Deck name" {...props}>
      {(controlProps) => <Input {...controlProps} />}
    </Field>,
  );
}

describe("Field", () => {
  it("gives the control its accessible name", () => {
    renderField();

    // getByLabelText only succeeds through a real label/for binding. A visual
    // label sitting next to the input would not be found.
    expect(screen.getByLabelText("Deck name")).toBeDefined();
  });

  it("puts focus in the control when its label is clicked", async () => {
    const user = userEvent.setup();
    renderField();

    await user.click(screen.getByText("Deck name"));

    expect(screen.getByLabelText("Deck name")).toBe(document.activeElement);
  });

  it("links the hint to the control", () => {
    renderField({ hint: "Shown on the draw screen" });

    const describedBy = screen.getByLabelText("Deck name").getAttribute("aria-describedby");

    expect(describedBy).not.toBeNull();
    expect(describedBy === null ? "" : document.getElementById(describedBy)?.textContent).toBe(
      "Shown on the draw screen",
    );
  });

  it("marks the control invalid and links the error", () => {
    renderField({ error: "This name is already taken" });

    const input = screen.getByLabelText("Deck name");

    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toBe("This name is already taken");
  });

  it("reads the error before the hint", () => {
    renderField({ hint: "Shown on the draw screen", error: "This name is already taken" });

    const ids = screen.getByLabelText("Deck name").getAttribute("aria-describedby")?.split(" ");
    const texts = ids?.map((id) => document.getElementById(id)?.textContent);

    // What is wrong comes first: someone hearing the field announced needs the
    // problem, not the help they already ignored.
    expect(texts).toEqual(["This name is already taken", "Shown on the draw screen"]);
  });

  it("says nothing about validity while nothing is wrong", () => {
    renderField();

    const input = screen.getByLabelText("Deck name");

    // aria-invalid="false" on an untouched field makes some screen readers
    // announce "invalid entry, no". Absent is the correct state.
    expect(input.getAttribute("aria-invalid")).toBeNull();
    expect(input.getAttribute("aria-describedby")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("announces that a field is required beyond the asterisk", () => {
    renderField({ required: true });

    // The asterisk is aria-hidden, so the accessible name carries the word.
    expect(screen.getByLabelText(/required/i)).toBeDefined();
    expect(screen.getByLabelText(/required/i)).toHaveProperty("required", true);
  });
});
