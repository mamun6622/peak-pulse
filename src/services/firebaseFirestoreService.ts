import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Activity } from '../types/activity';
import { recompressDataUri } from '../utils/imageCompressor';

const ACTIVITIES_COLLECTION = 'activities';

/**
 * Sanitize and optimize activity for Firestore storage:
 * - Ensure photos are efficiently compressed data URIs or standard URLs (never corrupting via slice)
 * - Assign authorUid from current authenticated user
 */
async function prepareActivityForFirestore(activity: Activity): Promise<Record<string, any>> {
  const currentUid = auth.currentUser?.uid || 'mamun_admin';

  // Process photos with safe async recompression
  const cleanedPhotos = await Promise.all(
    (activity.photos || []).map(async (p, idx) => {
      let finalUrl = p.url || '';
      if (typeof window !== 'undefined' && finalUrl.startsWith('data:image/')) {
        try {
          finalUrl = await recompressDataUri(finalUrl, 850, 850, 0.68);
        } catch {
          // Keep as is if canvas recompression fails
        }
      }
      return {
        id: p.id || `photo_${Date.now()}_${idx}`,
        url: finalUrl,
        caption: (p.caption || '').slice(0, 300),
        isCover: Boolean(p.isCover),
      };
    })
  );

  const payload: Record<string, any> = {
    id: activity.id,
    activityType: activity.activityType,
    date: activity.date,
    durationMinutes: Number(activity.durationMinutes) || 0,
    distanceKm: Number(activity.distanceKm) || 0,
    elevationGainM: Number(activity.elevationGainM) || 0,
    notes: (activity.notes || '').slice(0, 3000),
    photos: cleanedPhotos,
    authorUid: (activity as any).authorUid || currentUid,
    updatedAt: new Date().toISOString(),
  };

  if (activity.activityType === 'summit') {
    if (activity.mountainId) payload.mountainId = String(activity.mountainId).slice(0, 128);
    if (activity.mountainName) payload.mountainName = String(activity.mountainName).slice(0, 150);
    if (activity.koreanName) payload.koreanName = String(activity.koreanName).slice(0, 150);
    if (activity.peakName) payload.peakName = String(activity.peakName).slice(0, 150);
    if (activity.elevationM !== undefined) payload.elevationM = Number(activity.elevationM) || 0;
    if (activity.summitNumber !== undefined) payload.summitNumber = Number(activity.summitNumber) || 1;
    if (activity.weather) payload.weather = String(activity.weather).slice(0, 100);
    if (activity.companions) payload.companions = String(activity.companions).slice(0, 100);
    if (activity.trailTaken) payload.trailTaken = String(activity.trailTaken).slice(0, 200);
    if (activity.location) payload.location = String(activity.location).slice(0, 200);
    if (activity.coordinates) {
      payload.coordinates = {
        lat: Number(activity.coordinates.lat) || 0,
        lng: Number(activity.coordinates.lng) || 0,
      };
    }
  } else if (activity.activityType === 'running') {
    if (activity.title) payload.title = String(activity.title).slice(0, 200);
    if (activity.paceMinPerKm) payload.paceMinPerKm = String(activity.paceMinPerKm).slice(0, 20);
    if (activity.locationName) payload.locationName = String(activity.locationName).slice(0, 200);
    if (activity.routeType) payload.routeType = String(activity.routeType).slice(0, 100);
    if (activity.shoes) payload.shoes = String(activity.shoes).slice(0, 100);
    if (activity.coordinates) {
      payload.coordinates = {
        lat: Number(activity.coordinates.lat) || 0,
        lng: Number(activity.coordinates.lng) || 0,
      };
    }
  }

  return payload;
}

/**
 * Fetch all activities from Firestore
 */
export async function fetchActivitiesFromFirestore(): Promise<Activity[]> {
  const collectionPath = ACTIVITIES_COLLECTION;
  try {
    const q = query(collection(db, collectionPath), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    const results: Activity[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push(data as Activity);
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

/**
 * Subscribe to real-time activity updates from Firestore
 */
export function subscribeToFirestoreActivities(
  onUpdate: (activities: Activity[]) => void,
  onError?: (err: Error) => void
): () => void {
  const collectionPath = ACTIVITIES_COLLECTION;
  try {
    const q = query(collection(db, collectionPath), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Activity[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Activity);
        });
        onUpdate(items);
      },
      (error) => {
        console.warn('onSnapshot note in activities collection:', error);
        if (onError) {
          onError(error);
        }
      }
    );
    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionPath);
  }
}

/**
 * Save / create / edit activity in Firestore
 */
export async function saveActivityToFirestore(activity: Activity): Promise<void> {
  const docPath = `${ACTIVITIES_COLLECTION}/${activity.id}`;
  try {
    const data = await prepareActivityForFirestore(activity);
    await setDoc(doc(db, ACTIVITIES_COLLECTION, activity.id), data, { merge: true });
    console.log(`Successfully saved activity ${activity.id} to Firestore!`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Delete activity from Firestore
 */
export async function deleteActivityFromFirestore(activityId: string): Promise<void> {
  const docPath = `${ACTIVITIES_COLLECTION}/${activityId}`;
  try {
    await deleteDoc(doc(db, ACTIVITIES_COLLECTION, activityId));
    console.log(`Successfully deleted activity ${activityId} from Firestore!`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/**
 * Batch upload / sync all local activities to Firestore
 */
export async function syncAllActivitiesToFirestore(
  activities: Activity[],
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  const total = activities.length;

  for (let i = 0; i < total; i++) {
    try {
      await saveActivityToFirestore(activities[i]);
      success++;
    } catch (err) {
      console.error(`Failed to sync activity ${activities[i].id}:`, err);
      failed++;
    }
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return { success, failed };
}
