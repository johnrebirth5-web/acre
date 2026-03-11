"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ActivityCommentComposerProps = {
  officeId: string | null;
  scopeLabel: string;
};

export function ActivityCommentComposer({ officeId, scopeLabel }: ActivityCommentComposerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [body, setBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const trimmedBody = body.trim();

    if (!trimmedBody) {
      setError("Comment is required.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await fetch("/api/office/activity/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          officeId,
          scopeLabel,
          body: trimmedBody
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to add comment.");
      }

      setBody("");
      setIsOpen(false);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to add comment.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="bm-activity-comment-composer">
      {isOpen ? (
        <div className="bm-activity-comment-panel">
          <label className="bm-activity-filter-field">
            <span>Add comment</span>
            <textarea
              onChange={(event) => setBody(event.target.value)}
              placeholder={`Leave an internal note for ${scopeLabel}`}
              rows={3}
              value={body}
            />
          </label>
          <div className="bm-activity-comment-actions">
            <button className="bm-create-button" disabled={isSaving} onClick={handleSubmit} type="button">
              {isSaving ? "Saving..." : "Save comment"}
            </button>
            <button
              className="bm-view-toggle"
              disabled={isSaving}
              onClick={() => {
                setIsOpen(false);
                setBody("");
                setError("");
              }}
              type="button"
            >
              Cancel
            </button>
          </div>
          {error ? <p className="bm-transaction-submit-error">{error}</p> : null}
        </div>
      ) : (
        <button className="bm-create-button" onClick={() => setIsOpen(true)} type="button">
          Add comment
        </button>
      )}
    </div>
  );
}
