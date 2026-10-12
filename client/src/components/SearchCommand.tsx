import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { MangaCard } from "../types";
import { proxyUrl } from "../api";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SearchCommand({ open, onClose }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<MangaCard[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQ("");
      setResults([]);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open || q.trim().length < 2) {
      setResults([]);
      return;
    }
    const id = window.setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await api.search(q.trim(), 8));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => window.clearTimeout(id);
  }, [q, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function go(path: string) {
    onClose();
    navigate(path);
  }

  return (
    <div className="cmd-backdrop" onClick={onClose} role="presentation">
      <div
        className="cmd-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Search manga"
      >
        <div className="cmd-input-wrap">
          <span className="cmd-icon" aria-hidden>
            ⌕
          </span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search titles…"
            aria-label="Search titles"
          />
          <kbd className="cmd-kbd">Esc</kbd>
        </div>
        <div className="cmd-results">
          {loading ? (
            <p className="cmd-hint">Searching…</p>
          ) : results.length === 0 ? (
            <p className="cmd-hint">
              {q.trim().length < 2
                ? "Type at least 2 characters"
                : "No matches"}
            </p>
          ) : (
            results.map((m) => (
              <button
                key={m.id}
                type="button"
                className="cmd-row"
                onClick={() => go(`/manga/${m.id}`)}
              >
                {m.coverUrl ? (
                  <img src={proxyUrl(m.coverUrl)} alt="" loading="lazy" />
                ) : (
                  <span className="cmd-thumb skeleton" />
                )}
                <span>
                  <strong>{m.title}</strong>
                  <small>{m.status}</small>
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
