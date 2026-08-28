'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { Button, Card, Input, Label } from '@/shared/components/common';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Address {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  country: string;
  postalCode?: string | null;
  isDefault: boolean;
}

const EMPTY = { label: 'Home', recipientName: '', phone: '', line1: '', city: '', state: '', country: 'Nigeria' };

/**
 * Saved delivery addresses (L5). List / add / edit / delete / set default.
 */
export function AddressBook({ token }: { token?: string }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;

  const load = useCallback(() => {
    setLoading(true);
    fetch(API_BASE + '/shipping/addresses', { headers: token ? { Authorization: 'Bearer ' + token } : {} })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setAddresses(Array.isArray(j?.data) ? j.data : []))
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    setError('');
    if (!form.recipientName.trim() || !form.phone.trim() || !form.line1.trim() || !form.city.trim()) {
      setError('Name, phone, address and city are required.');
      return;
    }
    const url = editingId ? API_BASE + '/shipping/addresses/' + editingId : API_BASE + '/shipping/addresses';
    const method = editingId ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
    if (!res.ok) {
      setError('Could not save the address.');
      return;
    }
    setForm(EMPTY);
    setEditingId(null);
    load();
  };

  const remove = async (id: string) => {
    await fetch(API_BASE + '/shipping/addresses/' + id, { method: 'DELETE', headers });
    load();
  };

  const setDefault = async (id: string) => {
    await fetch(API_BASE + '/shipping/addresses/' + id + '/default', { method: 'POST', headers });
    load();
  };

  const beginEdit = (a: Address) => {
    setEditingId(a.id);
    setForm({ label: a.label, recipientName: a.recipientName, phone: a.phone, line1: a.line1, city: a.city, state: a.state ?? '', country: a.country });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-md border border-border p-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">{editingId ? 'Edit address' : 'Add an address'}</h4>
          {editingId && (
            <button type="button" className="text-xs text-muted-foreground hover:underline" onClick={() => { setEditingId(null); setForm(EMPTY); }}>
              Cancel
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <Label htmlFor="addr-label">Label</Label>
            <Input id="addr-label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="addr-name">Recipient name</Label>
            <Input id="addr-name" data-testid="addr-name" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="addr-phone">Phone</Label>
            <Input id="addr-phone" data-testid="addr-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="addr-city">City</Label>
            <Input id="addr-city" data-testid="addr-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="addr-line1">Address line</Label>
            <Input id="addr-line1" data-testid="addr-line1" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
          </div>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button size="sm" onClick={submit} data-testid="save-address">
          {editingId ? 'Save changes' : 'Add address'}
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading addresses...</p>
      ) : addresses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
      ) : (
        <ul className="space-y-2">
          {addresses.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-2 rounded-md border border-border p-3">
              <div className="text-sm">
                <p className="font-medium">
                  {a.label}
                  {a.isDefault && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-primary"><Star className="h-3 w-3" />Default</span>
                  )}
                </p>
                <p className="text-muted-foreground">
                  {a.recipientName} - {a.line1}, {a.city}, {a.country}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" aria-label="Edit" onClick={() => beginEdit(a)} className="rounded p-1 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                {!a.isDefault && (
                  <button type="button" aria-label="Set default" onClick={() => setDefault(a.id)} className="rounded p-1 hover:bg-muted"><Star className="h-4 w-4" /></button>
                )}
                <button type="button" aria-label="Delete" onClick={() => remove(a.id)} className="rounded p-1 hover:bg-muted text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AddressBook;
