import { useExpeditionDataStore, useAuthStore } from '@/stores';
import { EXPEDITION_TIERS } from '@/constants/expedition';
import { IUserMetadata } from '@/types';
import { checkExpeditionProgress as checkExpeditionProgressAPI } from '@/utils/api';

export const useExpedition = () => {
  const {
    activeTier,
    completedMilestones,
    setActiveTier,
    setCompletedMilestones,
    setLoading,
  } = useExpeditionDataStore();

  /**
   * Call the backend checkExpeditionProgress API.
   * Uses getState() to always read the latest address (avoids stale closures in useEffect).
   * The response is the full UserMetadata object.
   */
  const checkExpeditionProgress = async () => {
    const { address, setUserMetadata } = useAuthStore.getState();

    if (!address || address === '0x0000000000000000000000000000000000000000') return;

    setLoading(true);

    try {
      const data: IUserMetadata = await checkExpeditionProgressAPI(address);

      if (data) {
        setUserMetadata(address, data);
      }

      const activeTierId = (data?.metadata?.active_tier as number) ?? 0;
      const completedMilestoneIds: string[] =
        (data?.metadata?.completed_milestones as string[]) || [];

      setCompletedMilestones(new Set(completedMilestoneIds));

      const tierConfig = EXPEDITION_TIERS.find((t) => t.id === activeTierId) || EXPEDITION_TIERS[0];

      const updatedTier = {
        ...tierConfig,
        milestones: tierConfig.milestones.map((milestone) => ({
          ...milestone,
          completed: completedMilestoneIds.includes(milestone.id),
        })),
      };

      setActiveTier(updatedTier);
    } catch (error) {
      console.error('Error checking expedition progress:', error);
      // On error, ensure we still show the default tier with milestones
      setActiveTier(EXPEDITION_TIERS[0]);
    } finally {
      setLoading(false);
    }
  };

  return {
    activeTier,
    completedMilestones,
    checkExpeditionProgress,
  };
};
