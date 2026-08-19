const basePath = import.meta.env.BASE_URL;

const localAsset = (path: string) => `${basePath}assets/${path}`;

export const nneAssets = {
  brand: {
    nneWhite: localAsset("brand/nne-logo-white.png"),
    westdetroWhite: localAsset("brand/westdetro-logo-white.png"),
    westdetroBlack: localAsset("brand/westdetro-logo-black.png")
  },
  seasonHero: localAsset("season/season-001-road-to-westdetro.webp"),
  rewards: {
    "s1_reward_shirt": localAsset("rewards/nne-westdetro-tee.webp"),
    "s1_reward_af1_white": localAsset("rewards/af1-white.webp"),
    "s1_reward_af1_black": localAsset("rewards/af1-black.webp"),
    "s1_reward_nike_tech": localAsset("rewards/nike-tech-set.webp"),
    "s1_reward_early": localAsset("rewards/westdetro-early-access.webp"),
    "s1_reward_creator_review": localAsset("rewards/creator-review.webp"),
    "s1_reward_westdetro_beat": localAsset("rewards/janko-floating-head.jpeg"),
    "s1_reward_production": localAsset("rewards/janko-floating-head.jpeg"),
    "season-001-shirt": localAsset("rewards/nne-westdetro-tee.webp"),
    "season-001-af1-white": localAsset("rewards/af1-white.webp"),
    "season-001-af1-black": localAsset("rewards/af1-black.webp"),
    "season-001-nike-tech": localAsset("rewards/nike-tech-set.webp"),
    "season-001-early": localAsset("rewards/westdetro-early-access.webp")
  } satisfies Record<string, string>
};

export function rewardAsset(rewardId: string, apiImageUrl: string | null) {
  return apiImageUrl || (nneAssets.rewards as Record<string, string>)[rewardId] || null;
}
