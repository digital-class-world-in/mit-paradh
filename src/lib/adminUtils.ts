import { ref, get } from 'firebase/database';
import { realtimeDb } from './firebase';

let cachedAdminUid: string | null = null;

export async function getDefaultAdminUid(): Promise<string> {
  if (cachedAdminUid) {
    return cachedAdminUid;
  }
  
  // Removed sessionStorage read cache to ensure we always find the active admin with data.
  // We will still write to it so other legacy code using it doesn't break, but we won't trust the cache.
  // This fixes the issue where an empty admin UID gets stuck in the browser session.

  if (!realtimeDb) {
    return 'default-admin-uid';
  }

  try {
    const snapshot = await get(ref(realtimeDb, 'users'));
    if (snapshot.exists()) {
      const users = snapshot.val();
      let bestAdminUid = null;
      let maxItems = -1;

      for (const uid in users) {
        // Remove role check to ensure we find the data regardless of account corruption
        const modules = users[uid]?.modules || {};
        const coursesCount = modules.courses ? Object.keys(modules.courses).length : 0;
        const collegesCount = modules.colleges ? Object.keys(modules.colleges).length : 0;
        const totalItems = coursesCount + collegesCount;

        if (totalItems > maxItems) {
          maxItems = totalItems;
          bestAdminUid = uid;
        }
      }

      if (bestAdminUid) {
        console.log(`Resolved primary admin UID to: ${bestAdminUid} with ${maxItems} items`);
        cachedAdminUid = bestAdminUid;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('default_admin_uid', bestAdminUid);
        }
        return bestAdminUid;
      }
    }
  } catch (error) {
    console.error('Scan users for admin role failed:', error);
  }

  return 'default-admin-uid';
}
