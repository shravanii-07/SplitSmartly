import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Small clickable receipt thumbnail; opens the full image in a dialog. */
export function ReceiptThumb({
  url,
  title,
  className = "size-11",
}: {
  url: string | null | undefined;
  title: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!url) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View receipt for ${title}`}
        className={`shrink-0 overflow-hidden rounded-lg border border-border transition hover:opacity-80 ${className}`}
      >
        <img src={url} alt={`Receipt for ${title}`} loading="lazy" className="size-full object-cover" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="truncate">Receipt · {title}</DialogTitle>
          </DialogHeader>
          <img
            src={url}
            alt={`Receipt for ${title}`}
            className="max-h-[70vh] w-full rounded-lg object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
