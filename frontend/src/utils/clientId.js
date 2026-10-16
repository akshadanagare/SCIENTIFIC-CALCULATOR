let memoryId = null;

const makeId = () =>
  globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `c${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

/**
 * Every browser gets its own random id, so each person sees only their own history.
 */
export function getClientId() {
  try {
    let id = localStorage.getItem('mathcorner-client-id');
    if (!id) {
      id = makeId();
      localStorage.setItem('mathcorner-client-id', id);
    }
    return id;
  } catch {
    memoryId = memoryId || makeId();
    return memoryId;
  }
}
