import { useId, useLayoutEffect, useRef, useState } from "react";

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
  const groupRef = useRef<HTMLFieldSetElement>(null);
  // Where the checked option sits: the indicator slides there. null until measured.
  const [slot, setSlot] = useState<{ left: number; width: number } | null>(null);
  // No slide on the first placement: it would sweep in from the left edge.
  const [placed, setPlaced] = useState(false);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (group === null) return;

    function measure() {
      const checked = group?.querySelector<HTMLElement>("label:has(:checked)");
      if (checked == null) return;
      setSlot({ left: checked.offsetLeft, width: checked.offsetWidth });
    }

    measure();
    // Fonts loading or the layout wrapping move the options without a change of value.
    const observer = new ResizeObserver(measure);
    observer.observe(group);
    return () => observer.disconnect();
  }, [value]);

  useLayoutEffect(() => {
    if (slot === null || placed) return;
    // A frame later: the first position must land before the transition is switched on.
    const frame = requestAnimationFrame(() => setPlaced(true));
    return () => cancelAnimationFrame(frame);
  }, [slot, placed]);

  return (
    <fieldset
      ref={groupRef}
      className="relative inline-flex rounded-md border border-border bg-surface-sunken p-1"
    >
      <legend className="sr-only">{legend}</legend>
      {/* Decoration only: the radios say which option is checked. */}
      <span
        aria-hidden="true"
        className={[
          "absolute inset-y-1 left-0 rounded-sm border border-border-strong bg-surface-raised",
          slot === null ? "invisible" : "",
          // Durations are not in the Tailwind theme: `duration-slow` would silently be 150ms.
          placed ? "transition-all duration-(--duration-slow) ease-overshoot" : "",
        ].join(" ")}
        style={slot === null ? undefined : { translate: `${slot.left}px 0`, width: slot.width }}
      />
      {options.map((option) => (
        <label
          key={option.value}
          className={[
            "relative flex min-h-11 cursor-pointer items-center rounded-sm px-3 text-sm font-medium",
            "text-text-muted hover:text-text has-checked:text-text",
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
