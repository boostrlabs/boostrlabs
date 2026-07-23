import type { FeedItem, Quest, Reward, UserProfile } from "../types";

export const initialUser: UserProfile = {
  id: "usr_janko",
  name: "Janko Diorr",
  handle: "@jankodiorr",
  initials: "JD",
  level: 12,
  credits: 4280,
  xp: 580,
  xpToNextLevel: 1000,
  streakDays: 28,
  nneScore: 91,
  completedQuestCount: 129,
  title: "West Rookie"
};

export const initialQuests: Quest[] = [
  {
    id: "quest_instagram_gemese",
    type: "social-proof",
    platform: "Instagram",
    title: "Comenta el Reel de Gemese",
    description: "Deja un comentario relacionado con el contenido del video.",
    rewardCredits: 120,
    status: "completed",
    icon: "◉"
  },
  {
    id: "quest_youtube_subscribe",
    type: "social-proof",
    platform: "YouTube",
    title: "Suscríbete y activa la campana",
    description: "Suscríbete al canal oficial de NNE y activa las notificaciones.",
    rewardCredits: 180,
    status: "completed",
    icon: "▶"
  },
  {
    id: "quest_caption_listening",
    type: "listening-trivia",
    platform: "Spotify / YouTube",
    title: "CAPTION — Listening Quest",
    description:
      "Escucha la canción y supera una trivia aleatoria sobre letras, voces y estructura.",
    rewardCredits: 150,
    status: "open",
    icon: "♫",
    songUrl: "https://example.com/caption",
    minimumListenSeconds: 30,
    passPercentage: 75,
    trivia: [
      {
        id: "caption_q1",
        prompt: "¿Qué artista entra primero después del coro?",
        options: ["Janko", "Gemese", "Xiam", "Entran juntos"],
        correctOptionIndex: 0
      },
      {
        id: "caption_q2",
        prompt: "¿Cuál de estas opciones describe mejor el cambio del beat antes del segundo verso?",
        options: [
          "Se queda completamente sin drums",
          "Entra un cambio de bajo y percusión",
          "Aparece una guitarra acústica",
          "La canción termina"
        ],
        correctOptionIndex: 1
      },
      {
        id: "caption_q3",
        prompt: "¿Qué elemento se repite con más claridad en el hook?",
        options: [
          "Una frase corta",
          "Un silbido",
          "Una llamada telefónica",
          "Un sample hablado largo"
        ],
        correctOptionIndex: 0
      },
      {
        id: "caption_q4",
        prompt: "¿Cuál artista hace la última entrada vocal completa?",
        options: ["Janko", "Gemese", "Xiam", "82NGEL"],
        correctOptionIndex: 1
      }
    ]
  },
  {
    id: "quest_tiktok_share",
    type: "social-proof",
    platform: "TikTok",
    title: "Comparte WESTDETRO",
    description:
      "Comparte el video con una persona que conecte genuinamente con el movimiento.",
    rewardCredits: 150,
    status: "open",
    icon: "↗"
  },
  {
    id: "quest_referral_artist",
    type: "referral",
    platform: "Referral",
    title: "Invita a un artista",
    description:
      "Comparte tu enlace. El reward se acredita cuando la persona complete el registro.",
    rewardCredits: 500,
    status: "open",
    icon: "+"
  }
];

export const rewards: Reward[] = [
  {
    id: "reward_feedback",
    name: "Feedback de canción",
    description: "Revisión privada de estructura, mezcla y estrategia.",
    costCredits: 1200,
    minimumLevel: 1,
    icon: "🎧"
  },
  {
    id: "reward_master",
    name: "Master Stereo",
    description: "Master profesional listo para distribución.",
    costCredits: 5000,
    minimumLevel: 10,
    icon: "🎚"
  },
  {
    id: "reward_vocal_mix",
    name: "Mezcla vocal",
    description: "Voces procesadas, balanceadas y listas para release.",
    costCredits: 6500,
    minimumLevel: 18,
    icon: "🎙"
  },
  {
    id: "reward_beat_lease",
    name: "Beat Lease",
    description: "Licencia de uso para un beat seleccionado.",
    costCredits: 7500,
    minimumLevel: 15,
    icon: "🎹"
  },
  {
    id: "reward_cover",
    name: "Cover Art",
    description: "Diseño visual premium para un lanzamiento.",
    costCredits: 8500,
    minimumLevel: 22,
    icon: "◆"
  },
  {
    id: "reward_exclusive",
    name: "Beat Exclusivo",
    description: "Producción exclusiva realizada por NNE.",
    costCredits: 15000,
    minimumLevel: 30,
    icon: "★"
  }
];

export const feedItems: FeedItem[] = [
  {
    id: "feed_1",
    text: "Gemese desbloqueó un Beat Exclusivo.",
    timestamp: "Hace 8 min"
  },
  {
    id: "feed_2",
    text: "82NGEL llegó al Nivel 26.",
    timestamp: "Hace 19 min"
  },
  {
    id: "feed_3",
    text: "Xiam completó 7 quests esta semana.",
    timestamp: "Hace 31 min"
  },
  {
    id: "feed_4",
    text: "Nuevo reward disponible: Master Stereo.",
    timestamp: "Hace 1 h"
  },
  {
    id: "feed_5",
    text: "Janko mantuvo su streak por 28 días.",
    timestamp: "Hace 2 h"
  }
];
