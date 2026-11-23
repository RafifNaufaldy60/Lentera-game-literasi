export const playerAvatars = Object.freeze([
  { key: 'neon-luna', label: 'Luna', detail: 'Kawaii · Lavender', src: '/avatars/luna.webp' },
  { key: 'neon-kiro', label: 'Kiro', detail: 'Chibi · Cyan', src: '/avatars/kiro.webp' },
  { key: 'neon-rio', label: 'Rio', detail: 'Cyber Gamer · Biru', src: '/avatars/rio.webp' },
  { key: 'neon-axel', label: 'Axel', detail: 'Hologram · Electric', src: '/avatars/axel.webp' },
  { key: 'neon-nova', label: 'Nova', detail: 'Cyberpunk · Magenta', src: '/avatars/nova.webp' },
  { key: 'neon-nira', label: 'Nira', detail: 'Neko · Ungu', src: '/avatars/nira.webp' },
  { key: 'neon-yuki', label: 'Yuki', detail: 'Neko · Violet', src: '/avatars/yuki.webp' },
]);

// Aliases preserve profiles saved before the avatar image update.
export const legacyAvatarAliases = Object.freeze({
  orbit: 'neon-luna',
  pixel: 'neon-kiro',
  spark: 'neon-rio',
  shield: 'neon-axel',
});

export const defaultPlayerAvatarKey = 'neon-luna';
export const acceptedPlayerAvatarKeys = Object.freeze([
  ...Object.keys(legacyAvatarAliases),
  ...playerAvatars.map((avatar) => avatar.key),
]);

export function resolvePlayerAvatar(key) {
  const actualKey = legacyAvatarAliases[key] || key;
  return playerAvatars.find((avatar) => avatar.key === actualKey) || playerAvatars[0];
}
