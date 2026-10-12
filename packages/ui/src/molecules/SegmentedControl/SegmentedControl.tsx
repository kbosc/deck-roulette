import { useId } from "react";

export type SegmentedControlOption<T extends string> = {
  readonly value: T;
  readonly label: string;
};

export type SegmentedControlProps<T extends string> = {
  /** Read aloud only: the options have to make sense on their own on screen. */
  readonly legend: string;
  readonly options: readonly SegmentedControlOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
};

/** Native radios: arrow keys, a single tab stop and announcements come for free. */
export function SegmentedControl<T extends string>({
  legend,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  // A shared name would make two controls on the same page one radio group.
  const name = useId();

  return (
    <fieldset className="inline-flex rounded-md border border-border bg-surface-sunken p-1">
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => (
        <label
          key={option.value}
          className={[
            "flex min-h-11 cursor-pointer items-center rounded-sm px-3 text-sm font-medium",
            "border border-transparent text-text-muted hover:text-text",
            // The fill alone is under 3:1 against the track: the border carries the state.
            "has-checked:border-border-strong has-checked:bg-surface-raised has-checked:text-text",
            "has-checked:shadow-elevation-rest",
            // An outline rather than a ring: forced-colors mode keeps outlines, drops shadows.
            "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus-ring",
          ].join(" ")}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={option.value === value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
