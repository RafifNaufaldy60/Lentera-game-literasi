import { resolvePlayerAvatar } from '../../shared/avatar-options.js';

const sceneSymbols = { orbit: '✦', pixel: '◆', spark: '✳', shield: '⬡' };

export function Avatar({ name = 'neon-luna', size = 'regular', decorative = true }) {
  const avatar = resolvePlayerAvatar(name);
  return <span className={`player-avatar player-avatar-${size}`}
    aria-hidden={decorative ? 'true' : undefined}
    role={decorative ? undefined : 'img'}
    aria-label={decorative ? undefined : `Avatar ${avatar.label}`}>
    <img src={avatar.src} alt="" width="448" height="448"
      loading={size === 'large' ? 'eager' : 'lazy'} decoding="async" />
  </span>;
}

export function SceneAvatar({ name = 'orbit' }) {
  const type = Object.hasOwn(sceneSymbols, name) ? name : 'orbit';
  return <span className={`game-avatar avatar-${type}`} aria-hidden="true">{sceneSymbols[type]}</span>;
}
