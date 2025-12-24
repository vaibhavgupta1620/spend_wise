// src/services/adminApi.ts
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

/**
 * Read JWT from localStorage and return headers
 */
function authHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleRes(res: Response) {
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        const err: any = new Error(text || res.statusText || `HTTP ${res.status}`);
        err.status = res.status;
        err.body = text;
        throw err;
    }
    try {
        return await res.json();
    } catch {
        return null;
    }
}

/** Users list */
export async function getAdminUsers({ q = "", page = 1, pageSize = 12 }: { q?: string; page?: number; pageSize?: number; }) {
    const params = new URLSearchParams({ q, page: String(page), pageSize: String(pageSize) });
    const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, {
        method: "GET",
        headers: {
            "Accept": "application/json",
            ...authHeaders(),
        },
        // keep credentials only if you rely on cookie auth; harmless when using header-based JWT
        credentials: "include",
    });
    return handleRes(res);
}

/** Roles */
export async function getRoles() {
    const res = await fetch(`${API_BASE}/admin/roles`, {
        method: "GET",
        headers: {
            "Accept": "application/json",
            ...authHeaders(),
        },
        credentials: "include",
    });
    return handleRes(res);
}

/** Update user */
export async function updateUser(id: string, payload: Partial<{ role: string; name: string }>) {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
        },
        credentials: "include",
        body: JSON.stringify(payload),
    });
    return handleRes(res);
}

/** Update status */
export async function updateUserStatus(id: string, payload: { active: boolean }) {
    const res = await fetch(`${API_BASE}/admin/users/${id}/status`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
        },
        credentials: "include",
        body: JSON.stringify(payload),
    });
    return handleRes(res);
}

/** Delete user */
export async function deleteUserById(id: string) {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
        method: "DELETE",
        headers: {
            ...authHeaders(),
        },
        credentials: "include",
    });
    return handleRes(res);
}

/** Bulk action */
export async function bulkUserAction({ ids, action }: { ids: string[]; action: "delete" | "enable" | "disable" }) {
    const res = await fetch(`${API_BASE}/admin/users/bulk`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
        },
        credentials: "include",
        body: JSON.stringify({ ids, action }),
    });
    return handleRes(res);
}
