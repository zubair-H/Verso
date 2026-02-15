export interface OutfitSwapSession {
  id: string;
  createdAt: number;
  imageUri: string;
  imageDataUri?: string;
  elements: string;
  topColorId: string;
  bottomColorId: string;
}

const sessions = new Map<string, OutfitSwapSession>();

function makeId() {
  return `os_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createOutfitSwapSession(input: Omit<OutfitSwapSession, 'id' | 'createdAt'>): OutfitSwapSession {
  const session: OutfitSwapSession = {
    ...input,
    id: makeId(),
    createdAt: Date.now(),
  };
  sessions.set(session.id, session);
  return session;
}

export function getOutfitSwapSession(id: string): OutfitSwapSession | null {
  return sessions.get(id) || null;
}

export function deleteOutfitSwapSession(id: string): void {
  sessions.delete(id);
}
