import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { useRef } from "react";
import { Button } from "../../atoms/Button";

export type ConfirmDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  /** What will be lost, not "are you sure?". */
  readonly description: string;
  /** The verb ("Delete"), not "OK". */
  readonly confirmLabel: string;
  readonly cancelLabel?: string;
  readonly onConfirm: () => void;
  readonly trigger?: ReactNode;
  /** Where focus goes after a confirmation, for when confirming removes the opener. */
  readonly onConfirmedFocus?: () => void;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  trigger,
  onConfirmedFocus,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  // A ref, not state: read while closing, and writing it must not render.
  const confirmed = useRef(false);
  // Radix restores focus only to a Dialog.Trigger; a list's dialog has none.
  const opener = useRef<HTMLElement | null>(null);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger === undefined ? null : <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-overlay" />

        <Dialog.Content
          // Focus on Cancel: a reflexive Enter must not delete the deck.
          onOpenAutoFocus={(event) => {
            // Read now: the opener still has focus at this point, not in a useEffect.
            opener.current = document.activeElement as HTMLElement | null;

            event.preventDefault();
            cancelRef.current?.focus();
          }}
          // Not in onConfirm: Radix restores focus afterwards and would undo it.
          onCloseAutoFocus={(event) => {
            const wasConfirmed = confirmed.current;
            confirmed.current = false;

            if (wasConfirmed && onConfirmedFocus !== undefined) {
              event.preventDefault();
              onConfirmedFocus();
              return;
            }

            // Focusing a detached node silently does nothing.
            if (opener.current !== null && document.contains(opener.current)) {
              event.preventDefault();
              opener.current.focus();
            }
          }}
          className={[
            "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
            "w-[calc(100vw-2rem)] max-w-md",
            "bg-surface-raised text-text",
            "rounded-lg border border-border shadow-lg",
            "p-6 flex flex-col gap-4",
          ].join(" ")}
        >
          <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>

          <Dialog.Description className="text-text-muted">{description}</Dialog.Description>

          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <Button ref={cancelRef} variant="secondary">
                {cancelLabel}
              </Button>
            </Dialog.Close>

            <Button
              variant="danger"
              onClick={() => {
                confirmed.current = true;
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
