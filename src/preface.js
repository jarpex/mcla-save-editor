"use strict";

/* mc4.sav layout, from reverse engineering and verified in game.
   header: u32 capacity | u32 sectionCount
   section: u32 nameLen | name | u8 flag | u32 size | data[size]   (repeats)
   Big-endian integers: the game is PowerPC. No checksum, the walk ends at EOF. */
