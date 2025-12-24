import React, { useEffect, useState, useRef } from "react";
import { downloadCSV } from "../utils/csv";
import {
    getAdminUsers,
    updateUser,
    updateUserStatus,
    deleteUserById,
    bulkUserAction,
    getRoles,
} from "../services/adminApi";
import {
    Pencil,
    Trash2,
    CheckSquare,
    Square,
    Loader2,
    User,
    ChevronLeft,
    ChevronRight,
    Search,
    Sun,
    Moon,
} from "lucide-react";

export type UserType = {
    id: string;
    name: string;
    email: string;
    role: string;
    active: boolean;
    avatarUrl?: string;
    createdAt?: string | Date;
};

export default function AdminPanel() {
    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(12);
    const [total, setTotal] = useState(0);

    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [selectAllOnPage, setSelectAllOnPage] = useState(false);

    const [editing, setEditing] = useState<UserType | null>(null);
    const [editingRole, setEditingRole] = useState("");
    const [roles, setRoles] = useState<string[]>([]);

    const [confirmDelete, setConfirmDelete] = useState<{ id: string; email: string } | null>(null);
    const [bulkConfirm, setBulkConfirm] = useState<"delete" | "enable" | "disable" | null>(null);

    const [theme, setTheme] = useState<"dark" | "light">("dark");

    const debounceRef = useRef<number | null>(null);

    useEffect(() => {
        fetchRoles();
    }, []);

    useEffect(() => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [page, query]);

    // apply theme class to <html> for Tailwind's dark styles if available
    useEffect(() => {
        const root = document.documentElement;
        if (theme === "dark") root.classList.add("dark");
        else root.classList.remove("dark");
    }, [theme]);

    async function fetchRoles() {
        try {
            const r = await getRoles();
            setRoles(r);
        } catch {
            // ignore
        }
    }

    async function fetchUsers() {
        setLoading(true);
        setError(null);
        try {
            const res = await getAdminUsers({ q: query, page, pageSize });
            setUsers(res.users);
            setTotal(res.total ?? res.users.length);
            setSelectedUsers(new Set());
            setSelectAllOnPage(false);
        } catch (err: any) {
            if (err?.status === 401 || err?.status === 403) {
                setError("Unauthorized — please login with an admin account.");
                console.warn("Admin API returned 401/403 — token missing/invalid or user not admin");
            } else {
                setError(err?.message || "Failed to load users");
            }
        } finally {
            setLoading(false);
        }
    }

    function toggleSelect(id: string) {
        setSelectedUsers((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function toggleSelectAllPage() {
        if (!selectAllOnPage) {
            const ids = users.map((u) => u.id);
            setSelectedUsers(new Set(ids));
            setSelectAllOnPage(true);
        } else {
            setSelectedUsers(new Set());
            setSelectAllOnPage(false);
        }
    }

    function openEdit(u: UserType) {
        setEditing(u);
        setEditingRole(u.role);
    }

    async function saveEdit() {
        if (!editing) return;
        try {
            await updateUser(editing.id, { role: editingRole });
            setUsers((prev) => prev.map((p) => (p.id === editing.id ? { ...p, role: editingRole } : p)));
            setEditing(null);
        } catch (err: any) {
            alert(err?.message || "Failed to update");
        }
    }

    async function toggleActive(u: UserType) {
        try {
            await updateUserStatus(u.id, { active: !u.active });
            setUsers((prev) => prev.map((p) => (p.id === u.id ? { ...p, active: !p.active } : p)));
        } catch (err: any) {
            alert(err?.message || "Failed to update status");
        }
    }

    async function deleteSingleConfirmed() {
        if (!confirmDelete) return;
        try {
            await deleteUserById(confirmDelete.id);
            setUsers((prev) => prev.filter((p) => p.id !== confirmDelete.id));
            setConfirmDelete(null);
        } catch (err: any) {
            alert(err?.message || "Delete failed");
        }
    }

    async function doBulk(type: "delete" | "enable" | "disable") {
        if (selectedUsers.size === 0) {
            alert("Select at least one user.");
            return;
        }

        if (type === "delete") {
            setBulkConfirm("delete");
            return;
        }

        setLoading(true);
        const ids = Array.from(selectedUsers);
        try {
            await bulkUserAction({ ids, action: type });

            if (type === "enable") {
                setUsers((prev) => prev.map((u) => (ids.includes(u.id) ? { ...u, active: true } : u)));
            } else {
                setUsers((prev) => prev.map((u) => (ids.includes(u.id) ? { ...u, active: false } : u)));
            }

            setSelectedUsers(new Set());
            setSelectAllOnPage(false);
        } catch (err: any) {
            alert(err?.message || "Bulk action failed");
        } finally {
            setLoading(false);
        }
    }

    async function confirmBulkDelete() {
        if (selectedUsers.size === 0) {
            setBulkConfirm(null);
            return;
        }

        const ids = Array.from(selectedUsers);
        if (!confirm(`Delete ${ids.length} user(s)? This action is permanent.`)) {
            setBulkConfirm(null);
            return;
        }

        setLoading(true);
        try {
            await bulkUserAction({ ids, action: "delete" });
            setUsers((prev) => prev.filter((u) => !ids.includes(u.id)));
            setSelectedUsers(new Set());
            setSelectAllOnPage(false);
            setBulkConfirm(null);
        } catch (err: any) {
            alert(err?.message || "Bulk delete failed");
        } finally {
            setLoading(false);
            setBulkConfirm(null);
        }
    }

    function exportCSV() {
        const rows = users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            active: u.active ? "Active" : "Disabled",
            createdAt: u.createdAt ?? "",
        }));
        downloadCSV(rows, "users_export.csv");
    }

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const roleColor = (r: string) => {
        // returns classes for both light and dark thanks to utility classes
        if (r === "admin") return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300";
        if (r === "moderator") return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
        return "bg-gray-100 text-gray-800 dark:bg-stone-900 dark:text-stone-300";
    };

    return (
        <div className={`min-h-screen p-6 ${theme === "dark" ? "bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold">Admin — Manage Users</h1>
                        <p className={theme === "dark" ? "text-sm text-gray-400" : "text-sm text-gray-600"}>Search, edit roles, enable/disable and export users.</p>
                    </div>

                    <div className="ml-auto flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:flex-none w-full md:w-80">
                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === "dark" ? "text-gray-400" : "text-gray-400"}`}>
                                <Search size={16} />
                            </div>
                            <input
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search by name or email"
                                className={`pl-10 pr-10 py-2 w-full rounded-lg border text-sm ${theme === "dark" ? "bg-gray-800 border-gray-700 text-gray-100 focus:ring-2 focus:ring-blue-500" : "bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500"}`}
                            />
                            {loading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                            title="Toggle theme"
                            className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
                        >
                            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                            <span className="hidden sm:inline text-sm">{theme === "dark" ? "Light" : "Dark"}</span>
                        </button>

                        <button
                            onClick={() => fetchUsers()}
                            className={`px-3 py-2 rounded-lg text-sm ${theme === "dark" ? "border border-gray-700" : "border border-gray-200 bg-white"}`}
                            aria-label="Refresh"
                        >
                            Refresh
                        </button>

                        <div className="flex gap-2">
                            <button
                                onClick={() => doBulk("enable")}
                                className={`px-3 py-2 text-sm rounded-lg disabled:opacity-50 ${theme === "dark" ? "bg-blue-600" : "bg-blue-600 text-white"}`}
                                disabled={loading}
                            >
                                Enable
                            </button>
                            <button
                                onClick={() => doBulk("disable")}
                                className={`px-3 py-2 text-sm rounded-lg disabled:opacity-50 ${theme === "dark" ? "bg-yellow-600" : "bg-yellow-600 text-white"}`}
                                disabled={loading}
                            >
                                Disable
                            </button>
                            <button
                                onClick={() => doBulk("delete")}
                                className={`px-3 py-2 text-sm rounded-lg disabled:opacity-50 ${theme === "dark" ? "bg-red-600" : "bg-red-600 text-white"}`}
                                disabled={loading}
                            >
                                Delete
                            </button>
                            <button onClick={exportCSV} className={`px-3 py-2 text-sm rounded-lg ${theme === "dark" ? "bg-emerald-600 text-white" : "bg-emerald-600 text-white"}`}>
                                Export CSV
                            </button>
                        </div>
                    </div>
                </div>

                {error && <div className={theme === "dark" ? "text-red-400 mb-4" : "text-red-600 mb-4"}>{error}</div>}

                {/* Desktop / large table */}
                <div className={`hidden md:block rounded-lg shadow overflow-hidden border ${theme === "dark" ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}>
                    <div className="w-full overflow-x-auto">
                        <table className="min-w-full table-fixed">
                            <thead className={theme === "dark" ? "bg-gray-900/60 border-b border-gray-800" : "bg-gray-50 border-b border-gray-200"}>
                                <tr>
                                    <th className="w-12 px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectAllOnPage}
                                            onChange={toggleSelectAllPage}
                                            className="rounded"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left">User</th>
                                    <th className="px-4 py-3 text-left">Email</th>
                                    <th className="px-4 py-3 text-left">Role</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-left">Created</th>
                                    <th className="w-44 px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className={`divide-y ${theme === "dark" ? "divide-gray-800" : "divide-gray-100"}`}>
                                {users.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={7} className={`p-8 text-center ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                            <div className="flex flex-col items-center gap-3">
                                                <User className="w-10 h-10 text-gray-500" />
                                                <div className="text-lg">No users found</div>
                                                <div className="text-sm">Try adjusting your search, or refresh the list.</div>
                                                <div>
                                                    <button onClick={() => fetchUsers()} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg">
                                                        Reload
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {loading && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center">
                                            <Loader2 className="mx-auto animate-spin" />
                                        </td>
                                    </tr>
                                )}

                                {users.map((u) => (
                                    <tr key={u.id} className="transition-colors" style={{ "backgroundClip": "padding-box" }}>
                                        <td className="px-4 py-3">
                                            <input type="checkbox" checked={selectedUsers.has(u.id)} onChange={() => toggleSelect(u.id)} className="rounded" />
                                        </td>

                                        <td className="px-4 py-3 flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm overflow-hidden border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-200"}`}>
                                                {u.avatarUrl ? (
                                                    <img src={u.avatarUrl} alt={`${u.name} avatar`} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>{(u.name || "—").slice(0, 2).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium">{u.name || "—"}</div>
                                                <div className={theme === "dark" ? "text-xs text-gray-400" : "text-xs text-gray-500"}>{u.email}</div>
                                            </div>
                                        </td>

                                        <td className={theme === "dark" ? "px-4 py-3 text-sm text-gray-300" : "px-4 py-3 text-sm text-gray-700"}>{u.email}</td>

                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${roleColor(u.role)}`}>
                                                {u.role}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3">{u.active ? <span className={theme === "dark" ? "text-emerald-300" : "text-emerald-700"}>Active</span> : <span className={theme === "dark" ? "text-red-300" : "text-red-600"}>Disabled</span>}</td>

                                        <td className={theme === "dark" ? "px-4 py-3 text-sm text-gray-400" : "px-4 py-3 text-sm text-gray-500"}>{u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</td>

                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button title="Edit" onClick={() => openEdit(u)} className={`p-2 rounded border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                                                    <Pencil size={14} />
                                                </button>

                                                <button title={u.active ? "Disable" : "Enable"} onClick={() => toggleActive(u)} className={`p-2 rounded border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                                                    {u.active ? <Square size={14} /> : <CheckSquare size={14} />}
                                                </button>

                                                <button title="View Expenses" onClick={() => window.open(`/admin/users/${u.id}/expenses`, "_blank")} className={`p-2 rounded border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                                                    <User size={14} />
                                                </button>

                                                <button title="Delete" onClick={() => setConfirmDelete({ id: u.id, email: u.email })} className={`p-2 rounded text-red-500 ${theme === "dark" ? "hover:bg-red-900/20" : "hover:bg-red-50"}`}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile / responsive cards */}
                <div className={`md:hidden rounded-lg shadow overflow-hidden border ${theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}`}>
                    <div className={`p-3 space-y-2 ${users.length === 0 ? "p-6" : ""}`}>
                        {users.length === 0 && !loading && (
                            <div className={`text-center ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                                <User className="w-10 h-10 mx-auto text-gray-500" />
                                <div className="text-lg">No users found</div>
                                <div className="text-sm">Try adjusting your search, or refresh the list.</div>
                                <div>
                                    <button onClick={() => fetchUsers()} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg">Reload</button>
                                </div>
                            </div>
                        )}

                        {loading && (
                            <div className="text-center p-6">
                                <Loader2 className="mx-auto animate-spin" />
                            </div>
                        )}

                        {users.map((u) => (
                            <div key={u.id} className={`p-3 rounded border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                                        {u.avatarUrl ? <img src={u.avatarUrl} alt={`${u.name} avatar`} className="w-full h-full object-cover" /> : <span className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>{(u.name || "—").slice(0, 2).toUpperCase()}</span>}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <div>
                                                <div className="font-medium">{u.name || "—"}</div>
                                                <div className={theme === "dark" ? "text-xs text-gray-400" : "text-xs text-gray-500"}>{u.email}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${roleColor(u.role)}`}>{u.role}</span>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className={theme === "dark" ? "text-sm text-gray-400" : "text-sm text-gray-600"}>{u.active ? "Active" : "Disabled"}</div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openEdit(u)} className={`p-2 rounded ${theme === "dark" ? "border border-gray-700" : "border border-gray-200"}`}><Pencil size={14} /></button>
                                                <button onClick={() => toggleActive(u)} className={`p-2 rounded ${theme === "dark" ? "border border-gray-700" : "border border-gray-200"}`}>{u.active ? <Square size={14} /> : <CheckSquare size={14} />}</button>
                                                <button onClick={() => setConfirmDelete({ id: u.id, email: u.email })} className={`p-2 rounded text-red-500 ${theme === "dark" ? "hover:bg-red-900/20" : "hover:bg-red-50"}`}><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div className={theme === "dark" ? "text-sm text-gray-400" : "text-sm text-gray-600"}>Page {page} of {totalPages} · {total} users</div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className={`px-3 py-1 border rounded disabled:opacity-40 ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className={theme === "dark" ? "text-sm text-gray-200" : "text-sm text-gray-700"}> {page} / {totalPages} </div>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className={`px-3 py-1 border rounded disabled:opacity-40 ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Edit modal */}
                {editing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className={`rounded-lg shadow-xl p-6 w-full max-w-md border ${theme === "dark" ? "bg-gray-900 border-gray-800 text-gray-100" : "bg-white border-gray-200 text-gray-900"}`}>
                            <h3 className="text-lg font-semibold mb-2">Edit user</h3>
                            <div className="mb-4">
                                <label className={theme === "dark" ? "text-sm text-gray-400" : "text-sm text-gray-600"}>Name</label>
                                <div className="font-medium">{editing.name}</div>
                            </div>
                            <div className="mb-4">
                                <label className={theme === "dark" ? "block text-sm mb-1 text-gray-400" : "block text-sm mb-1 text-gray-600"}>Role</label>
                                <div className="flex gap-2">
                                    <select value={editingRole} onChange={(e) => setEditingRole(e.target.value)} className={theme === "dark" ? "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-100" : "w-full px-3 py-2 bg-white border border-gray-200 rounded text-sm text-gray-900"}>
                                        {(roles.length ? roles : ["user", "admin", "moderator"]).map((r) => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    <button onClick={saveEdit} className="px-3 py-2 bg-blue-600 text-white rounded">Save</button>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setEditing(null)} className={theme === "dark" ? "px-4 py-2 border border-gray-700 rounded text-gray-200" : "px-4 py-2 border border-gray-200 rounded text-gray-700"}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* single delete confirm modal */}
                {confirmDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className={`rounded-lg shadow-xl p-6 w-full max-w-md border ${theme === "dark" ? "bg-gray-900 border-gray-800 text-gray-100" : "bg-white border-gray-200 text-gray-900"}`}>
                            <h3 className="text-lg font-semibold mb-2">Delete user</h3>
                            <p className={theme === "dark" ? "text-sm text-gray-300 mb-4" : "text-sm text-gray-700 mb-4"}>
                                Are you sure you want to permanently delete <strong className={theme === "dark" ? "text-gray-100" : "text-gray-900"}>{confirmDelete.email}</strong>?
                            </p>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setConfirmDelete(null)} className={theme === "dark" ? "px-4 py-2 border border-gray-700 rounded text-gray-200" : "px-4 py-2 border border-gray-200 rounded text-gray-700"}>Cancel</button>
                                <button onClick={deleteSingleConfirmed} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* bulk delete confirm modal */}
                {bulkConfirm === "delete" && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className={`rounded-lg shadow-xl p-6 w-full max-w-md border ${theme === "dark" ? "bg-gray-900 border-gray-800 text-gray-100" : "bg-white border-gray-200 text-gray-900"}`}>
                            <h3 className="text-lg font-semibold mb-2">Delete {selectedUsers.size} users?</h3>
                            <p className={theme === "dark" ? "text-sm text-gray-300 mb-4" : "text-sm text-gray-700 mb-4"}>
                                This will permanently delete the selected users. This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setBulkConfirm(null)} className={theme === "dark" ? "px-4 py-2 border border-gray-700 rounded text-gray-200" : "px-4 py-2 border border-gray-200 rounded text-gray-700"}>Cancel</button>
                                <button onClick={confirmBulkDelete} className="px-4 py-2 bg-red-600 text-white rounded">Delete {selectedUsers.size}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
