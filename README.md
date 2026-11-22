# The Velvet Vault

[![best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/yansen3w/heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/yansen3w/heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

The Velvet Vault is a top-down 2D heist game built for the [best-heist-game-20261122-0559 bounty](https://make.fun/bounty/best-heist-game-20261122-0559) on make.fun.

You are a thief in the Marlow Gallery after dark. Slip past the guards' vision cones and the sweeping security cameras across three floors — The Lobby, The Gallery, and The Vault — hiding behind pillars, crates and display cases. Lift every artifact to open the exit, crack the vault on the last floor to steal the Velvet Diamond, and reach the exit unseen. Being seen fills the alarm meter; fill it and the alarm goes up and the guards chase until you break line of sight. Walking is fast but loud; sneaking is slow and quiet. Three lives, a score for loot and a time bonus for a clean getaway.

## Play

- Move: WASD / arrow keys, or click the floor to walk there
- Sneak (slow, quiet): hold Shift
- Crack the vault: hold E beside it
- Pause: P or Esc
- Start / restart: Enter, Space or click

No image, font, or audio files: everything is drawn with canvas primitives and the sound is synthesized with WebAudio. The game runs fully offline in a desktop browser.

## Run it

Serve `game/` with any static server — `node serve.ts` serves it at http://localhost:8080 — and open `game/index.html` in desktop Chrome.
