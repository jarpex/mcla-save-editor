"use strict";

/* Formato do mc4.sav, obtido por engenharia reversa e verificado em jogo.
   header: u32 capacidade | u32 numSecoes
   secao : u32 nameLen | name | u8 flag | u32 size | data[size]   (repete)
   Inteiros big-endian: o jogo e PowerPC. Nao ha checksum, o walk fecha no EOF. */
