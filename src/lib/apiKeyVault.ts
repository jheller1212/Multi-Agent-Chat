import { supabase } from './supabase';

const VAULT_KEY = 'mac_api_keys';

export type ProviderVault = {
  gpt4: string;
  claude: string;
  gemini: string;
  mistral: string;
  meta: string;
  alibaba: string;
};

const EMPTY: ProviderVault = { gpt4: '', claude: '', gemini: '', mistral: '', meta: '', alibaba: '' };

// Synchronous read from localStorage cache (used during conversations)
export function loadVault(): ProviderVault {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY };
  }
}

// Save to localStorage cache and trigger debounced server sync
export function saveVault(keys: ProviderVault): void {
  localStorage.setItem(VAULT_KEY, JSON.stringify(keys));
  window.dispatchEvent(new StorageEvent('storage', { key: VAULT_KEY }));
  debouncedServerSave(keys);
}

export function clearVault(): void {
  localStorage.removeItem(VAULT_KEY);
}

// --- Server sync ---

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedServerSave(keys: ProviderVault): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    syncVaultToServer(keys).catch(() => {});
  }, 1000);
}

export async function syncVaultToServer(keys: ProviderVault): Promise<void> {
  const hasAnyKey = Object.values(keys).some(k => k.length > 0);
  if (!hasAnyKey) {
    await supabase.functions.invoke('manage-api-keys', { body: { action: 'delete' } });
    return;
  }
  const { error } = await supabase.functions.invoke('manage-api-keys', {
    body: { action: 'save', keys },
  });
  if (error) console.warn('[Vault] Server save failed:', error.message);
}

export async function loadVaultFromServer(): Promise<ProviderVault> {
  try {
    const { data, error } = await supabase.functions.invoke('manage-api-keys', {
      body: { action: 'load' },
    });
    if (error || !data?.keys) return { ...EMPTY };
    const serverKeys: ProviderVault = { ...EMPTY, ...data.keys };
    // Populate localStorage cache and notify listeners
    localStorage.setItem(VAULT_KEY, JSON.stringify(serverKeys));
    window.dispatchEvent(new StorageEvent('storage', { key: VAULT_KEY }));
    return serverKeys;
  } catch {
    return { ...EMPTY };
  }
}
