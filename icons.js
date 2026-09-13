(()=>{
  const K=window.KWIZILLO_M1=window.KWIZILLO_M1||{};

  // One icon set for the whole UI: inline SVG, drawn in the same rounded,
  // glossy language as the artwork. Each icon fills with the current colour
  // (currentColor) so a button decides the colour, and carries a "shine"
  // gradient so it never looks like a flat web glyph.
  const wrap=(body,vb='0 0 24 24')=>`<svg class="ki" viewBox="${vb}" aria-hidden="true" focusable="false"><defs><linearGradient id="kis" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>${body}</svg>`;
  const shine=path=>`<path d="${path}" fill="url(#kis)"/>`;

  const ICONS={
    home:wrap(`<path d="M3.6 11.2 12 4l8.4 7.2v8.3a1.5 1.5 0 0 1-1.5 1.5H14v-5.6h-4V21H5.1a1.5 1.5 0 0 1-1.5-1.5z" fill="currentColor"/>${shine('M3.6 11.2 12 4l8.4 7.2v3.4L12 8.2 3.6 14.6z')}`),
    trophy:wrap(`<path d="M7 3h10v2h3v3a4 4 0 0 1-3.6 4 5 5 0 0 1-3.4 3.4V17h2.5a1.5 1.5 0 0 1 1.5 1.5V21H7v-2.5A1.5 1.5 0 0 1 8.5 17H11v-1.6A5 5 0 0 1 7.6 12 4 4 0 0 1 4 8V5h3zm-1 4v1a2 2 0 0 0 1 1.7V7zm12 0h-1v2.7A2 2 0 0 0 18 8z" fill="currentColor"/>${shine('M7 3h10v5.5L12 12 7 8.5z')}`),
    cards:wrap(`<rect x="3.5" y="5" width="11" height="15" rx="2.2" transform="rotate(-8 9 12.5)" fill="currentColor" opacity=".55"/><rect x="8" y="3.5" width="11.5" height="16" rx="2.2" transform="rotate(7 13.75 11.5)" fill="currentColor"/><path d="M13.7 7.2 15 9.6l2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4z" fill="#fff" opacity=".9"/>${shine('M8.4 4.4h11v6h-11z')}`),
    stats:wrap(`<rect x="3.5" y="12" width="4.6" height="8.5" rx="1.4" fill="currentColor"/><rect x="9.7" y="6" width="4.6" height="14.5" rx="1.4" fill="currentColor"/><rect x="15.9" y="3" width="4.6" height="17.5" rx="1.4" fill="currentColor"/>${shine('M3.5 12h4.6v3H3.5zM9.7 6h4.6v3H9.7zM15.9 3h4.6v3h-4.6z')}`),
    gear:wrap(`<path d="M13.6 2.5a1 1 0 0 1 1 .8l.3 1.9a7.6 7.6 0 0 1 1.9 1.1l1.8-.7a1 1 0 0 1 1.2.4l1.6 2.8a1 1 0 0 1-.2 1.3l-1.5 1.2a7.8 7.8 0 0 1 0 2.2l1.5 1.2a1 1 0 0 1 .2 1.3l-1.6 2.8a1 1 0 0 1-1.2.4l-1.8-.7a7.6 7.6 0 0 1-1.9 1.1l-.3 1.9a1 1 0 0 1-1 .8h-3.2a1 1 0 0 1-1-.8l-.3-1.9a7.6 7.6 0 0 1-1.9-1.1l-1.8.7a1 1 0 0 1-1.2-.4l-1.6-2.8a1 1 0 0 1 .2-1.3l1.5-1.2a7.8 7.8 0 0 1 0-2.2L3.1 10a1 1 0 0 1-.2-1.3l1.6-2.8a1 1 0 0 1 1.2-.4l1.8.7a7.6 7.6 0 0 1 1.9-1.1l.3-1.9a1 1 0 0 1 1-.8zM12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z" fill="currentColor"/>${shine('M6 5.5h12v5H6z')}`),
    back:wrap(`<path d="M14.8 4.6a1.6 1.6 0 0 1 2.3 2.3L12 12l5.1 5.1a1.6 1.6 0 1 1-2.3 2.3l-6.2-6.3a1.6 1.6 0 0 1 0-2.2z" fill="currentColor"/>`),
    close:wrap(`<path d="M6.3 6.3a1.5 1.5 0 0 1 2.1 0l3.6 3.6 3.6-3.6a1.5 1.5 0 1 1 2.1 2.1L14.1 12l3.6 3.6a1.5 1.5 0 1 1-2.1 2.1L12 14.1l-3.6 3.6a1.5 1.5 0 1 1-2.1-2.1L9.9 12 6.3 8.4a1.5 1.5 0 0 1 0-2.1z" fill="currentColor"/>`),
    coin:wrap(`<circle cx="12" cy="12" r="9.5" fill="#ffc531"/><circle cx="12" cy="12" r="6.6" fill="none" stroke="#e08a00" stroke-width="1.6"/><path d="M12 8.2v7.6M9.8 10.2h4.4M9.8 13.8h4.4" stroke="#e08a00" stroke-width="1.8" stroke-linecap="round"/>${shine('M4 6h16v5H4z')}`),
    flame:wrap(`<path d="M12.6 2.4c.4 3 2.2 4.2 3.7 6 1.7 2 2.7 3.9 2.7 6.1A7 7 0 0 1 5 14.5c0-2.3 1-4 2.4-5.4.2 1.4.8 2.3 1.8 2.9-.4-3.7 1-6.9 3.4-9.6z" fill="#ff7a1a"/><path d="M12.2 10.5c.5 1.8 2.4 2.5 2.4 4.6A2.7 2.7 0 0 1 9.2 15c0-1.9 1.6-2.6 3-4.5z" fill="#ffd54a"/>${shine('M6 5h12v5H6z')}`),
    star:wrap(`<path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.7l-5.4 2.9 1.1-6.1L3.2 9.2l6.1-.8z" fill="#ffc531"/>${shine('M12 2.8l2.7 5.6 6.1.8-4.4 4.3L12 9.9 7.6 13.5 3.2 9.2l6.1-.8z')}`),
    lock:wrap(`<rect x="5" y="10" width="14" height="11" rx="2.5" fill="currentColor"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10h-2.2V7.5a1.8 1.8 0 0 0-3.6 0V10z" fill="currentColor"/><circle cx="12" cy="15.3" r="1.6" fill="#fff" opacity=".9"/>${shine('M5 10h14v4H5z')}`),
    check:wrap(`<path d="M4.5 12.6l4.6 4.6L19.6 6.7" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`),
    play:wrap(`<path d="M8 5.2a1.5 1.5 0 0 1 2.3-1.3l9.5 6.8a1.5 1.5 0 0 1 0 2.6l-9.5 6.8A1.5 1.5 0 0 1 8 18.8z" fill="currentColor"/>`),
    bulb:wrap(`<path d="M12 2.5a6.5 6.5 0 0 1 4 11.6c-.7.6-1 1.3-1 2.1V17H9v-.8c0-.8-.3-1.5-1-2.1A6.5 6.5 0 0 1 12 2.5z" fill="#ffd54a"/><rect x="9" y="18" width="6" height="3.2" rx="1.2" fill="currentColor"/>${shine('M7 4h10v5H7z')}`),
    repeat:wrap(`<path d="M12 4a8 8 0 0 1 7.5 5.2l1.6-1.6V13h-5.4l1.7-1.7A5.4 5.4 0 0 0 6.7 10L4.5 8.7A8 8 0 0 1 12 4zm0 16a8 8 0 0 1-7.5-5.2L2.9 16.4V11h5.4L6.6 12.7a5.4 5.4 0 0 0 10.7 1.3l2.2 1.3A8 8 0 0 1 12 20z" fill="currentColor"/>`),
    user:wrap(`<circle cx="12" cy="8" r="4.6" fill="currentColor"/><path d="M3.8 20.2a8.2 8.2 0 0 1 16.4 0v.8H3.8z" fill="currentColor"/>${shine('M7.4 3.4h9.2v5H7.4z')}`),
    medal:wrap(`<path d="M7 2.5h4l1 3 1-3h4l-3.5 7.2-1.5 1.1-1.5-1.1z" fill="currentColor" opacity=".7"/><circle cx="12" cy="15.5" r="6" fill="currentColor"/><path d="M12 11.7l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4z" fill="#fff" opacity=".92"/>${shine('M6 9.5h12v6H6z')}`),
    globe:wrap(`<circle cx="12" cy="12" r="9.5" fill="currentColor"/><path d="M4.4 9.6c2 .3 3.2 1.4 3.4 3.1.2 1.5-.9 2.4-.4 3.9.4 1.2 1.7 1.9 2.9 2.2-3.5-.4-6.1-3.2-6.4-6.7zm7.9-6.9c1.4 1.3.5 3-.6 3.9-1.1.9-2.6.7-3.2 2.1-.4 1 .4 2 1.5 2.1-2.5.4-4.4-1.3-5.2-3.5A9.5 9.5 0 0 1 12.3 2.7zm3.2 7.8c1.9 0 3.2 1.4 3.7 3-.7 3.3-3.5 5.8-6.8 6.4.3-1.7 1.7-2.5 1.7-4.2 0-1.5-1.2-2.4-1.1-3.7.1-1 1.4-1.5 2.5-1.5z" fill="#fff" opacity=".85"/>${shine('M4 4h16v6H4z')}`)
  };
  K.icon=(name,cls='')=>ICONS[name]?ICONS[name].replace('class="ki"',`class="ki ${cls}"`):'';
  K.ICONS=ICONS;

  // A round world badge: the world's own painting, cropped to its island.
  const FOCUS={ruimte:'center 30%',dieren:'center 38%',aarde:'center 60%',geschiedenis:'center 64%',wetenschap:'center 52%',mysterie:'center 24%'};
  K.worldBadge=(w,cls='')=>K.MASTER?.[w]?`<img class="world-badge ${cls}" src="${K.MASTER[w]}" alt="" style="object-position:${FOCUS[w]||'center'}">`:'';
})();
