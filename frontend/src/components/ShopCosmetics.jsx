import { Avatar } from './Avatar.jsx';

export const shopCategories = {
  frame: 'Bingkai', chat: 'Tema chat', companion: 'Companion',
  background: 'Latar profil', title: 'Gelar', stickers: 'Stiker',
};

export function chatThemeClass(item) {
  if (!item) return '';
  return item.item_id === 'chat-candy' || item.accent === 'pink' ? 'chat-theme-candy' : 'chat-theme-holo';
}

export function ShopArtwork({ item, className = '' }) {
  if (!item) return null;
  return <img className={`shop-art ${className}`} src={`/shop/${item.asset_key}.webp`}
    alt={`Ilustrasi ${item.name}`} width="448" height="448" loading="lazy" decoding="async" />;
}

export function EquippedAvatar({ name, frame, size = 'regular' }) {
  return <span className={`equipped-avatar equipped-avatar-${size} ${frame ? `has-frame frame-accent-${frame.accent}` : ''}`}
    data-equipped-frame={frame?.item_id} title={frame?.name}>
    {frame && <img className="equipped-frame-art" src={`/shop/${frame.asset_key}.webp`} alt={`Bingkai ${frame.name}`} width="448" height="448" decoding="async" />}
    <Avatar name={name} size={size} />
  </span>;
}

export function EquippedTitle({ item }) {
  if (!item) return null;
  return <div className={`equipped-title cosmetic-accent-${item.accent}`} data-equipped-title={item.item_id}>
    <img src={`/shop/${item.asset_key}.webp`} alt="" width="448" height="448" decoding="async" />
    <strong>{item.name}</strong>
  </div>;
}

export function CyberCompanion({ item, compact = false, preview = false }) {
  if (!item) return null;
  return <div className={`cyber-companion ${compact ? 'companion-compact' : ''} cosmetic-accent-${item.accent || 'cyan'}`} data-equipped-companion={preview ? undefined : item.item_id}>
    <img src={`/shop/${item.asset_key || 'companion'}.webp`} alt={`Companion ${item.name}`} width="448" height="448" loading="lazy" decoding="async" />
    <div><span className="eyebrow">{preview ? 'PREVIEW ITEM TOKO' : 'COMPANION AKTIF'}</span><strong>{item.name}</strong></div>
  </div>;
}

export function ProfileIdentity({ avatar, equipment = {}, children }) {
  const { frame, background, title } = equipment;
  return <div className={`profile-identity ${background ? `identity-wallpaper cosmetic-accent-${background.accent}` : ''}`} data-equipped-background={background?.item_id}>
    {background && <img className="identity-wallpaper-art" src={`/shop/${background.asset_key}.webp`} alt={`Latar profil ${background.name}`} width="448" height="448" decoding="async" />}
    <div className="profile-id"><EquippedAvatar name={avatar} frame={frame} size="large"/><div className="profile-id-copy">{children}</div></div>
    <EquippedTitle item={title}/>
    {background && <p className="wallpaper-label">Latar aktif: {background.name}</p>}
  </div>;
}

export function EquippedCollection({ equipment = {} }) {
  const { companion, stickers, chat } = equipment;
  return <div className="profile-active-collection">
    {companion && <CyberCompanion item={companion}/>}
    {stickers && <div className={`profile-sticker cosmetic-accent-${stickers.accent}`} data-equipped-stickers={stickers.item_id}>
      <img src={`/shop/${stickers.asset_key}.webp`} width="448" height="448" alt={`Stiker ${stickers.name}`} loading="lazy" decoding="async"/>
      <div><span className="eyebrow">STIKER AKTIF</span><strong>{stickers.name}</strong></div>
    </div>}
    {chat && <div className={`profile-chat-preview ${chatThemeClass(chat)}`} data-equipped-chat={chat.item_id}>
      <div className="chat-scene-heading"><div><strong>{chat.name}</strong><span>Preview tema chat aktif</span></div></div>
      <div className="chat-bubbles"><div className="bubble incoming">Sudah periksa pengirimnya?</div><div className="bubble outgoing">Ya, aku cek lewat kanal resmi.</div></div>
    </div>}
  </div>;
}
