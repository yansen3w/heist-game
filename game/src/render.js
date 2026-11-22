// The renderer: everything the player sees, painted on one canvas. The playfield is
// a fixed 1280x720 logical area scaled to fit the window, letterboxed. Canvas
// primitives only — no image, font or audio files — so the game loads nothing.
import { CAMERA, COLOURS, FIELD, GUARD, PLAYER, VAULT } from './config.js';
import { angleDiff } from './geom.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WIN = 'win';
export const SCREEN_OVER = 'over';

const TAU = Math.PI * 2;

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    offsetX = (canvas.width - FIELD.width * scale) / 2;
    offsetY = (canvas.height - FIELD.height * scale) / 2;
  }
  resize();
  window.addEventListener('resize', resize);

  function draw(state, screen, best) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#060505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    drawFloor(state);
    drawExit(state);
    drawVault(state);
    drawLoot(state);
    drawCameras(state);
    drawGuards(state);
    drawPlayer(state);
    drawHud(state, screen);
    if (state.messageLeft > 0 && screen === SCREEN_PLAY) drawBanner(state);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    if (screen === SCREEN_PAUSED) drawPaused();
    if (screen === SCREEN_WIN) drawEnd(state, true, best);
    if (screen === SCREEN_OVER) drawEnd(state, false, best);
  }

  function drawFloor(state) {
    const floor = state.floor;
    ctx.fillStyle = COLOURS.floor;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Checker tiles.
    ctx.fillStyle = COLOURS.floorTile;
    const tile = 64;
    for (let y = 0; y < FIELD.height / tile; y++) {
      for (let x = 0; x < FIELD.width / tile; x++) {
        if ((x + y) % 2 === 0) ctx.fillRect(x * tile, y * tile, tile, tile);
      }
    }
    // Carpet runner down the middle.
    ctx.fillStyle = COLOURS.carpet;
    ctx.fillRect(FIELD.width / 2 - 130, 26, 260, FIELD.height - 52);
    ctx.fillStyle = '#7a2a34';
    ctx.fillRect(FIELD.width / 2 - 130, 26, 260, 6);
    ctx.fillRect(FIELD.width / 2 - 130, FIELD.height - 32, 260, 6);
    // Walls.
    for (const wall of floor.walls) {
      ctx.fillStyle = COLOURS.wall;
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.fillStyle = COLOURS.wallTop;
      if (wall.h < wall.w) ctx.fillRect(wall.x, wall.y + wall.h - 6, wall.w, 6);
      else ctx.fillRect(wall.x + wall.w - 6, wall.y, 6, wall.h);
    }
    // Paintings on the walls, gilt frames with a dab of colour.
    for (const p of floor.paintings) {
      ctx.fillStyle = '#c9a227';
      ctx.fillRect(p.x - 3, p.y - 3, p.w + 6, p.h + 6);
      ctx.fillStyle = '#31435c';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = '#d8c27a';
      ctx.fillRect(p.x + p.w * 0.25, p.y + p.h * 0.25, p.w * 0.5, p.h * 0.5);
    }
    // Obstacles: pillars, crates, display cases.
    for (const o of floor.obstacles) {
      const square = Math.abs(o.w - o.h) < 12;
      if (square) {
        ctx.fillStyle = COLOURS.pillar;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = '#6b563d';
        ctx.fillRect(o.x + 6, o.y + 6, o.w - 12, o.h - 12);
        ctx.fillStyle = '#2c2115';
        ctx.beginPath();
        ctx.arc(o.x + o.w / 2, o.y + o.h / 2, 10, 0, TAU);
        ctx.fill();
      } else if (o.w > o.h) {
        // Display case: glass top over a plinth.
        ctx.fillStyle = '#3d2c1c';
        ctx.fillRect(o.x, o.y + o.h - 14, o.w, 14);
        ctx.fillStyle = 'rgba(180, 210, 235, 0.28)';
        ctx.fillRect(o.x + 4, o.y + 4, o.w - 8, o.h - 18);
        ctx.strokeStyle = '#c9a227';
        ctx.lineWidth = 2;
        ctx.strokeRect(o.x + 4, o.y + 4, o.w - 8, o.h - 18);
      } else {
        ctx.fillStyle = COLOURS.crate;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.strokeStyle = '#3a2c18';
        ctx.lineWidth = 2;
        ctx.strokeRect(o.x + 4, o.y + 4, o.w - 8, o.h - 8);
        ctx.beginPath();
        ctx.moveTo(o.x, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.moveTo(o.x + o.w, o.y);
        ctx.lineTo(o.x, o.y + o.h);
        ctx.stroke();
      }
    }
  }

  function drawExit(state) {
    const exit = state.floor.exit;
    const open = state.exitOpen;
    ctx.fillStyle = open ? '#2f7a3d' : '#4a3b2c';
    ctx.fillRect(exit.x - 6, exit.y - 6, exit.w + 12, exit.h + 12);
    ctx.fillStyle = open ? '#7ddb8f' : '#241c14';
    ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
    ctx.fillStyle = open ? '#0d2b12' : '#8a7a5c';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(open ? 'EXIT' : 'LOCKED', exit.x + exit.w / 2, exit.y + exit.h / 2);
  }

  function drawVault(state) {
    const vault = state.floor.vault;
    if (!vault) return;
    const pulse = vault.opened ? 0 : 0.5 + 0.5 * Math.sin(state.time * 3);
    ctx.fillStyle = '#20262e';
    ctx.beginPath();
    ctx.arc(vault.x, vault.y, VAULT.radius + 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = vault.opened ? '#f5c542' : '#3a4552';
    ctx.beginPath();
    ctx.arc(vault.x, vault.y, VAULT.radius, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(vault.x, vault.y, VAULT.radius - 6, 0, TAU);
    ctx.stroke();
    if (vault.opened) {
      ctx.fillStyle = '#fff3c4';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('◆ OPEN ◆', vault.x, vault.y);
    } else {
      ctx.fillStyle = '#dfe6ee';
      ctx.beginPath();
      ctx.arc(vault.x, vault.y, 12, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#20262e';
      ctx.beginPath();
      ctx.arc(vault.x, vault.y, 5, 0, TAU);
      ctx.fill();
      // Crack progress ring.
      if (state.vaultChannel > 0) {
        ctx.strokeStyle = '#f5c542';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(vault.x, vault.y, VAULT.radius + 3, -Math.PI / 2, -Math.PI / 2 + (state.vaultChannel / 2) * TAU);
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(245, 197, 66, ${0.55 + pulse * 0.45})`;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HOLD E TO CRACK', vault.x, vault.y + VAULT.radius + 22);
    }
  }

  function drawLoot(state) {
    for (const item of state.floor.loot) {
      if (item.taken) continue;
      const bob = Math.sin(state.time * 3 + item.x) * 3;
      const y = item.y + bob;
      ctx.save();
      ctx.translate(item.x, y);
      // Glow.
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
      glow.addColorStop(0, 'rgba(245, 197, 66, 0.5)');
      glow.addColorStop(1, 'rgba(245, 197, 66, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, TAU);
      ctx.fill();
      if (item.kind === 'gem') {
        ctx.fillStyle = '#7fe7f2';
        ctx.beginPath();
        ctx.moveTo(0, -13);
        ctx.lineTo(11, 0);
        ctx.lineTo(0, 13);
        ctx.lineTo(-11, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#e8fbff';
        ctx.beginPath();
        ctx.moveTo(0, -13);
        ctx.lineTo(5, -4);
        ctx.lineTo(0, 0);
        ctx.lineTo(-5, -4);
        ctx.closePath();
        ctx.fill();
      } else if (item.kind === 'coin') {
        ctx.fillStyle = '#f5c542';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#a87e14';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 1);
      } else {
        // Vase.
        ctx.fillStyle = '#b56a3c';
        ctx.beginPath();
        ctx.moveTo(-6, -12);
        ctx.quadraticCurveTo(-14, 0, -7, 12);
        ctx.lineTo(7, 12);
        ctx.quadraticCurveTo(14, 0, 6, -12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#f5c542';
        ctx.fillRect(-8, -14, 16, 4);
      }
      ctx.restore();
    }
  }

  function cone(x, y, angle, range, halfAngle, colour) {
    const gradient = ctx.createRadialGradient(x, y, 8, x, y, range);
    gradient.addColorStop(0, colour);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
    ctx.closePath();
    ctx.fill();
  }

  function drawCameras(state) {
    for (const camera of state.cameras) {
      const alert = camera.seenPlayer;
      cone(
        camera.x,
        camera.y,
        camera.angle,
        CAMERA.visionRange,
        CAMERA.visionHalfAngle,
        alert ? 'rgba(255, 70, 60, 0.34)' : 'rgba(255, 90, 60, 0.20)',
      );
      ctx.fillStyle = '#1c1f24';
      ctx.beginPath();
      ctx.arc(camera.x, camera.y, 11, 0, TAU);
      ctx.fill();
      ctx.fillStyle = alert ? '#ff463c' : '#ff8a5c';
      ctx.beginPath();
      ctx.arc(camera.x, camera.y, 5, 0, TAU);
      ctx.fill();
      if (alert) {
        ctx.strokeStyle = '#ff463c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(camera.x, camera.y, 15 + Math.sin(state.time * 10) * 2, 0, TAU);
        ctx.stroke();
      }
    }
  }

  function drawGuards(state) {
    for (const guard of state.guards) {
      const alert = guard.state === 'chase' || guard.seenPlayer;
      cone(
        guard.x,
        guard.y,
        guard.facing,
        GUARD.visionRange,
        GUARD.visionHalfAngle,
        alert ? 'rgba(255, 60, 50, 0.30)' : 'rgba(245, 197, 66, 0.20)',
      );
      // Body: navy uniform, cap, facing tick.
      ctx.fillStyle = '#232c4a';
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, GUARD.radius, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#39457a';
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, GUARD.radius - 5, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, GUARD.radius, 0, TAU);
      ctx.stroke();
      const fx = guard.x + Math.cos(guard.facing) * (GUARD.radius + 5);
      const fy = guard.y + Math.sin(guard.facing) * (GUARD.radius + 5);
      ctx.fillStyle = alert ? '#ff5040' : '#f5c542';
      ctx.beginPath();
      ctx.arc(fx, fy, 3.5, 0, TAU);
      ctx.fill();
      if (guard.state === 'investigate') {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', guard.x, guard.y - GUARD.radius - 10);
      }
      if (guard.state === 'chase') {
        ctx.fillStyle = '#ff5040';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', guard.x, guard.y - GUARD.radius - 10);
      }
    }
  }

  function drawPlayer(state) {
    const p = state.player;
    if (state.graceLeft > 0 && Math.floor(state.time * 8) % 2 === 0) return; // blink while invulnerable
    // Soft shadow of the thief.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 9, 12, 6, 0, 0, TAU);
    ctx.fill();
    // Dark coat.
    ctx.fillStyle = '#101418';
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER.radius, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#e8e4d8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER.radius, 0, TAU);
    ctx.stroke();
    // Mask band and eyes looking where the thief faces.
    ctx.fillStyle = '#e8e4d8';
    ctx.fillRect(p.x - 7, p.y - 4, 14, 5);
    ctx.fillStyle = '#101418';
    ctx.beginPath();
    ctx.arc(p.x - 3, p.y - 1.5, 1.4, 0, TAU);
    ctx.arc(p.x + 3, p.y - 1.5, 1.4, 0, TAU);
    ctx.fill();
    // Sneak: a little "shh" crouch ring.
    if (p.sneaking) {
      ctx.strokeStyle = 'rgba(232, 228, 216, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, PLAYER.radius + 5, 0, TAU);
      ctx.stroke();
    }
    // Click-to-move target marker.
    if (state.clickTarget) {
      ctx.strokeStyle = 'rgba(245, 197, 66, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(state.clickTarget.x, state.clickTarget.y, 7, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(state.clickTarget.x - 10, state.clickTarget.y);
      ctx.lineTo(state.clickTarget.x + 10, state.clickTarget.y);
      ctx.moveTo(state.clickTarget.x, state.clickTarget.y - 10);
      ctx.lineTo(state.clickTarget.x, state.clickTarget.y + 10);
      ctx.stroke();
    }
  }

  function drawHud(state, screen) {
    ctx.fillStyle = 'rgba(6, 5, 5, 0.82)';
    ctx.fillRect(0, 0, FIELD.width, 44);
    ctx.fillStyle = '#f5c542';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('◆ THE VELVET VAULT', 14, 23);
    ctx.fillStyle = '#cbb98a';
    ctx.font = '13px sans-serif';
    ctx.fillText(state.floor.name, 250, 23);
    // Alarm meter in the middle.
    const meterX = 520;
    const meterW = 240;
    const meterY = 14;
    const alarmOn = state.alarm;
    const flash = alarmOn && Math.floor(state.time * 6) % 2 === 0;
    ctx.fillStyle = flash ? '#ff5040' : '#e8e4d8';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(alarmOn ? 'ALARM!' : 'ALARM', meterX - 10, 23);
    ctx.fillStyle = '#241c14';
    ctx.fillRect(meterX, meterY, meterW, 16);
    const heatColour = state.heat < 0.5 ? '#f5c542' : state.heat < 0.85 ? '#ff8a3c' : '#ff4030';
    ctx.fillStyle = heatColour;
    ctx.fillRect(meterX, meterY, meterW * state.heat, 16);
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(meterX, meterY, meterW, 16);
    // Right side: loot, score, lives, time.
    ctx.fillStyle = '#e8e4d8';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    const lootTotal = state.floor.loot.length + (state.floor.vault ? 1 : 0);
    ctx.fillText(`Loot ${state.loot}/${lootTotal}`, 880, 23);
    ctx.fillText(`Score ${state.score}`, 1010, 23);
    ctx.fillStyle = state.lives > 1 ? '#ff6b81' : '#ff4030';
    ctx.fillText('♥'.repeat(state.lives) || '—', 1090, 23);
    ctx.fillStyle = '#cbb98a';
    ctx.fillText(formatTime(state.time), 1266, 23);
    if (screen === SCREEN_PAUSED) return;
  }

  function drawBanner(state) {
    const alpha = Math.min(1, state.messageLeft);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(6, 5, 5, 0.78)';
    const w = Math.min(720, ctx.measureText(state.message).width + 60);
    ctx.fillRect((FIELD.width - w) / 2, FIELD.height - 86, w, 34);
    ctx.fillStyle = '#f5c542';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.message, FIELD.width / 2, FIELD.height - 68);
    ctx.restore();
  }

  function drawTitle(state, best) {
    ctx.fillStyle = 'rgba(6, 5, 5, 0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f5c542';
    ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText('THE VELVET VAULT', FIELD.width / 2, 190);
    ctx.fillStyle = '#e8e4d8';
    ctx.font = 'italic 22px Georgia, serif';
    ctx.fillText('One thief. Three floors. The Marlow Gallery after dark.', FIELD.width / 2, 238);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#cbb98a';
    const lines = [
      'Slip past the guards and their vision cones. Cameras sweep the open floor.',
      'Lift every artifact to open the exit. On the last floor, crack the vault (hold E).',
      'Seen fills the ALARM meter — full means the guards chase. Break line of sight to cool off.',
      'Walk fast and loud, or hold Shift to sneak slow and quiet. Click the floor to walk there.',
      '',
      'Move: WASD / arrows · Sneak: Shift · Crack vault: E · Pause: P · Start: Enter or click',
    ];
    lines.forEach((line, i) => ctx.fillText(line, FIELD.width / 2, 300 + i * 26));
    const pulse = 0.6 + 0.4 * Math.sin(state.time * 4);
    ctx.fillStyle = `rgba(245, 197, 66, ${pulse})`;
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('— PRESS ENTER OR CLICK TO START —', FIELD.width / 2, 500);
    if (best > 0) {
      ctx.fillStyle = '#cbb98a';
      ctx.font = '15px sans-serif';
      ctx.fillText(`Best getaway so far: ${best} points`, FIELD.width / 2, 540);
    }
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(6, 5, 5, 0.66)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = '#e8e4d8';
    ctx.font = 'bold 40px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', FIELD.width / 2, FIELD.height / 2 - 10);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#cbb98a';
    ctx.fillText('Press P or Esc to keep stealing', FIELD.width / 2, FIELD.height / 2 + 30);
  }

  function drawEnd(state, won, best) {
    ctx.fillStyle = won ? 'rgba(10, 30, 12, 0.78)' : 'rgba(30, 8, 8, 0.78)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = won ? '#7ddb8f' : '#ff6b5e';
    ctx.font = 'bold 56px Georgia, serif';
    ctx.fillText(won ? 'CLEAN GETAWAY' : 'BUSTED', FIELD.width / 2, 250);
    ctx.fillStyle = '#e8e4d8';
    ctx.font = '20px Georgia, serif';
    ctx.fillText(
      won
        ? 'The Velvet Diamond is gone before dawn. The gallery never saw you.'
        : 'The guards take you in. The gallery keeps its secrets — this time.',
      FIELD.width / 2,
      300,
    );
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#f5c542';
    ctx.fillText(`Score: ${state.score}   ·   Loot: ${state.loot}   ·   Time: ${formatTime(state.time)}`, FIELD.width / 2, 360);
    if (best > 0) {
      ctx.fillStyle = '#cbb98a';
      ctx.font = '15px sans-serif';
      ctx.fillText(`Best: ${best}`, FIELD.width / 2, 396);
    }
    const pulse = 0.6 + 0.4 * Math.sin(state.time * 4);
    ctx.fillStyle = `rgba(245, 197, 66, ${pulse})`;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Press Space or click to play again', FIELD.width / 2, 460);
  }

  return { draw, resize };
}

function formatTime(seconds) {
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Re-exported for the screenshot stager, which reads the facing helper.
export { angleDiff };
