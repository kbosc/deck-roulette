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
  /**
   * Where focus goes after the dialog closes **on a confirmation**.
   *
   * The dialog hands focus back to whatever opened it, which is right every
   * time but one: when confirming destroys that control — deleting the row its
   * button lived in. Focus then falls to the document body and strands a
   * keyboard user at the top of the page.
   *
   * Cancelling is deliberately left alone: the trigger is still there, and
   * returning to it is exactly what someone who changed their mind expects.
   */
  readonly onConfirmedFocus?: () => void;
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
  onConfirmedFocus,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  /**
   * A ref and not state: it is read while the dialog closes, and writing it
   * must not cause a render of its own.
   */
  const confirmed = useRef(false);
  /**
   * Whatever had focus when the dialog opened.
   *
   * Radix restores focus by itself only when the dialog carries a
   * `Dialog.Trigger`. A single dialog serving a whole list has none — each row
   * opens it with an ordinary button — so there is nothing for Radix to go
   * back to, and focus would fall to the document body.
   */
  const opener = useRef<HTMLElement | null>(null);

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
            // Read before focus moves: this handler runs while the opener still
            // has it.
            opener.current = document.activeElement as HTMLElement | null;

            event.preventDefault();
            cancelRef.current?.focus();
          }}
          // Radix restores focus as it closes, after any handler the confirm
          // button ran. Moving focus from `onConfirm` would therefore be undone
          // a moment later; it has to be done here instead.
          onCloseAutoFocus={(event) => {
            const wasConfirmed = confirmed.current;
            confirmed.current = false;

            if (wasConfirmed && onConfirmedFocus !== undefined) {
              event.preventDefault();
              onConfirmedFocus();
              return;
            }

            // `document.contains` matters: the opener may have been removed
            // while the dialog was up, and focusing a detached node does
            // nothing at all — focus would silently stay on the body.
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
