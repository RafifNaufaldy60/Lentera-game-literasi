import { Avatar } from './Avatar.jsx';

const categories = {
  frame: 'Bingkai', chat: 'Tema chat', companion: 'Companion',
  background: 'Latar profil', title: 'Gelar', stickers: 'Stiker',
};
export { categories as shopCategories };

export function ShopArtwork({ item, className = '' }) {
  if (!item) return null;
  return <img className={`shop-art ${className}`} src={`/shop/${item.asset_key}.webp`}
    alt={`Ilustrasi ${item.name}`} width="448" height="448" loading="lazy" decoding="async" />;
}

export function EquippedAvatar({ name, frame, size = 'regular' }) {
  return <span className={`equipped-avatar ${frame ? `has-frame frame-accent-${frame.accent}` : ''}`}>
    <Avatar name={name} size={size} />
    {frame && <span className="frame-indicator" aria-label={`Bingkai: ${frame.name}`} title={frame.name}>✦</span>}
  </span>;
}

export function CyberCompanion({ item, compact = false, preview = false }) {
  if (!item) return null;
  return <div className={`cyber-companion ${compact ? 'companion-compact' : ''} ${item.item_id === 'pet-aurora' ? 'companion-aurora' : ''}`}>
    <img src="/shop/companion.webp" alt="Robot kucing hologram yang menemani pemain" width="448" height="448" loading="lazy" />
    <div><span className="eyebrow">{preview ? 'PREVIEW ITEM TOKO' : 'COMPANION AKTIF'}</span><strong>{item.name}</strong></div>
  </div>;
}
