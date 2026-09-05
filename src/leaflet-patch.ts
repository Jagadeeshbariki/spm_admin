import L from 'leaflet';

// Fix for _leaflet_pos error in React 18 strict mode and dynamic unmounting
const originalGetPosition = L.DomUtil.getPosition;
L.DomUtil.getPosition = function (el: HTMLElement) {
  if (!el) return new (L as any).Point(0, 0);
  try {
    return originalGetPosition.call(this, el);
  } catch (e) {
    return new (L as any).Point(0, 0);
  }
};

const originalSetPosition = L.DomUtil.setPosition;
L.DomUtil.setPosition = function (el: HTMLElement, point: L.Point) {
  if (!el) return;
  try {
    originalSetPosition.call(this, el, point);
  } catch (e) {
    // ignore
  }
};

const originalPopupUpdate = (L.Popup.prototype as any)._updatePosition;
(L.Popup.prototype as any)._updatePosition = function() {
  if (!this._container) return;
  originalPopupUpdate.call(this);
};

const originalTooltipUpdate = (L.Tooltip.prototype as any)._updatePosition;
(L.Tooltip.prototype as any)._updatePosition = function() {
  if (!this._container) return;
  originalTooltipUpdate.call(this);
};

const originalMarkerSetPos = (L.Marker.prototype as any)._setPos;
(L.Marker.prototype as any)._setPos = function(pos: any) {
  if (!this._icon) return;
  originalMarkerSetPos.call(this, pos);
};
