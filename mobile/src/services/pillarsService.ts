import { db } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { PillarsData, PillarType } from "@/types/pillars";

export const pillarsService = {
  /**
   * Fetch pillars data by type (islam or iman)
   */
  getPillarsData: async (type: PillarType): Promise<PillarsData | null> => {
    const docRef = doc(db, "pillars", type);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return docSnap.data() as PillarsData;
  },

  /**
   * Fetch the 5 Pillars of Islam
   */
  getIslamPillars: async (): Promise<PillarsData | null> => {
    return pillarsService.getPillarsData("islam");
  },

  /**
   * Fetch the 6 Pillars of Iman
   */
  getImanPillars: async (): Promise<PillarsData | null> => {
    return pillarsService.getPillarsData("iman");
  },
};
