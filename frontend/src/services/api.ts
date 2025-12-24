/**
 * api.ts - central API helper for SpendWise frontend
 * Usage: import { getExpenses, createExpense, updateExpense, deleteExpense } from './services/api'
 * Ensure VITE_API_BASE is set in .env (e.g. VITE_API_BASE=http://localhost:5000/api)
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

function buildAuthHeaders(extra: HeadersInit = {}): HeadersInit {
  const token = (typeof window !== 'undefined') ? localStorage.getItem('auth_token') : null;
  const headers: Record<string, string> = { ...extra as any };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleRes(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    let msg = text || res.statusText;
    try { msg = JSON.parse(text).message || msg } catch (e) {}
    throw new Error(msg);
  }
  return res.json();
}

export async function getExpenses(query = '') {
  const url = `${API_BASE}/expenses${query ? '?' + query : ''}`;
  const res = await fetch(url, { headers: buildAuthHeaders() });
  const data = await handleRes(res);
  // normalize _id -> id for UI convenience
  return data.map((d) => ({ ...d, id: d._id || d.id }));
}

export async function getExpense(id: string) {
  const res = await fetch(`${API_BASE}/expenses/${id}` , { headers: buildAuthHeaders() });
  const data = await handleRes(res);
  return { ...data, id: data._id || data.id };
}

export async function createExpense(payload: any) {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  const data = await handleRes(res);
  return { ...data, id: data._id || data.id };
}

export async function updateExpense(id: string, payload: any) {
  const res = await fetch(`${API_BASE}/expenses/${id}`, {
    method: 'PUT',
    headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  const data = await handleRes(res);
  return { ...data, id: data._id || data.id };
}

export async function deleteExpense(id: string) {
  const res = await fetch(`${API_BASE}/expenses/${id}`, { method: 'DELETE', headers: buildAuthHeaders() });
  return handleRes(res);
}