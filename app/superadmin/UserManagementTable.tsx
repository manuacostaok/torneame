"use client";

import { useState, useTransition } from "react";
import { setUserRole, setUserSuspended, searchUsers } from "@/app/actions/superadmin";
import { useToast } from "@/app/components/Toast";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  suspended: boolean;
  createdAt: Date;
}

const ROLES = ["PLAYER", "ORGANIZER", "ADMIN"] as const;

export function UserManagementTable({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [isSearching, startSearch] = useTransition();
  const toast = useToast();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    startSearch(async () => {
      try {
        const results = await searchUsers(query);
        setUsers(results);
      } catch (err) {
        toast(err instanceof Error ? err.message : "No se pudo buscar", "error");
      }
    });
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o email"
          className="flex-1 rounded-md border border-strong bg-transparent px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="rounded-md border border-strong px-4 py-2 text-sm disabled:opacity-60"
        >
          {isSearching ? "..." : "Buscar"}
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-2">
        {users.map((u) => (
          <UserRow key={u.id} user={u} />
        ))}
        {users.length === 0 && <p className="text-sm text-muted">Sin resultados.</p>}
      </div>
    </div>
  );
}

function UserRow({ user }: { user: UserRow }) {
  const [role, setRole] = useState(user.role);
  const [suspended, setSuspended] = useState(user.suspended);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const isSuperadmin = role === "SUPERADMIN";

  function handleRoleChange(newRole: string) {
    const previous = role;
    setRole(newRole);
    startTransition(async () => {
      try {
        await setUserRole(user.id, newRole as (typeof ROLES)[number]);
        toast(`${user.name} ahora es ${newRole}`, "success");
      } catch (err) {
        setRole(previous);
        toast(err instanceof Error ? err.message : "No se pudo cambiar el rol", "error");
      }
    });
  }

  function handleToggleSuspended() {
    const next = !suspended;
    startTransition(async () => {
      try {
        await setUserSuspended(user.id, next);
        setSuspended(next);
        toast(next ? `${user.name} suspendido` : `${user.name} restaurado`, "success");
      } catch (err) {
        toast(err instanceof Error ? err.message : "No se pudo procesar", "error");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-md bg-surface-1 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {user.name} {suspended && <span className="text-[var(--text-danger)]">(suspendido)</span>}
        </p>
        <p className="truncate text-xs text-muted">{user.email}</p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        {isSuperadmin ? (
          <span className="text-xs text-muted">SUPERADMIN</span>
        ) : (
          <select
            value={role}
            onChange={(e) => handleRoleChange(e.target.value)}
            disabled={isPending}
            className="rounded-md border border-strong bg-transparent px-2 py-1.5 text-xs disabled:opacity-60"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        )}
        {!isSuperadmin && (
          <button
            onClick={handleToggleSuspended}
            disabled={isPending}
            className={`rounded-md border px-3 py-1.5 text-xs disabled:opacity-60 ${
              suspended
                ? "border-strong text-secondary"
                : "border-strong text-[var(--text-danger)]"
            }`}
          >
            {suspended ? "Restaurar" : "Suspender"}
          </button>
        )}
      </div>
    </div>
  );
}
