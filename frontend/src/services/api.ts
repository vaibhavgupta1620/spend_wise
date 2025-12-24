/**
 * api.ts - central API helper for SpendWise frontend
 * Uses VITE_API_BASE_URL from client/.env
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("❌ VITE_API_BASE_URL is not defined");
}

/* ----------------------------------------------------
   AUTH HEADER HELPER
---------------------------------------------------- */

function buildAuthHeaders(extra: HeadersInit = {}): HeadersInit {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("auth_token")
      : null;

  const headers: Record<string, string> = {
    ...(extra as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

/* ----------------------------------------------------
   RESPONSE HANDLER
---------------------------------------------------- */

async function handleRes(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    let msg = text || res.statusText;

    try {
      msg = JSON.parse(text).message || msg;
    } catch (_) {}

    throw new Error(msg);
  }

  return res.json();
}

/* ----------------------------------------------------
   EXPENSE APIs
---------------------------------------------------- */

export async function getExpenses(query = "") {
  const url = `${API_BASE_URL}/api/expenses${query ? "?" + query : ""}`;
  const res = await fetch(url, {
    headers: buildAuthHeaders(),
    credentials: "include",
  });

  const data = await handleRes(res);
  return data.map((d: any) => ({ ...d, id: d._id || d.id }));
}

export async function getExpense(id: string) {
  const res = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
    headers: buildAuthHeaders(),
    credentials: "include",
  });

  const data = await handleRes(res);
  return { ...data, id: data._id || data.id };
}

export async function createExpense(payload: any) {
  const res = await fetch(`${API_BASE_URL}/api/expenses`, {
    method: "POST",
    headers: buildAuthHeaders({
      "Content-Type": "application/json",
    }),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await handleRes(res);
  return { ...data, id: data._id || data.id };
}

export async function updateExpense(id: string, payload: any) {
  const res = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
    method: "PUT",
    headers: buildAuthHeaders({
      "Content-Type": "application/json",
    }),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await handleRes(res);
  return { ...data, id: data._id || data.id };
}

export async function deleteExpense(id: string) {
  const res = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
    method: "DELETE",
    headers: buildAuthHeaders(),
    credentials: "include",
  });

  return handleRes(res);
}
