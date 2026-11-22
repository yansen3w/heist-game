// Small geometry helpers: angles, segment tests and circle-vs-rectangle collision.
// Nothing here knows about the game; the world and the guards both use it.

export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

export function distance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

/** Smallest absolute difference between two angles, in radians. */
export function angleDiff(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/** True when the point (px, py) lies inside rect (with an optional margin). */
export function pointInRect(px, py, rect, margin = 0) {
  return (
    px >= rect.x - margin &&
    px <= rect.x + rect.w + margin &&
    py >= rect.y - margin &&
    py <= rect.y + rect.h + margin
  );
}

/** True when a circle at (cx, cy) with radius r overlaps rect. */
export function circleHitsRect(cx, cy, r, rect) {
  const nx = clamp(cx, rect.x, rect.x + rect.w);
  const ny = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/** True when the segment (ax,ay)-(bx,by) crosses any edge of rect. */
export function segmentHitsRect(ax, ay, bx, by, rect) {
  if (pointInRect(ax, ay, rect) || pointInRect(bx, by, rect)) return true;
  const { x, y, w, h } = rect;
  return (
    segmentsCross(ax, ay, bx, by, x, y, x + w, y) ||
    segmentsCross(ax, ay, bx, by, x + w, y, x + w, y + h) ||
    segmentsCross(ax, ay, bx, by, x + w, y + h, x, y + h) ||
    segmentsCross(ax, ay, bx, by, x, y + h, x, y)
  );
}

/** True when nothing in `blockers` stands between (ax,ay) and (bx,by). */
export function lineOfSight(ax, ay, bx, by, blockers) {
  for (const rect of blockers) {
    if (segmentHitsRect(ax, ay, bx, by, rect)) return false;
  }
  return true;
}

/**
 * Move a circle at (x, y) with radius r by (dx, dy), sliding along rectangles
 * instead of passing through them. Returns the new position.
 */
export function moveCircle(x, y, r, dx, dy, solids) {
  let nx = x + dx;
  for (const rect of solids) {
    if (circleHitsRect(nx, y, r, rect)) {
      nx = dx > 0 ? rect.x - r : dx < 0 ? rect.x + rect.w + r : nx;
      if (circleHitsRect(nx, y, r, rect)) nx = x;
    }
  }
  let ny = y + dy;
  for (const rect of solids) {
    if (circleHitsRect(nx, ny, r, rect)) {
      ny = dy > 0 ? rect.y - r : dy < 0 ? rect.y + rect.h + r : ny;
      if (circleHitsRect(nx, ny, r, rect)) ny = y;
    }
  }
  return { x: nx, y: ny };
}
