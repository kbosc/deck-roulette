import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { useRef } from "react";
import { Button } from "../../atoms/Button";

export type ConfirmDialogProps = {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  /**
   * Say what will be lost, not "are you sure?". Someone who reads only this
   * line must still be able to decide.
   */
  readonly description: string;
  /**
   * The verb, not "OK": a button reading "Delete" is understandable out of
   * context, which is exactly how a screen reader may reach it.
   */
  readonly confirmLabel: string;
  readonly cancelLabel?: string;
  readonly onConfirm: () => void;
  /** What opens the dialog. Rendered as-is, so it keeps being a real control. */
  readonly trigger?: ReactNode;
};

/**
 * A confirmation for a destructive action.
 *
 * Radix handles what is tedious and easy to get wrong: trapping focus inside
 * the dialog, restoring it to the trigger on close, closing on Escape, marking
 * the rest of the page inert for assistive technology, and locking body scroll
 * without the layout shift a naive `overflow: hidden` causes.
 *
 * It handles none of what follows, which is on us: which button holds focus on
 * open, the wording, the visual weight of the destructive action, the animation
 * and its reduced-motion counterpart.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  trigger,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger === undefined ? null : <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-overlay" />

        <Dialog.Content
          // Focus lands on Cancel, not on the destructive button. Radix would
          // otherwise focus the first focusable element, and someone confirming
          // a dialog reflexively with Enter would delete their deck.
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancelRef.current?.focus();
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
