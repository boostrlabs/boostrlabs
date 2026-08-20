const basePath = import.meta.env.BASE_URL;

const localAsset = (path: string) => `${basePath}assets/${path}`;

export const nneAssets = {
  brand: {
    nneWhite: localAsset("brand/nne-logo-white.png"),
    westdetroWhite: localAsset("brand/westdetro-logo-white.png"),
    westdetroBlack: localAsset("brand/westdetro-logo-black.png"),
    janko: localAsset("brand/janko-logo.webp")
  },
  seasonHero: localAsset("season/season-001-road-to-westdetro.webp"),
  music: {
    sisisi: localAsset("music/sisisi.webp"),
    deDescargue: localAsset("music/de-descargue.webp"),
    caption: localAsset("music/caption.webp")
  },
  artists: {
    xiam: localAsset("artists/xiam.webp")
  },
  rewards: {
    "s1_reward_shirt": localAsset("rewards/nne-westdetro-tee.webp"),
    "s1_reward_af1_white": localAsset("rewards/af1-white.webp"),
    "s1_reward_af1_black": localAsset("rewards/af1-black.webp"),
    "s1_reward_nike_tech": localAsset("rewards/nike-tech-black.webp"),
    "s1_reward_early": localAsset("season/season-001-road-to-westdetro.webp"),
    "s1_reward_creator_review": localAsset("artists/xiam.webp"),
    "s1_reward_westdetro_beat": localAsset("rewards/janko-floating-head.jpeg"),
    "s1_reward_production": localAsset("rewards/janko-floating-head.jpeg"),
    "s1_reward_focusrite_solo_3rd": localAsset("rewards/focusrite-solo-3rd-gen.png"),
    "s1_reward_at2020": localAsset("rewards/audio-technica-at2020.jpg"),
    "season-001-shirt": localAsset("rewards/nne-westdetro-tee.webp"),
    "season-001-af1-white": localAsset("rewards/af1-white.webp"),
    "season-001-af1-black": localAsset("rewards/af1-black.webp"),
    "season-001-nike-tech": localAsset("rewards/nike-tech-black.webp"),
    "season-001-early": localAsset("season/season-001-road-to-westdetro.webp")
  } satisfies Record<string, string>
};

export function rewardAssets(rewardId: string, apiImageUrl: string | null) {
  if (apiImageUrl) return [apiImageUrl];
  if (rewardId === "s1_reward_nike_tech" || rewardId === "season-001-nike-tech") {
    return [
      localAsset("rewards/nike-tech-gray.webp"),
      localAsset("rewards/nike-tech-black.webp")
    ];
  }
  const asset = (nneAssets.rewards as Record<string, string>)[rewardId];
  return asset ? [asset] : [];
}

export function questArtwork(title: string, songTitle: string | undefined, apiImageUrl: string | null | undefined) {
  const search = `${title} ${songTitle || ""}`.toLocaleLowerCase();
  if (search.includes("caption")) return nneAssets.music.caption;
  if (search.includes("sisisi") || search.includes("si si si")) return nneAssets.music.sisisi;
  if (search.includes("descargue")) return nneAssets.music.deDescargue;
  return apiImageUrl || null;
}
