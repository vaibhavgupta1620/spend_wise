// src/lib/currentUser.ts
export interface AuthUser {
    _id?: string;
    id?: string;
    email?: string;
    name?: string;
    [key: string]: any;
}

export function getStoredAuthUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("auth_user");
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

// This string will be used to namespace localStorage keys
export function getCurrentUserKey(): string {
    const user = getStoredAuthUser();
    const id = user?._id || user?.id || user?.email;
    return id ? String(id) : "guest";
}
