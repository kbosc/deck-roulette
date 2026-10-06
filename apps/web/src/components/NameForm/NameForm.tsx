import type { NameProblem } from "@deck-roulette/domain";
import { validateName } from "@deck-roulette/domain";
import { Button, Field, Input } from "@deck-roulette/ui";
import { useRef, useState } from "react";

export type NameFormProps = {
  readonly label: string;
  readonly placeholder?: string;
  readonly existingNames: readonly string[];
  readonly messages: Record<NameProblem, string>;
  /** Called only with a valid name. */
  readonly onCreate: (name: string) => void;
};

/** Lives in the app, not in packages/ui: it applies the domain's naming rules. */
export function NameForm({ label, placeholder, existingNames, messages, onCreate }: NameFormProps) {
  const [name, setName] = useState("");
  // Set on submit only; once shown, re-checked on every keystroke.
  const [problem, setProblem] = useState<NameProblem | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  return (
    // noValidate: the browser's bubble would accept a name made of spaces.
    <form
      noValidate
      // A single explicit column: the button's col-start-2 creates the second one, sized to it.
      className="grid grid-cols-1 gap-x-3 gap-y-2"
      onSubmit={(event) => {
        event.preventDefault();

        const found = validateName(name, existingNames);
        if (found !== null) {
          setProblem(found);
          nameRef.current?.focus();
          return;
        }

        onCreate(name);
        setName("");
      }}
    >
      <Field
        layout="subgrid"
        label={label}
        required
        error={problem === null ? undefined : messages[problem]}
      >
        {(props) => (
          <Input
            {...props}
            ref={nameRef}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (problem !== null) setProblem(validateName(event.target.value, existingNames));
            }}
            placeholder={placeholder}
          />
        )}
      </Field>
      <Button type="submit" className="col-start-2 row-start-2">
        Add
      </Button>
    </form>
  );
}
