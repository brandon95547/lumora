# 6. Hands from the music; the Gothic nave

Date: 2026-11-27

## Context

Two Hands split the notes at middle C, which is wrong whenever a hand crosses it. A gothic fire
animation was wanted with the two hands kept accurately apart, left on the left and right on the
right.

## Decision

- **Hands are followed, not split** (`src/shared/hands.js`). Notes are taken chord by chord. Each
  hand has a position that follows what it plays and drifts home when idle. Every chord is
  divided at the cheapest point: the distance of each note from its hand, plus penalties for a
  hand stretching past an octave and a step or holding more than five notes. The hands never pass
  through each other. It is worked out once per song, and both Two Hands and Gothic use it. The
  middle-C split stays as the home both hands start from, and as the staff's clef rule.
- **A second layout for the fire run**, `nave`: the hands run down either side of the nave, each
  placed across its aisle by pitch (right hand: higher is further right; left hand: lower is
  further left). The forward timeline is shared with every other run.
- **The cathedral is geometry through the same camera** (`fire/cathedral.js`): floor, columns,
  pointed arcade arches, vault ribs, candles on stands, carved pedestals, all sorted far to near.
  Stone is lit by moonlight plus each fireball's own color falling off with distance, so the fire
  is the light. The rose window sits at the nave's vanishing point.
- **Omens are seeded from the song** (`fire/omens.js`): lightning on the hardest landings at the
  hottest moments (at most one every two seconds), bats bursting from them, falling ash, low mist.
- **An animation can choose its own camera angle**: picking Gothic switches to the Nave angle.

## Consequences

- Gothic frames cost about 8 ms (arches are drawn as single paths for this).
- The right and left fires are fixed teal and crimson; the palette colors the sky.
