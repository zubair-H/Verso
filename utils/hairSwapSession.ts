export type HairSwapMode = 'stable' | 'fast';

export interface HairSwapSession {
  id: string;
  createdAt: number;
  selfie: string;
  look: string;
  elements: string;
  hairColorId?: string;
  hairStyleId?: string;
  eyeColorId?: string;
  noseId?: string;
  lipsId?: string;
  eyebrowsId?: string;
  eyebrowColorId?: string;
  topColorId?: string;
  bottomColorId?: string;
  swapMode: HairSwapMode;
}

const sessions = new Map<string, HairSwapSession>();

function makeId() {
  return `hs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createHairSwapSession(input: Omit<HairSwapSession, 'id' | 'createdAt'>): HairSwapSession {
  const session: HairSwapSession = {
    ...input,
    id: makeId(),
    createdAt: Date.now(),
  };
  sessions.set(session.id, session);
  return session;
}

export function getHairSwapSession(id: string): HairSwapSession | null {
  return sessions.get(id) || null;
}

export function deleteHairSwapSession(id: string): void {
  sessions.delete(id);
}
