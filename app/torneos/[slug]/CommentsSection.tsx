"use client";

import { useState, useTransition } from "react";
import { postComment, deleteComment } from "@/app/actions/comments";
import { useToast } from "@/app/components/Toast";

interface CommentAuthor {
  name: string;
  avatarUrl: string | null;
}

interface CommentItem {
  id: string;
  body: string;
  createdAt: Date;
  author: CommentAuthor;
}

export function CommentsSection({
  tournamentId,
  initialComments,
  isLoggedIn,
}: {
  tournamentId: string;
  initialComments: CommentItem[];
  isLoggedIn: boolean;
}) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        const created = await postComment({ tournamentId, body: text.trim() });
        setComments((prev) => [created, ...prev]);
        setText("");
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo publicar el comentario";
        setError(message);
        toast(message, "error");
      }
    });
  }

  return (
    <div>
      <p className="mb-3 text-sm text-secondary">
        Comentarios y feedback ({comments.length})
      </p>

      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Preguntá algo o dejá tu feedback sobre el torneo"
            maxLength={500}
            className="flex-1 rounded-md border border-strong px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={isPending || !text.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Publicar
          </button>
        </form>
      ) : (
        <p className="mb-4 text-sm text-muted">Iniciá sesión para dejar un comentario.</p>
      )}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <ul className="flex flex-col gap-3">
        {comments.map((c) => (
          <li key={c.id} className="rounded-md bg-surface-1 p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-xs font-medium">
                {c.author.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-medium">{c.author.name}</span>
            </div>
            <p className="mt-1 text-sm">{c.body}</p>
          </li>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-muted">Todavía no hay comentarios. Sé el primero.</p>
        )}
      </ul>
    </div>
  );
}
