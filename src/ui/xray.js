(() => {
  "use strict";

  const { TUNE_CATS, MOTO_CATS } = MCLA.data;
  const { el } = MCLA.ui;

/* ---------- Performance Shop: X-ray schematic ----------
   Two stacked layers, both absolutely placed in the same grid cell:
   `base` is the car itself (mesh, body, chassis) and never changes;
   `active` is the one category being edited, drawn in cyan and blinking.
   A category with no entry of its own gets a generic engine/suspension
   highlight, so the shop still renders while the set is being filled in. */

const XRAY_BASE_CAR = `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <!-- X-ray wireframe mesh -->
        <g stroke="#4b5a63" stroke-width="0.6" stroke-opacity="0.18">
          <line x1="76" y1="21" x2="76" y2="79"></line>
          <line x1="94" y1="21" x2="94" y2="79"></line>
          <line x1="112" y1="21" x2="112" y2="79"></line>
          <line x1="130" y1="21" x2="130" y2="79"></line>
          <line x1="148" y1="21" x2="148" y2="79"></line>
          <line x1="166" y1="22" x2="166" y2="78"></line>
          <line x1="42" y1="33" x2="178" y2="33"></line>
          <line x1="42" y1="42" x2="178" y2="42"></line>
          <line x1="42" y1="58" x2="178" y2="58"></line>
          <line x1="42" y1="67" x2="178" y2="67"></line>
        </g>

        <!-- Sculpted body silhouette, glasshouse and wheels -->
        <g stroke="#4b5a63" stroke-width="1.2" stroke-opacity="0.75">
          <path d="M18 32 Q22 20 42 18 Q62 16 82 18 L170 18 Q195 16 216 19 Q238 23 243 38 L243 62 Q238 77 216 81 Q195 84 170 82 L82 82 Q62 84 42 82 Q22 80 18 68 Z"></path>
          <path d="M18 35 L15 35 L15 65 L18 65" stroke-opacity="0.45"></path>
          <path d="M168 18 L164 11 L169 11 L173 18"></path>
          <path d="M168 82 L164 89 L169 89 L173 82"></path>
          <path d="M44 27 Q62 24 80 25 L154 25 Q170 26 178 32 L178 68 Q170 74 154 75 L80 75 Q62 76 44 73 Q40 50 44 27 Z" stroke-opacity="0.45"></path>
          <path d="M64 25 Q60 50 64 75" stroke-opacity="0.35"></path>
          <path d="M152 25 Q158 50 152 75" stroke-opacity="0.35"></path>
          <path d="M178 33 Q208 32 232 37" stroke-opacity="0.3"></path>
          <path d="M178 67 Q208 68 232 63" stroke-opacity="0.3"></path>

          <rect x="44" y="13" width="36" height="9" rx="3"></rect>
          <rect x="49" y="15.5" width="26" height="4" rx="1.5" stroke-opacity="0.4"></rect>
          <rect x="44" y="78" width="36" height="9" rx="3"></rect>
          <rect x="49" y="80.5" width="26" height="4" rx="1.5" stroke-opacity="0.4"></rect>

          <rect x="176" y="13" width="36" height="9" rx="3"></rect>
          <rect x="181" y="15.5" width="26" height="4" rx="1.5" stroke-opacity="0.4"></rect>
          <rect x="176" y="78" width="36" height="9" rx="3"></rect>
          <rect x="181" y="80.5" width="26" height="4" rx="1.5" stroke-opacity="0.4"></rect>
        </g>

        <!-- Ghosted drivetrain, suspension and fuel tank -->
        <g stroke="#4b5a63" stroke-width="1" stroke-opacity="0.35">
          <line x1="62" y1="22" x2="62" y2="78"></line>
          <line x1="56" y1="25" x2="56" y2="75" stroke-opacity="0.22"></line>
          <path d="M62 42 L51 24 M62 58 L51 76"></path>
          <path d="M72 45 L62 42 L56 44 L56 56 L62 58 L72 55 Z" fill="rgba(75,90,99,0.12)"></path>
          <line x1="72" y1="50" x2="154" y2="50" stroke-width="1.8"></line>
          <path d="M186 40 L172 43 L154 45 L154 55 L172 57 L186 60 Z" fill="rgba(75,90,99,0.12)"></path>
          <rect x="186" y="37" width="30" height="26" rx="3" fill="rgba(75,90,99,0.14)"></rect>
          <rect x="190" y="39.5" width="22" height="5" rx="1.5"></rect>
          <rect x="190" y="55.5" width="22" height="5" rx="1.5"></rect>
          <line x1="194" y1="22" x2="194" y2="78"></line>
          <path d="M190 37 L184 23 M190 63 L184 77"></path>
          <rect x="226" y="37" width="3.5" height="26" rx="1"></rect>
          <circle cx="221" cy="50" r="5.5" stroke-opacity="0.28"></circle>
          <rect x="28" y="38" width="13" height="21" rx="3" fill="rgba(75,90,99,0.1)"></rect>
          <line x1="34.5" y1="59" x2="34.5" y2="74"></line>
        </g>
      </svg>`;

const XRAY_BASE_MOTO = `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <!-- X-ray wireframe mesh (tank, tail & fairing) -->
        <g stroke="#4b5a63" stroke-width="0.6" stroke-opacity="0.22">
          <!-- Tank mesh -->
          <path d="M121.9 23.1 Q143.6 21.3 167.5 24.8"></path>
          <path d="M118.5 28.8 Q143.6 27 169.8 29.9"></path>
          <path d="M127.6 19.1 Q125.3 27.6 127 35"></path>
          <path d="M139 17.3 Q137.3 27 139 34.4"></path>
          <path d="M150.4 17.6 Q149.3 26.5 150.4 33.3"></path>
          <path d="M160.7 19.6 Q159.5 26.5 160.1 31.6"></path>
          <!-- Tail mesh -->
          <path d="M52.4 29.3 Q68.3 27.6 85.4 29.3"></path>
          <path d="M54.6 33.9 Q72.9 32.7 115.1 36.7"></path>
          <path d="M61.5 24.2 L60.3 35.6"></path>
          <path d="M72.9 24.2 L71.7 38.4"></path>
          <path d="M84.3 25.3 L83.1 40.1"></path>
          <path d="M96.8 34.4 L95.7 41.9"></path>
          <path d="M107.1 33.9 L105.9 42.4"></path>
          <!-- Fairing mesh -->
          <path d="M172.1 26.5 Q191.4 29.3 208.5 35.6"></path>
          <path d="M170.9 33.3 Q190.3 36.1 210.8 41.3"></path>
          <path d="M169.8 40.1 Q186.9 42.4 202.8 45.8"></path>
          <path d="M180 21.9 L175.5 56.1"></path>
          <path d="M190.3 23 L185.7 49.3"></path>
          <path d="M199.4 26.5 L196 47"></path>
        </g>

        <!-- Sculpted sportbike silhouette, windscreen, mirror & wheels -->
        <g stroke="#4b5a63" stroke-width="1.25" stroke-opacity="0.75">
          <!-- Tail cowl & stepped seat -->
          <path d="M50.1 24.8 Q66 23.1 83.7 24.8 Q88.3 31 94 33.9 Q105.9 35 117.3 32.2 L115.1 43.6 L74 39.6 L54.1 33.9 Z"></path>
          <path d="M54.1 33.9 L51.8 39.6 L58.6 41.3 L62.1 36.1" stroke-opacity="0.55"></path>

          <!-- Fuel tank -->
          <path d="M117.3 32.2 C119.6 19.6 133.3 16.8 147 17.3 C158.4 17.9 166.4 21.3 170.9 25.9 L168.6 29.3 Q144.7 34.4 118.5 36.1 Z"></path>

          <!-- Windscreen & mirror -->
          <path d="M172.1 20.8 L178.3 7.7 Q190.3 13.4 198.9 22.5 L185.7 21.3 Z" stroke-opacity="0.65"></path>
          <path d="M189.7 17.9 L193.7 9.9 L193.2 3.1 Q197.7 2 201.1 5.9 L202.8 9.9 L195.4 10.3 L191.7 18.7"></path>

          <!-- Clip-on handlebar -->
          <path d="M168.6 22.5 L160.1 27 L161.2 28.8 L170.4 24.2" stroke-opacity="0.65"></path>

          <!-- Nose cowl, headlight & full side fairing / belly pan -->
          <path d="M170.9 25.9 L172.1 20.8 L198.9 22.5 Q208.5 28.2 212.5 37.3 Q211.4 43 204 45.3 L186.9 48.7 L178.3 57.8 L172.6 78.3 Q170.9 84 164.1 84.6 L118.5 84.6 Q111.6 84 109.9 77.8 L115.6 58.4 L127.6 44.1 L168.6 33.9 Z"></path>
          <path d="M200.6 33.9 Q208 35 210.3 39.6 Q205.1 41.9 199.4 39.6 Z" stroke-opacity="0.55"></path>
          <path d="M129.9 47 L165.2 39 L162.9 55 L153.8 57.2 L153.8 73.2 L121.9 73.2 L123 57.2 Z" stroke-width="0.9" stroke-opacity="0.4"></path>

          <!-- Front fender -->
          <path d="M173.8 60.1 Q183.5 49.8 197.1 50.4 Q209.1 51 216 60.1 Q206.3 56.7 194.3 56.7 Q182.3 56.7 173.8 60.1 Z" fill="rgba(75,90,99,0.12)"></path>

          <!-- Rear wheel -->
          <circle cx="80.9" cy="74.3" r="23.4"></circle>
          <circle cx="80.9" cy="74.3" r="17.3" stroke-opacity="0.55"></circle>
          <circle cx="80.9" cy="74.3" r="15.7" stroke-opacity="0.35"></circle>
          <circle cx="80.9" cy="74.3" r="4.1"></circle>
          <line x1="80.9" y1="70.2" x2="80.9" y2="58.6" stroke-opacity="0.6"></line>
          <line x1="84.4" y1="72.3" x2="94.5" y2="66.5" stroke-opacity="0.6"></line>
          <line x1="84.4" y1="76.3" x2="94.5" y2="82.1" stroke-opacity="0.6"></line>
          <line x1="80.9" y1="78.4" x2="80.9" y2="90" stroke-opacity="0.6"></line>
          <line x1="77.4" y1="76.3" x2="67.3" y2="82.1" stroke-opacity="0.6"></line>
          <line x1="77.4" y1="72.3" x2="67.3" y2="66.5" stroke-opacity="0.6"></line>

          <!-- Front wheel -->
          <circle cx="194.9" cy="74.9" r="22.8"></circle>
          <circle cx="194.9" cy="74.9" r="16.9" stroke-opacity="0.55"></circle>
          <circle cx="194.9" cy="74.9" r="15.3" stroke-opacity="0.35"></circle>
          <circle cx="194.9" cy="74.9" r="3.9"></circle>
          <line x1="194.9" y1="71" x2="194.9" y2="59.6" stroke-opacity="0.6"></line>
          <line x1="198.3" y1="73" x2="208.1" y2="67.3" stroke-opacity="0.6"></line>
          <line x1="198.3" y1="76.8" x2="208.1" y2="82.5" stroke-opacity="0.6"></line>
          <line x1="194.9" y1="78.8" x2="194.9" y2="90.2" stroke-opacity="0.6"></line>
          <line x1="191.5" y1="76.8" x2="181.7" y2="82.5" stroke-opacity="0.6"></line>
          <line x1="191.5" y1="73" x2="181.7" y2="67.3" stroke-opacity="0.6"></line>
        </g>

        <!-- Ghosted twin-spar frame, USD forks, swingarm, engine & brakes -->
        <g stroke="#4b5a63" stroke-width="1" stroke-opacity="0.38">
          <!-- Front USD forks & triple clamps -->
          <line x1="169.2" y1="21.3" x2="193.5" y2="74.9" stroke-width="1.65"></line>
          <line x1="172.3" y1="20.2" x2="196.2" y2="74.1" stroke-width="1.25" stroke-opacity="0.6"></line>
          <line x1="167.5" y1="23.1" x2="174.3" y2="21.3" stroke-width="1.5"></line>
          <line x1="172.6" y1="33.9" x2="179.5" y2="32.2" stroke-width="1.5"></line>

          <!-- Twin-spar perimeter frame & subframe -->
          <path d="M173.2 29.9 L127.6 42.4 L115.1 43.6 L111.6 67.5 L117.3 68.1 L120.8 48.7 L169.8 36.1 Z" fill="rgba(75,90,99,0.14)"></path>
          <path d="M115.1 43.6 L59.2 30.5 M113.9 55 L75.2 39.6 M93.4 34.4 L90 42.4"></path>

          <!-- Rear monoshock & reservoir -->
          <line x1="112.8" y1="47.6" x2="101.4" y2="66.4" stroke-width="2"></line>
          <rect x="86.6" y="44.7" width="10.8" height="4.3" rx="2" transform="rotate(22 86.6 44.7)" fill="rgba(75,90,99,0.16)"></rect>

          <!-- Braced rear swingarm & chain -->
          <path d="M112.8 62.4 L80.9 72.6 L80.9 76.1 L113.9 68.1 Z" fill="rgba(75,90,99,0.16)"></path>
          <path d="M112.8 62.4 L96.8 57.8 L83.1 72.1"></path>
          <line x1="115.1" y1="66.9" x2="80.9" y2="70.7" stroke-width="0.75" stroke-opacity="0.45"></line>
          <line x1="115.1" y1="70.4" x2="80.9" y2="78" stroke-width="0.75" stroke-opacity="0.45"></line>

          <!-- Radiator -->
          <path d="M173.8 38.4 L177.8 39.6 L172.1 63.5 L168.1 62.4 Z" fill="rgba(75,90,99,0.14)"></path>

          <!-- Inclined inline-4 engine block & crankcase -->
          <path d="M143.6 37.3 L158.4 35 L166.4 42.4 L156.1 56.1 L139 53.3 Z" fill="rgba(75,90,99,0.16)"></path>
          <line x1="141.9" y1="41.9" x2="162.9" y2="45.3"></line>
          <line x1="140.7" y1="47" x2="160.1" y2="50.2"></line>
          <path d="M121.9 53.3 L157.2 55.5 L160.7 68.6 L153.8 75.5 L125.3 75.5 L120.8 67.5 Z" fill="rgba(75,90,99,0.16)"></path>
          <circle cx="134.4" cy="65.8" r="7.4" fill="rgba(75,90,99,0.15)"></circle>
          <circle cx="149.8" cy="65.8" r="5.5"></circle>

          <!-- Brake rotors & front caliper -->
          <circle cx="80.9" cy="74.3" r="11.6" stroke-opacity="0.45"></circle>
          <circle cx="194.9" cy="74.9" r="13" stroke-opacity="0.5"></circle>
          <circle cx="194.9" cy="74.9" r="8.4" stroke-opacity="0.3"></circle>
          <path d="M181.8 66.9 L185.7 65.8 L187.5 76.1 L182.9 77.2 Z" fill="rgba(75,90,99,0.18)"></path>
        </g>
      </svg>`;

const SCHEMATICS = {
  0: `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <defs>
          <filter id="exhaustGlow" x="-15%" y="-25%" width="130%" height="150%">
            <feGaussianBlur stdDeviation="1.4" result="blur"></feGaussianBlur>
            <feMerge>
              <feMergeNode in="blur"></feMergeNode>
              <feMergeNode in="SourceGraphic"></feMergeNode>
            </feMerge>
          </filter>
          <linearGradient id="mufflerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#5ce6e1" stop-opacity="0.38"></stop>
            <stop offset="50%" stop-color="#29c5c0" stop-opacity="0.16"></stop>
            <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.38"></stop>
          </linearGradient>
        </defs>

        <g filter="url(#exhaustGlow)">
          <!-- Outer soft tube walls -->
          <g stroke="#29c5c0" stroke-width="2.8" stroke-opacity="0.35">
            <path d="M206 39 C209 39 209 36 209 31 C209 25 205 23.5 198 23.5 C190 23.5 184 26.5 178 32 C174 35 171 36 167 36"></path>
            <path d="M148 36 C143 36 141 33 138 29 C135 25.5 132 24.5 126 24.5 L78 24.5 C72 24.5 70 22 64 22 L56 22 C51 22 49 24.5 44 24.5"></path>
            <line x1="29" y1="24.5" x2="20" y2="24.5"></line>

            <path d="M206 61 C209 61 209 64 209 69 C209 75 205 76.5 198 76.5 C190 76.5 184 73.5 178 68 C174 65 171 64 167 64"></path>
            <path d="M148 64 C143 64 141 67 138 71 C135 74.5 132 75.5 126 75.5 L78 75.5 C72 75.5 70 78 64 78 L56 78 C51 78 49 75.5 44 75.5"></path>
            <line x1="29" y1="75.5" x2="20" y2="75.5"></line>
          </g>

          <!-- Inner bright core & chambers -->
          <g stroke="#5ce6e1" stroke-width="1.35">
            <path d="M206 39 C209 39 209 36 209 31 C209 25 205 23.5 198 23.5 C190 23.5 184 26.5 178 32 C174 35 171 36 167 36"></path>
            <rect x="148" y="32.5" width="19" height="7" rx="1.6" fill="url(#mufflerGrad)"></rect>
            <line x1="150.5" y1="33.2" x2="150.5" y2="38.8" stroke-width="0.9" stroke-opacity="0.6"></line>
            <line x1="164.5" y1="33.2" x2="164.5" y2="38.8" stroke-width="0.9" stroke-opacity="0.6"></line>
            <path d="M148 36 C143 36 141 33 138 29 C135 25.5 132 24.5 126 24.5 L78 24.5 C72 24.5 70 22 64 22 L56 22 C51 22 49 24.5 44 24.5"></path>
            <path d="M44 23.3 L42 22.5 L31 22.5 L29 23.6 L29 25.4 L31 26.5 L42 26.5 L44 25.7 Z" fill="url(#mufflerGrad)"></path>
            <line x1="29" y1="24.5" x2="20" y2="24.5"></line>

            <path d="M206 61 C209 61 209 64 209 69 C209 75 205 76.5 198 76.5 C190 76.5 184 73.5 178 68 C174 65 171 64 167 64"></path>
            <rect x="148" y="60.5" width="19" height="7" rx="1.6" fill="url(#mufflerGrad)"></rect>
            <line x1="150.5" y1="61.2" x2="150.5" y2="66.8" stroke-width="0.9" stroke-opacity="0.6"></line>
            <line x1="164.5" y1="61.2" x2="164.5" y2="66.8" stroke-width="0.9" stroke-opacity="0.6"></line>
            <path d="M148 64 C143 64 141 67 138 71 C135 74.5 132 75.5 126 75.5 L78 75.5 C72 75.5 70 78 64 78 L56 78 C51 78 49 75.5 44 75.5"></path>
            <path d="M44 74.3 L42 73.5 L31 73.5 L29 74.6 L29 76.4 L31 77.5 L42 77.5 L44 76.7 Z" fill="url(#mufflerGrad)"></path>
            <line x1="29" y1="75.5" x2="20" y2="75.5"></line>
          </g>
        </g>
      </svg>`,
  1: `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <filter id="headerGlow" x="-20%" y="-25%" width="140%" height="150%">
          <feGaussianBlur stdDeviation="1.4" result="blur"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
        <linearGradient id="headerGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5ce6e1" stop-opacity="0.42"></stop>
          <stop offset="50%" stop-color="#29c5c0" stop-opacity="0.18"></stop>
          <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.42"></stop>
        </linearGradient>
      </defs>


      <!-- Lit exhaust headers (Headers) -->
      <g filter="url(#headerGlow)">
        <!-- Soft outer pipe walls -->
        <g stroke="#29c5c0" stroke-width="2.8" stroke-opacity="0.35">
          <path d="M191.5 37 L191.5 33.4 L209.5 33.4 L209.5 37"></path>
          <line x1="200.5" y1="33.4" x2="200.5" y2="22.8"></line>

          <path d="M191.5 63 L191.5 66.6 L209.5 66.6 L209.5 63"></path>
          <line x1="200.5" y1="66.6" x2="200.5" y2="77.2"></line>
        </g>

        <!-- Main 4-1 outline and collector branches -->
        <g stroke="#5ce6e1" stroke-width="1.25">
          <!-- Upper collector -->
          <path d="M190 37 L190 33.8 Q190 31.8 192.2 31.8 L196.6 31.8 Q198.4 31.8 198.6 29.8 L199.1 22.8 Q200.5 22.1 201.9 22.8 L202.4 29.8 Q202.6 31.8 204.4 31.8 L208.8 31.8 Q211 31.8 211 33.8 L211 37 L208.2 37 L208.2 34.8 Q208.2 34.2 207.2 34.2 L193.8 34.2 Q192.8 34.2 192.8 34.8 L192.8 37 Z" fill="url(#headerGrad)"></path>
          <line x1="197.5" y1="37" x2="197.5" y2="34.2" stroke-width="1.35"></line>
          <line x1="203.5" y1="37" x2="203.5" y2="34.2" stroke-width="1.35"></line>
          <line x1="198.9" y1="29.6" x2="202.1" y2="29.6" stroke-width="0.85" stroke-opacity="0.65"></line>

          <!-- Lower collector -->
          <path d="M190 63 L190 66.2 Q190 68.2 192.2 68.2 L196.6 68.2 Q198.4 68.2 198.6 70.2 L199.1 77.2 Q200.5 77.9 201.9 77.2 L202.4 70.2 Q202.6 68.2 204.4 68.2 L208.8 68.2 Q211 68.2 211 66.2 L211 63 L208.2 63 L208.2 65.2 Q208.2 65.8 207.2 65.8 L193.8 65.8 Q192.8 65.8 192.8 65.2 L192.8 63 Z" fill="url(#headerGrad)"></path>
          <line x1="197.5" y1="63" x2="197.5" y2="65.8" stroke-width="1.35"></line>
          <line x1="203.5" y1="63" x2="203.5" y2="65.8" stroke-width="1.35"></line>
          <line x1="198.9" y1="70.4" x2="202.1" y2="70.4" stroke-width="0.85" stroke-opacity="0.65"></line>
        </g>
      </g>
    </svg>`,
  2: `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <filter id="intakeGlow" x="-20%" y="-25%" width="140%" height="150%">
          <feGaussianBlur stdDeviation="1.4" result="blur"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
        <linearGradient id="intakeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5ce6e1" stop-opacity="0.42"></stop>
          <stop offset="50%" stop-color="#29c5c0" stop-opacity="0.18"></stop>
          <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.42"></stop>
        </linearGradient>
      </defs>


      <!-- Lit cold air intake (Cold air intake) -->
      <g filter="url(#intakeGlow)">
        <!-- Soft outer halo -->
        <g stroke="#29c5c0" stroke-width="2.8" stroke-opacity="0.35">
          <path d="M188 45 L212.5 45 L212.5 55.5 L209.5 59.5 L194 59.5 L194 53 L188 53 Z"></path>
          <path d="M212.5 55.5 Q218 57.5 223.5 58.6 L233 59.2"></path>
        </g>

        <!-- Main outline of plenum, pipe and cone filter -->
        <g stroke="#5ce6e1" stroke-width="1.25">
          <!-- Intake plenum and throttle body -->
          <path d="M187.5 44.5 L212 44.5 Q213.8 44.5 213.8 46.3 L213.8 54.4 L210.5 59.2 Q209.8 60.2 208.4 60.2 L195.2 60.2 Q193.6 60.2 193.6 58.6 L193.6 53.5 L187.5 53.5 Q186.5 53.5 186.5 52.3 L186.5 45.7 Q186.5 44.5 187.5 44.5 Z" fill="url(#intakeGrad)"></path>

          <!-- Inner ribs of the intake manifold -->
          <line x1="191.5" y1="45.2" x2="191.5" y2="52.8" stroke-width="0.85" stroke-opacity="0.55"></line>
          <line x1="197.5" y1="45.2" x2="197.5" y2="52.8" stroke-width="0.85" stroke-opacity="0.55"></line>
          <line x1="203.5" y1="45.2" x2="203.5" y2="52.8" stroke-width="0.85" stroke-opacity="0.55"></line>
          <line x1="209" y1="45.2" x2="209" y2="52.8" stroke-width="0.85" stroke-opacity="0.55"></line>
          <line x1="194" y1="53.5" x2="212.8" y2="53.5" stroke-width="0.85" stroke-opacity="0.5"></line>

          <!-- Intake pipe to the front grille -->
          <path d="M213.6 54.5 Q218.5 56.3 223.2 57.1 L223.2 59.9 Q217.5 59.4 211 58.2 Z" fill="url(#intakeGrad)" stroke-width="1.15"></path>

          <!-- Clamp and low-restriction cone filter -->
          <line x1="223.2" y1="56.8" x2="223.2" y2="60.2" stroke-width="1.4"></line>
          <path d="M223.5 56.9 L232.6 57.9 Q234 58.3 234 59.3 Q234 60.3 232.6 60.6 L223.5 60.1 Z" fill="url(#intakeGrad)" stroke-width="1.2"></path>
          <line x1="226.8" y1="57.4" x2="226.8" y2="60.1" stroke-width="0.75" stroke-opacity="0.6"></line>
          <line x1="230" y1="57.8" x2="230" y2="60.3" stroke-width="0.75" stroke-opacity="0.6"></line>
        </g>
      </g>
    </svg>`,
  3: `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <filter id="forcedGlow" x="-20%" y="-25%" width="140%" height="150%">
          <feGaussianBlur stdDeviation="1.4" result="blur"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
        <linearGradient id="forcedGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5ce6e1" stop-opacity="0.44"></stop>
          <stop offset="50%" stop-color="#29c5c0" stop-opacity="0.2"></stop>
          <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.44"></stop>
        </linearGradient>
      </defs>


      <!-- Lit forced induction outline (Forced induction) -->
      <g filter="url(#forcedGlow)">
        <!-- Soft outer halo of the charge pipe -->
        <path d="M188.6 41.2 L188.6 28.4 Q188.6 26.5 190.6 26.5 L217.6 26.5 Q219.9 26.5 219.9 28.6 L219.9 41.2" stroke="#29c5c0" stroke-width="3.2" stroke-opacity="0.34"></path>

        <!-- 3D charge piping and compressor / bypass housing -->
        <g stroke="#5ce6e1" stroke-width="1.2">
          <path d="M187.4 41.2 L187.4 28.2 Q187.4 25.4 190.4 25.4 L195.5 25.4 L196.2 24.7 L206.8 24.7 L207.5 25.4 L217.8 25.4 Q221.1 25.4 221.1 28.4 L221.1 41.2 L218.7 41.2 L218.7 28.8 Q218.7 27.7 217.4 27.7 L207.5 27.7 L206.8 28.3 L196.2 28.3 L195.5 27.7 L190.8 27.7 Q189.8 27.7 189.8 28.8 L189.8 41.2 Z" fill="url(#forcedGrad)"></path>

          <!-- Clamps on the thick housing and engine mating flanges -->
          <line x1="196.4" y1="24.9" x2="196.4" y2="28.1" stroke-width="0.9" stroke-opacity="0.65"></line>
          <line x1="206.6" y1="24.9" x2="206.6" y2="28.1" stroke-width="0.9" stroke-opacity="0.65"></line>
          <rect x="186.8" y="40.4" width="3.6" height="1.3" rx="0.5" fill="#5ce6e1" stroke="none"></rect>
          <rect x="218.1" y="40.4" width="3.6" height="1.3" rx="0.5" fill="#5ce6e1" stroke="none"></rect>
        </g>
      </g>
    </svg>`,
  4: `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <filter id="engineGlow" x="-20%" y="-25%" width="140%" height="150%">
          <feGaussianBlur stdDeviation="1.4" result="blur"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
        <linearGradient id="engineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5ce6e1" stop-opacity="0.46"></stop>
          <stop offset="50%" stop-color="#29c5c0" stop-opacity="0.22"></stop>
          <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.46"></stop>
        </linearGradient>
      </defs>


      <!-- Lit engine assembly (Engine upgrade) -->
      <g filter="url(#engineGlow)">
        <!-- Soft outer halo of the block -->
        <path d="M186 39.5 Q186 37 189 37 L213 37 Q216 37 217 39.5 L219 42.5 L219 57.5 L217 60.5 Q216 63 213 63 L197 63 L196 64.3 L191.5 64.3 L190.5 63 L189 63 Q186 63 186 60.5 Z" stroke="#29c5c0" stroke-width="2.6" stroke-opacity="0.34"></path>

        <!-- Main outline of engine and accessories -->
        <g stroke="#5ce6e1" stroke-width="1.25">
          <!-- Cylinder block with heads and lower sump lip -->
          <path d="M186 39.5 Q186 37 189 37 L213 37 Q216 37 217 39.5 L219 42.5 L219 57.5 L217 60.5 Q216 63 213 63 L197 63 L196 64.3 L191.5 64.3 L190.5 63 L189 63 Q186 63 186 60.5 Z" fill="url(#engineGrad)"></path>

          <!-- Valve covers and cylinder markings -->
          <rect x="190" y="39.5" width="22" height="5" rx="1.5" stroke-width="0.9" stroke-opacity="0.7"></rect>
          <rect x="190" y="55.5" width="22" height="5" rx="1.5" stroke-width="0.9" stroke-opacity="0.7"></rect>
          <line x1="195.5" y1="39.8" x2="195.5" y2="44.2" stroke-width="0.8" stroke-opacity="0.5"></line>
          <line x1="201" y1="39.8" x2="201" y2="44.2" stroke-width="0.8" stroke-opacity="0.5"></line>
          <line x1="206.5" y1="39.8" x2="206.5" y2="44.2" stroke-width="0.8" stroke-opacity="0.5"></line>
          <line x1="195.5" y1="55.8" x2="195.5" y2="60.2" stroke-width="0.8" stroke-opacity="0.5"></line>
          <line x1="201" y1="55.8" x2="201" y2="60.2" stroke-width="0.8" stroke-opacity="0.5"></line>
          <line x1="206.5" y1="55.8" x2="206.5" y2="60.2" stroke-width="0.8" stroke-opacity="0.5"></line>

          <!-- Central block valley plate -->
          <rect x="191" y="46.8" width="20" height="6.4" rx="1.5" stroke-width="0.85" stroke-opacity="0.55"></rect>

          <!-- Front pulley and cooling fan blades -->
          <path d="M219 46.8 L224.2 43.3 L225 44.6 L221 48.5 Z" fill="url(#engineGrad)" stroke-width="1.05"></path>
          <path d="M219 53.2 L224.2 56.7 L225 55.4 L221 51.5 Z" fill="url(#engineGrad)" stroke-width="1.05"></path>
          <path d="M219 47.6 L223.6 48.6 L223.6 51.4 L219 52.4 Z" fill="url(#engineGrad)" stroke-width="1.1"></path>
        </g>
      </g>
    </svg>`,
  5: `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <filter id="electronicsGlow" x="-20%" y="-25%" width="140%" height="150%">
          <feGaussianBlur stdDeviation="1.4" result="blur"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
        <linearGradient id="electronicsGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5ce6e1" stop-opacity="0.44"></stop>
          <stop offset="50%" stop-color="#29c5c0" stop-opacity="0.2"></stop>
          <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.44"></stop>
        </linearGradient>
      </defs>


      <!-- Lit engine wiring and ECU outline (Electronics) -->
      <g filter="url(#electronicsGlow)">
        <!-- Soft outer halo of the harness -->
        <g stroke="#29c5c0" stroke-width="3" stroke-opacity="0.34">
          <path d="M179.5 36.5 L206.5 36.5 L206.5 61.5 L179.5 61.5 Z"></path>
          <line x1="179.5" y1="61.5" x2="179.5" y2="77.2"></line>
        </g>

        <!-- Main outline of wiring and connector module -->
        <g stroke="#5ce6e1" stroke-width="1.35">
          <path d="M179.5 37.7 Q179.5 36.5 180.7 36.5 L205.3 36.5 Q206.5 36.5 206.5 37.7 L206.5 60.3 Q206.5 61.5 205.3 61.5 L179.5 61.5 Z"></path>
          <line x1="179.5" y1="61.5" x2="179.5" y2="69.2"></line>

          <!-- T-splitter and thick connector by the front wheel -->
          <rect x="178.7" y="60.3" width="1.6" height="2.4" rx="0.6" fill="#5ce6e1" stroke="none"></rect>
          <rect x="178.4" y="69.2" width="2.2" height="8.2" rx="1.1" fill="url(#electronicsGrad)" stroke-width="1.15"></rect>
          <line x1="178.7" y1="71.6" x2="180.3" y2="71.6" stroke-width="0.75" stroke-opacity="0.65"></line>
        </g>
      </g>
    </svg>`,
  6: `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <filter id="nitrousGlow" x="-20%" y="-25%" width="140%" height="150%">
          <feGaussianBlur stdDeviation="1.4" result="blur"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
        <linearGradient id="nitrousGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#5ce6e1" stop-opacity="0.46"></stop>
          <stop offset="50%" stop-color="#29c5c0" stop-opacity="0.2"></stop>
          <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.46"></stop>
        </linearGradient>
      </defs>


      <!-- Lit nitrous system (Nitrous) -->
      <g filter="url(#nitrousGlow)">
        <!-- Soft outer halo of bottle and line -->
        <g stroke="#29c5c0" stroke-width="2.8" stroke-opacity="0.34">
          <path d="M29.5 38 L39.5 38 Q41 38 41 39.5 L41 58.5 Q41 61.5 37.2 62.5 L31.8 62.5 Q28 61.5 28 58.5 L28 39.5 Q28 38 29.5 38 Z"></path>
          <path d="M34.5 62.5 L34.5 76.2 Q34.5 77.5 35.8 77.5 L76 77.5 C79 77.5 80 75.5 83 75.5 L171 75.5 C174 75.5 175 77.5 178 77.5 L196.5 77.5 Q198 77.5 198 76 L198 54.5"></path>
        </g>

        <!-- Main outline of bottle, regulator and feed tube -->
        <g stroke="#5ce6e1" stroke-width="1.25">
          <!-- Bottle in the rear of the trunk -->
          <path d="M29.5 38 L39.5 38 Q41 38 41 39.5 L41 58.5 Q41 61.5 37.2 62.5 L31.8 62.5 Q28 61.5 28 58.5 L28 39.5 Q28 38 29.5 38 Z" fill="url(#nitrousGrad)"></path>

          <!-- Bottle mounting straps -->
          <line x1="28.3" y1="44.5" x2="40.7" y2="44.5" stroke-width="0.8" stroke-opacity="0.55"></line>
          <line x1="28.3" y1="54.5" x2="40.7" y2="54.5" stroke-width="0.8" stroke-opacity="0.55"></line>

          <!-- Valve and regulator -->
          <rect x="33.1" y="62.5" width="2.8" height="5.5" rx="0.8" fill="url(#nitrousGrad)" stroke-width="1.1"></rect>
          <line x1="32.2" y1="65.2" x2="36.8" y2="65.2" stroke-width="0.95"></line>

          <!-- Line along the left sill to the engine intake -->
          <path d="M34.5 68 L34.5 76.2 Q34.5 77.5 35.8 77.5 L76 77.5 C79 77.5 80 75.5 83 75.5 L171 75.5 C174 75.5 175 77.5 178 77.5 L196.5 77.5 Q198 77.5 198 76 L198 54.5"></path>

          <!-- Injector / solenoid at the engine inlet -->
          <circle cx="198" cy="54.5" r="1.2" fill="#5ce6e1" stroke="none"></circle>
        </g>
      </g>
    </svg>`,
  7: `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <filter id="clutchGlow" x="-60%" y="-25%" width="220%" height="150%">
          <feGaussianBlur stdDeviation="1.4" result="blur"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
        <linearGradient id="clutchGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5ce6e1" stop-opacity="0.48"></stop>
          <stop offset="50%" stop-color="#29c5c0" stop-opacity="0.22"></stop>
          <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.48"></stop>
        </linearGradient>
      </defs>


      <!-- Lit clutch and flywheel (Clutch) -->
      <g filter="url(#clutchGlow)">
        <!-- Soft outer halo -->
        <rect x="181.4" y="38.8" width="5.2" height="22.4" rx="1.8" stroke="#29c5c0" stroke-width="2.6" stroke-opacity="0.34"></rect>

        <!-- Main outline of clutch housing, disc and flywheel -->
        <g stroke="#5ce6e1" stroke-width="1.25">
          <rect x="181.4" y="38.8" width="5.2" height="22.4" rx="1.8" fill="url(#clutchGrad)"></rect>
          <line x1="183.2" y1="39.3" x2="183.2" y2="60.7" stroke-width="0.8" stroke-opacity="0.6"></line>
          <line x1="184.8" y1="39.3" x2="184.8" y2="60.7" stroke-width="0.8" stroke-opacity="0.6"></line>
        </g>
      </g>
    </svg>`,
  8: `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <filter id="gearGlow" x="-20%" y="-25%" width="140%" height="150%">
          <feGaussianBlur stdDeviation="1.4" result="blur"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
        <linearGradient id="gearGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5ce6e1" stop-opacity="0.46"></stop>
          <stop offset="50%" stop-color="#29c5c0" stop-opacity="0.22"></stop>
          <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.46"></stop>
        </linearGradient>
      </defs>


      <!-- Lit gearbox and front driveshaft (Gear kit) -->
      <g filter="url(#gearGlow)">
        <!-- Soft outer halo -->
        <g stroke="#29c5c0" stroke-width="2.6" stroke-opacity="0.34">
          <path d="M185.5 41 L181.5 41 Q178 38.5 174 38.5 Q170.5 38.5 167.5 42.5 L153.5 43.5 L151 45.5 L143.5 46.2 Q140 46.5 137.5 48.5 L134 48.5 L134 51.5 L137.5 51.5 Q140 53.5 143.5 53.8 L151 54.5 L153.5 56.5 L167.5 57.5 Q170.5 61.5 174 61.5 Q178 61.5 181.5 59 L185.5 59 Q186.8 59 186.8 57.5 L186.8 42.5 Q186.8 41 185.5 41 Z"></path>
          <line x1="134" y1="50" x2="115" y2="50" stroke-width="3.2"></line>
        </g>

        <!-- Main outline of gearbox case, tail and shaft -->
        <g stroke="#5ce6e1" stroke-width="1.25">
          <path d="M185.5 41 L181.5 41 Q178 38.5 174 38.5 Q170.5 38.5 167.5 42.5 L153.5 43.5 L151 45.5 L143.5 46.2 Q140 46.5 137.5 48.5 L134 48.5 L134 51.5 L137.5 51.5 Q140 53.5 143.5 53.8 L151 54.5 L153.5 56.5 L167.5 57.5 Q170.5 61.5 174 61.5 Q178 61.5 181.5 59 L185.5 59 Q186.8 59 186.8 57.5 L186.8 42.5 Q186.8 41 185.5 41 Z" fill="url(#gearGrad)"></path>

          <!-- Inner case ribs, gear block and service port -->
          <line x1="181.5" y1="41.4" x2="181.5" y2="58.6" stroke-width="0.85" stroke-opacity="0.6"></line>
          <line x1="173.5" y1="39.2" x2="173.5" y2="60.8" stroke-width="0.85" stroke-opacity="0.55"></line>
          <line x1="166.5" y1="43" x2="166.5" y2="57" stroke-width="0.8" stroke-opacity="0.5"></line>
          <line x1="153.5" y1="44" x2="153.5" y2="56" stroke-width="0.8" stroke-opacity="0.5"></line>
          <line x1="143.5" y1="46.6" x2="143.5" y2="53.4" stroke-width="0.8" stroke-opacity="0.5"></line>
          <circle cx="147.8" cy="48.5" r="0.85" fill="#5ce6e1" stroke="none"></circle>

          <!-- Front driveshaft section to the middle of the tunnel -->
          <rect x="115" y="49.1" width="19" height="1.8" rx="0.9" fill="url(#gearGrad)" stroke-width="1.1"></rect>
        </g>
      </g>
    </svg>`,
  9: `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <filter id="suspGlow" x="-20%" y="-25%" width="140%" height="150%">
          <feGaussianBlur stdDeviation="1.4" result="blur"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
        <linearGradient id="suspGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5ce6e1" stop-opacity="0.46"></stop>
          <stop offset="50%" stop-color="#29c5c0" stop-opacity="0.2"></stop>
          <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.46"></stop>
        </linearGradient>
      </defs>


      <!-- Lit suspension, struts, springs and rear axle (Shocks/Springs) -->
      <g filter="url(#suspGlow)">
        <!-- Soft outer halo -->
        <g stroke="#29c5c0" stroke-width="2.6" stroke-opacity="0.34">
          <path d="M62 17 L68.5 23 L72.5 24.5 L72.5 36.5 L70 41.5 L74 45.5 L74 54.5 L70 58.5 L72.5 63.5 L72.5 75.5 L68.5 77 L62 83 L55.5 77 L50.5 75.5 L52.5 63 L54 50 L52.5 37 L50.5 24.5 L55.5 23 Z"></path>
          <line x1="74" y1="50" x2="115" y2="50" stroke-width="3"></line>
          <path d="M194 17 L202.5 30.5 L185.5 30.5 Z"></path>
          <path d="M194 83 L202.5 69.5 L185.5 69.5 Z"></path>
        </g>

        <!-- Main outline of arms, dampers, subframe and diff -->
        <g stroke="#5ce6e1" stroke-width="1.2">
          <!-- Rear subframe, arms and diff housing with service windows -->
          <path fill-rule="evenodd" d="M62 16.5 Q63.6 16.5 65 19 L68.5 23 L72.5 24.5 L72.5 36.5 L70 41.5 L74 45.5 L74 54.5 L70 58.5 L72.5 63.5 L72.5 75.5 L68.5 77 L65 81 Q63.6 83.5 62 83.5 Q60.4 83.5 59 81 L55.5 77 L50.5 75.5 L52.5 63 L54 50 L52.5 37 L50.5 24.5 L55.5 23 L59 19 Q60.4 16.5 62 16.5 Z M55 27.5 L60.5 27.5 L60.5 40.5 L56.5 41.5 Z M63.5 27.5 L69.5 27.5 L68.5 39.5 L63.5 40.5 Z M55 72.5 L60.5 72.5 L60.5 59.5 L56.5 58.5 Z M63.5 72.5 L69.5 72.5 L68.5 60.5 L63.5 59.5 Z" fill="url(#suspGrad)"></path>

          <!-- Halfshafts, diff and rear spring coils -->
          <line x1="62" y1="19.5" x2="62" y2="44" stroke-width="1.25"></line>
          <line x1="62" y1="56" x2="62" y2="80.5" stroke-width="1.25"></line>
          <ellipse cx="64.5" cy="50" rx="5.5" ry="4.5" stroke-width="0.95" stroke-opacity="0.7"></ellipse>
          <line x1="67" y1="22.8" x2="70.5" y2="22.8" stroke-width="0.85" stroke-opacity="0.7"></line>
          <line x1="67" y1="24.6" x2="70.5" y2="24.6" stroke-width="0.85" stroke-opacity="0.7"></line>
          <line x1="67" y1="75.4" x2="70.5" y2="75.4" stroke-width="0.85" stroke-opacity="0.7"></line>
          <line x1="67" y1="77.2" x2="70.5" y2="77.2" stroke-width="0.85" stroke-opacity="0.7"></line>

          <!-- Rear driveshaft section to the middle of the body -->
          <rect x="74" y="49.1" width="41" height="1.8" rx="0.9" fill="url(#suspGrad)" stroke-width="1.1"></rect>

          <!-- Upper front strut and wishbone -->
          <path fill-rule="evenodd" d="M194 16.5 Q195.8 16.5 197.2 19.5 L203 29.8 Q203.5 31 202 31 L186 31 Q184.5 31 185 29.8 L190.8 19.5 Q192.2 16.5 194 16.5 Z M192.8 23.2 L188.5 28.8 L192.8 28.8 Z M195.2 23.2 L199.5 28.8 L195.2 28.8 Z" fill="url(#suspGrad)"></path>
          <line x1="194" y1="18.5" x2="194" y2="30.5" stroke-width="1.1"></line>
          <line x1="192.6" y1="22.5" x2="195.4" y2="22.5" stroke-width="0.8" stroke-opacity="0.7"></line>
          <line x1="192.6" y1="25" x2="195.4" y2="25" stroke-width="0.8" stroke-opacity="0.7"></line>

          <!-- Lower front strut and wishbone -->
          <path fill-rule="evenodd" d="M194 83.5 Q195.8 83.5 197.2 80.5 L203 70.2 Q203.5 69 202 69 L186 69 Q184.5 69 185 70.2 L190.8 80.5 Q192.2 83.5 194 83.5 Z M192.8 76.8 L188.5 71.2 L192.8 71.2 Z M195.2 76.8 L199.5 71.2 L195.2 71.2 Z" fill="url(#suspGrad)"></path>
          <line x1="194" y1="81.5" x2="194" y2="69.5" stroke-width="1.1"></line>
          <line x1="192.6" y1="77.5" x2="195.4" y2="77.5" stroke-width="0.8" stroke-opacity="0.7"></line>
          <line x1="192.6" y1="75" x2="195.4" y2="75" stroke-width="0.8" stroke-opacity="0.7"></line>
        </g>
      </g>
    </svg>`,
  10: `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <filter id="swayGlow" x="-20%" y="-25%" width="140%" height="150%">
          <feGaussianBlur stdDeviation="1.4" result="blur"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
        <linearGradient id="swayGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#5ce6e1" stop-opacity="0.5"></stop>
          <stop offset="50%" stop-color="#29c5c0" stop-opacity="0.24"></stop>
          <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.5"></stop>
        </linearGradient>
      </defs>


      <!-- Lit swaybars (Swaybars) -->
      <g filter="url(#swayGlow)">
        <!-- Soft outer halo -->
        <g stroke="#29c5c0" stroke-width="3.2" stroke-opacity="0.34">
          <path d="M55 20 C55.8 23.5 57.4 25.5 57.4 29 C57.4 33 55.6 38 55.6 50 C55.6 62 57.4 67 57.4 71 C57.4 74.5 55.8 76.5 55 80"></path>
          <path d="M192.5 19.5 C193 23 194.5 25.5 194.2 29.5 C193.9 33.5 193.2 38 193.2 50 C193.2 58 193.4 61.5 194.8 64.5 C196.2 67.5 196.2 70.5 194.8 74 C193.8 76.5 193.5 78.5 193.5 80.5"></path>
        </g>

        <!-- Main torsion bars, bushings and swaybar links -->
        <g stroke="#5ce6e1">
          <!-- Rear swaybar -->
          <path d="M55 20 C55.8 23.5 57.4 25.5 57.4 29 C57.4 33 55.6 38 55.6 50 C55.6 62 57.4 67 57.4 71 C57.4 74.5 55.8 76.5 55 80" stroke-width="1.65"></path>
          <path d="M55 20 C55.8 23.5 57.4 25.5 57.4 29 C57.4 33 55.6 38 55.6 50 C55.6 62 57.4 67 57.4 71 C57.4 74.5 55.8 76.5 55 80" stroke="#9ef7f4" stroke-width="0.55" stroke-opacity="0.65"></path>
          <rect x="54.5" y="34.5" width="2.4" height="3.2" rx="0.8" fill="url(#swayGrad)" stroke-width="0.95"></rect>
          <rect x="54.5" y="62.3" width="2.4" height="3.2" rx="0.8" fill="url(#swayGrad)" stroke-width="0.95"></rect>
          <circle cx="55" cy="20" r="1.15" fill="#5ce6e1" stroke="none"></circle>
          <circle cx="55" cy="80" r="1.15" fill="#5ce6e1" stroke="none"></circle>

          <!-- Front swaybar -->
          <path d="M192.5 19.5 C193 23 194.5 25.5 194.2 29.5 C193.9 33.5 193.2 38 193.2 50 C193.2 58 193.4 61.5 194.8 64.5 C196.2 67.5 196.2 70.5 194.8 74 C193.8 76.5 193.5 78.5 193.5 80.5" stroke-width="1.65"></path>
          <path d="M192.5 19.5 C193 23 194.5 25.5 194.2 29.5 C193.9 33.5 193.2 38 193.2 50 C193.2 58 193.4 61.5 194.8 64.5 C196.2 67.5 196.2 70.5 194.8 74 C193.8 76.5 193.5 78.5 193.5 80.5" stroke="#9ef7f4" stroke-width="0.55" stroke-opacity="0.65"></path>
          <rect x="192" y="34.5" width="2.4" height="3.2" rx="0.8" fill="url(#swayGrad)" stroke-width="0.95"></rect>
          <rect x="192.2" y="59.5" width="2.4" height="3.2" rx="0.8" fill="url(#swayGrad)" stroke-width="0.95"></rect>
          <circle cx="192.5" cy="19.5" r="1.15" fill="#5ce6e1" stroke="none"></circle>
          <circle cx="193.5" cy="80.5" r="1.15" fill="#5ce6e1" stroke="none"></circle>
        </g>
      </g>
    </svg>`,
  11: `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <filter id="brakesGlow" x="-20%" y="-25%" width="140%" height="150%">
          <feGaussianBlur stdDeviation="1.4" result="blur"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
        <linearGradient id="brakesGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#5ce6e1" stop-opacity="0.5"></stop>
          <stop offset="45%" stop-color="#29c5c0" stop-opacity="0.24"></stop>
          <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.46"></stop>
        </linearGradient>
      </defs>


      <!-- Lit brake discs and calipers (Brakes) -->
      <g filter="url(#brakesGlow)">
        <!-- Soft outer halo -->
        <g stroke="#29c5c0" stroke-width="2.4" stroke-opacity="0.34">
          <path d="M50.5 16.2 Q50.5 15.3 51.5 15.3 L57.5 15.3 Q58.3 15.3 58.6 16.3 L72 16.3 Q73 16.3 73 17.5 Q73 18.7 72 18.7 L58.6 18.7 Q58.3 20.3 57.2 20.3 L51.5 20.3 Q50.5 20.3 50.5 19.3 Z"></path>
          <path d="M50.5 83.8 Q50.5 84.7 51.5 84.7 L57.5 84.7 Q58.3 84.7 58.6 83.7 L72 83.7 Q73 83.7 73 82.5 Q73 81.3 72 81.3 L58.6 81.3 Q58.3 79.7 57.2 79.7 L51.5 79.7 Q50.5 79.7 50.5 80.7 Z"></path>
          <path d="M182.5 16.2 Q182.5 15.3 183.5 15.3 L189.5 15.3 Q190.3 15.3 190.6 16.3 L204 16.3 Q205 16.3 205 17.5 Q205 18.7 204 18.7 L190.6 18.7 Q190.3 20.3 189.2 20.3 L183.5 20.3 Q182.5 20.3 182.5 19.3 Z"></path>
          <path d="M182.5 83.8 Q182.5 84.7 183.5 84.7 L189.5 84.7 Q190.3 84.7 190.6 83.7 L204 83.7 Q205 83.7 205 82.5 Q205 81.3 204 81.3 L190.6 81.3 Q190.3 79.7 189.2 79.7 L183.5 79.7 Q182.5 79.7 182.5 80.7 Z"></path>
        </g>

        <!-- Main outlines of discs and multi-piston calipers -->
        <g stroke="#5ce6e1" stroke-width="1.15">
          <!-- Rear right (upper) -->
          <path d="M50.5 16.2 Q50.5 15.3 51.5 15.3 L57.5 15.3 Q58.3 15.3 58.6 16.3 L72 16.3 Q73 16.3 73 17.5 Q73 18.7 72 18.7 L58.6 18.7 Q58.3 20.3 57.2 20.3 L51.5 20.3 Q50.5 20.3 50.5 19.3 Z" fill="url(#brakesGrad)"></path>
          <line x1="58.2" y1="15.8" x2="58.2" y2="19.6" stroke-width="0.85" stroke-opacity="0.7"></line>
          <line x1="53.5" y1="16.2" x2="53.5" y2="19.4" stroke-width="0.7" stroke-opacity="0.55"></line>
          <line x1="55.8" y1="16.2" x2="55.8" y2="19.4" stroke-width="0.7" stroke-opacity="0.55"></line>
          <line x1="59.2" y1="17.5" x2="71.5" y2="17.5" stroke-width="0.7" stroke-opacity="0.6"></line>

          <!-- Rear left (lower) -->
          <path d="M50.5 83.8 Q50.5 84.7 51.5 84.7 L57.5 84.7 Q58.3 84.7 58.6 83.7 L72 83.7 Q73 83.7 73 82.5 Q73 81.3 72 81.3 L58.6 81.3 Q58.3 79.7 57.2 79.7 L51.5 79.7 Q50.5 79.7 50.5 80.7 Z" fill="url(#brakesGrad)"></path>
          <line x1="58.2" y1="80.4" x2="58.2" y2="84.2" stroke-width="0.85" stroke-opacity="0.7"></line>
          <line x1="53.5" y1="80.6" x2="53.5" y2="83.8" stroke-width="0.7" stroke-opacity="0.55"></line>
          <line x1="55.8" y1="80.6" x2="55.8" y2="83.8" stroke-width="0.7" stroke-opacity="0.55"></line>
          <line x1="59.2" y1="82.5" x2="71.5" y2="82.5" stroke-width="0.7" stroke-opacity="0.6"></line>

          <!-- Front right (upper) -->
          <path d="M182.5 16.2 Q182.5 15.3 183.5 15.3 L189.5 15.3 Q190.3 15.3 190.6 16.3 L204 16.3 Q205 16.3 205 17.5 Q205 18.7 204 18.7 L190.6 18.7 Q190.3 20.3 189.2 20.3 L183.5 20.3 Q182.5 20.3 182.5 19.3 Z" fill="url(#brakesGrad)"></path>
          <line x1="190.2" y1="15.8" x2="190.2" y2="19.6" stroke-width="0.85" stroke-opacity="0.7"></line>
          <line x1="185.5" y1="16.2" x2="185.5" y2="19.4" stroke-width="0.7" stroke-opacity="0.55"></line>
          <line x1="187.8" y1="16.2" x2="187.8" y2="19.4" stroke-width="0.7" stroke-opacity="0.55"></line>
          <line x1="191.2" y1="17.5" x2="203.5" y2="17.5" stroke-width="0.7" stroke-opacity="0.6"></line>

          <!-- Front left (lower) -->
          <path d="M182.5 83.8 Q182.5 84.7 183.5 84.7 L189.5 84.7 Q190.3 84.7 190.6 83.7 L204 83.7 Q205 83.7 205 82.5 Q205 81.3 204 81.3 L190.6 81.3 Q190.3 79.7 189.2 79.7 L183.5 79.7 Q182.5 79.7 182.5 80.7 Z" fill="url(#brakesGrad)"></path>
          <line x1="190.2" y1="80.4" x2="190.2" y2="84.2" stroke-width="0.85" stroke-opacity="0.7"></line>
          <line x1="185.5" y1="80.6" x2="185.5" y2="83.8" stroke-width="0.7" stroke-opacity="0.55"></line>
          <line x1="187.8" y1="80.6" x2="187.8" y2="83.8" stroke-width="0.7" stroke-opacity="0.55"></line>
          <line x1="191.2" y1="82.5" x2="203.5" y2="82.5" stroke-width="0.7" stroke-opacity="0.6"></line>
        </g>
      </g>
    </svg>`,
  12: `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <filter id="tiresGlow" x="-20%" y="-25%" width="140%" height="150%">
          <feGaussianBlur stdDeviation="1.4" result="blur"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
        <linearGradient id="tiresGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5ce6e1" stop-opacity="0.54"></stop>
          <stop offset="50%" stop-color="#29c5c0" stop-opacity="0.34"></stop>
          <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.54"></stop>
        </linearGradient>
      </defs>


      <!-- Lit tires (Tires) -->
      <g filter="url(#tiresGlow)">
        <!-- Soft outer halo -->
        <g stroke="#29c5c0" stroke-width="2.4" stroke-opacity="0.34">
          <rect x="44" y="13" width="36" height="9" rx="3"></rect>
          <rect x="44" y="78" width="36" height="9" rx="3"></rect>
          <rect x="176" y="13" width="36" height="9" rx="3"></rect>
          <rect x="176" y="78" width="36" height="9" rx="3"></rect>
        </g>

        <!-- Main outlines of tires, tread and see-through rims -->
        <g stroke="#5ce6e1" stroke-width="1.2">
          <!-- Rear right (upper) -->
          <rect x="44" y="13" width="36" height="9" rx="3" fill="url(#tiresGrad)"></rect>
          <line x1="46.5" y1="15.2" x2="77.5" y2="15.2" stroke-width="0.65" stroke-opacity="0.45"></line>
          <line x1="46" y1="17.5" x2="78" y2="17.5" stroke-width="0.65" stroke-opacity="0.45"></line>
          <line x1="46.5" y1="19.8" x2="77.5" y2="19.8" stroke-width="0.65" stroke-opacity="0.45"></line>
          <rect x="49" y="15.5" width="26" height="4" rx="1.5" stroke-width="0.75" stroke-opacity="0.35"></rect>

          <!-- Rear left (lower) -->
          <rect x="44" y="78" width="36" height="9" rx="3" fill="url(#tiresGrad)"></rect>
          <line x1="46.5" y1="80.2" x2="77.5" y2="80.2" stroke-width="0.65" stroke-opacity="0.45"></line>
          <line x1="46" y1="82.5" x2="78" y2="82.5" stroke-width="0.65" stroke-opacity="0.45"></line>
          <line x1="46.5" y1="84.8" x2="77.5" y2="84.8" stroke-width="0.65" stroke-opacity="0.45"></line>
          <rect x="49" y="80.5" width="26" height="4" rx="1.5" stroke-width="0.75" stroke-opacity="0.35"></rect>

          <!-- Front right (upper) -->
          <rect x="176" y="13" width="36" height="9" rx="3" fill="url(#tiresGrad)"></rect>
          <line x1="178.5" y1="15.2" x2="209.5" y2="15.2" stroke-width="0.65" stroke-opacity="0.45"></line>
          <line x1="178" y1="17.5" x2="210" y2="17.5" stroke-width="0.65" stroke-opacity="0.45"></line>
          <line x1="178.5" y1="19.8" x2="209.5" y2="19.8" stroke-width="0.65" stroke-opacity="0.45"></line>
          <rect x="181" y="15.5" width="26" height="4" rx="1.5" stroke-width="0.75" stroke-opacity="0.35"></rect>

          <!-- Front left (lower) -->
          <rect x="176" y="78" width="36" height="9" rx="3" fill="url(#tiresGrad)"></rect>
          <line x1="178.5" y1="80.2" x2="209.5" y2="80.2" stroke-width="0.65" stroke-opacity="0.45"></line>
          <line x1="178" y1="82.5" x2="210" y2="82.5" stroke-width="0.65" stroke-opacity="0.45"></line>
          <line x1="178.5" y1="84.8" x2="209.5" y2="84.8" stroke-width="0.65" stroke-opacity="0.45"></line>
          <rect x="181" y="80.5" width="26" height="4" rx="1.5" stroke-width="0.75" stroke-opacity="0.35"></rect>
        </g>
      </g>
    </svg>`,


};


/* Motorcycle schematics, keyed by TUNE_CATS index like the car ones but
   kept apart: a bike has six categories and its own base drawing. */
var MOTO_SCHEMATICS = {
  0: `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <defs>
          <filter id="motoExhaustGlow" x="-20%" y="-25%" width="140%" height="150%">
            <feGaussianBlur stdDeviation="1.5" result="blur"></feGaussianBlur>
            <feMerge>
              <feMergeNode in="blur"></feMergeNode>
              <feMergeNode in="SourceGraphic"></feMergeNode>
            </feMerge>
          </filter>
          <linearGradient id="motoMufflerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#5ce6e1" stop-opacity="0.48"></stop>
            <stop offset="50%" stop-color="#29c5c0" stop-opacity="0.2"></stop>
            <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.48"></stop>
          </linearGradient>
        </defs>

        <g filter="url(#motoExhaustGlow)">
          <!-- Far-side secondary muffler peeking above primary canister -->
          <g stroke="#5ce6e1" stroke-width="1.15" stroke-opacity="0.65">
            <path d="M94.5 62.9 L88.3 60.4 L63.8 50.6 Q61.3 49.8 60.5 51.9 Q59.8 53.9 62.2 55 L86.6 64.7 Z" fill="url(#motoMufflerGrad)"></path>
          </g>

          <!-- Outer soft glow for headers, collector & primary muffler -->
          <g stroke="#29c5c0" stroke-width="3.1" stroke-opacity="0.35">
            <path d="M158.4 49.3 C164.7 50.4 166.9 57.2 166.9 68.6 C166.9 77.2 165.2 80.6 159.5 81.2 L118.5 81.8"></path>
            <path d="M161.2 51.5 C168.1 52.7 170.4 59.5 170.4 70.9 C170.4 79.5 168.1 83.5 161.2 84 L117.3 84.6 L90 66.9"></path>
            <path d="M90 66.9 L85.4 60.9 L47.2 46.1 Q42.8 46.5 42.3 49 Q41.9 51.8 44.2 53.9 L82.3 68.8 Z"></path>
          </g>

          <!-- Inner bright core: twin downpipes, collector & angled slip-on canister -->
          <g stroke="#5ce6e1" stroke-width="1.35">
            <!-- Inner header pipe -->
            <path d="M158.4 49.3 C164.7 50.4 166.9 57.2 166.9 68.6 C166.9 77.2 165.2 80.6 159.5 81.2 L118.5 81.8"></path>
            <!-- Outer header pipe & mid-pipe collector -->
            <path d="M161.2 51.5 C168.1 52.7 170.4 59.5 170.4 70.9 C170.4 79.5 168.1 83.5 161.2 84 L117.3 84.6 L90 66.9"></path>
            <!-- Collector clamp -->
            <line x1="117.9" y1="80.7" x2="117.1" y2="85.5" stroke-width="1.2" stroke-opacity="0.75"></line>

            <!-- Primary angled muffler canister -->
            <path d="M90 66.9 L85.4 60.9 L47.2 46.1 Q42.8 46.5 42.3 49 Q41.9 51.8 44.2 53.9 L82.3 68.8 Z" fill="url(#motoMufflerGrad)"></path>
            <!-- End-cap seam & mounting band -->
            <line x1="48" y1="46.5" x2="45.1" y2="54.2" stroke-width="0.9" stroke-opacity="0.65"></line>
            <line x1="67" y1="53.8" x2="64" y2="61.6" stroke-width="0.95" stroke-opacity="0.65"></line>
            <line x1="84.7" y1="61.2" x2="81.9" y2="68.5" stroke-width="0.9" stroke-opacity="0.6"></line>
          </g>
        </g>
      </svg>`,
  4: `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <filter id="motoEngineGlow" x="-20%" y="-25%" width="140%" height="150%">
          <feGaussianBlur stdDeviation="1.4" result="blur"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
        <linearGradient id="motoEngineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5ce6e1" stop-opacity="0.46"></stop>
          <stop offset="50%" stop-color="#29c5c0" stop-opacity="0.22"></stop>
          <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.46"></stop>
        </linearGradient>
        <linearGradient id="motoClutchHousingGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#29c5c0" stop-opacity="0.45"></stop>
          <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.32"></stop>
        </linearGradient>
      </defs>

      <g filter="url(#motoEngineGlow)">
        <!-- Soft outer halo of powertrain, radiator and chain drive -->
        <g stroke="#29c5c0" stroke-width="2.6" stroke-opacity="0.32">
          <path d="M144.8 33.8 L156.8 32.5 L161.6 36.5 L166.8 42.2 L177.8 39.6 L179.2 41.2 L173.2 63.8 L167.4 62.4 L169.2 54.2 L157.5 56 L160.8 68.6 L153.8 75.5 L125.3 75.5 L120.8 67.5 L121.9 53.3 L139 53.3 Z"></path>
          <path d="M166.2 41.8 L117.4 43.8 L115.2 48.6 L101.2 56.4"></path>
          <circle cx="80.9" cy="74.3" r="7.4"></circle>
          <line x1="120.8" y1="66.2" x2="80.9" y2="66.9"></line>
          <line x1="121.5" y1="71.4" x2="80.9" y2="81.7"></line>
        </g>

        <!-- Main outline of engine, cases, radiator and final drive -->
        <g stroke="#5ce6e1" stroke-width="1.2">
          <!-- Upper feed line / control cables under the tank -->
          <path d="M166.2 41.8 L117.4 43.8 L115.2 48.6 L101.2 56.4" stroke-width="1.25"></path>

          <!-- Head cover and canted cylinder block -->
          <path d="M144.8 33.8 L156.8 32.5 L161.6 36.5 L159.6 39.2 L143.4 37.6 Z" fill="url(#motoEngineGrad)"></path>
          <path d="M143.4 37.6 L159.6 39.2 L166.8 42.4 L156.4 56 L139 53.3 Z" fill="url(#motoEngineGrad)"></path>
          <line x1="141.9" y1="42" x2="163" y2="45.4" stroke-width="0.85" stroke-opacity="0.65"></line>
          <line x1="140.7" y1="47.1" x2="160.2" y2="50.2" stroke-width="0.85" stroke-opacity="0.65"></line>

          <!-- Engine cases and sump lip -->
          <path d="M121.9 53.3 L157.2 55.5 L160.8 68.6 L153.8 75.5 L125.3 75.5 L120.8 67.5 Z" fill="url(#motoEngineGrad)"></path>

          <!-- Left recess for clutch and drive sprocket -->
          <path d="M121.9 53.3 L139 53.3 L142.4 64.5 L137.4 75.5 L125.3 75.5 L120.8 67.5 Z" fill="url(#motoClutchHousingGrad)" stroke-width="0.95" stroke-opacity="0.8"></path>

          <!-- Case and generator covers -->
          <circle cx="134.4" cy="65.8" r="7.3" stroke-width="1.05" stroke-opacity="0.85"></circle>
          <circle cx="134.4" cy="65.8" r="2.2" stroke-width="0.8" stroke-opacity="0.65"></circle>
          <circle cx="149.8" cy="65.8" r="5.4" stroke-width="1.05" stroke-opacity="0.85"></circle>

          <!-- Cooling radiator and side deflector -->
          <path d="M167.2 42.2 L177.8 39.6 L179.2 41.2 L173.2 63.8 L167.4 62.4 L169.2 54.2 L162.8 53.2 Z" fill="url(#motoEngineGrad)"></path>
          <line x1="173.8" y1="40.6" x2="169.4" y2="62.8" stroke-width="0.8" stroke-opacity="0.65"></line>
          <line x1="171.2" y1="45.5" x2="177.6" y2="46.8" stroke-width="0.7" stroke-opacity="0.5"></line>
          <line x1="169.8" y1="51.2" x2="176.2" y2="52.5" stroke-width="0.7" stroke-opacity="0.5"></line>
          <line x1="168.4" y1="56.8" x2="174.8" y2="58.1" stroke-width="0.7" stroke-opacity="0.5"></line>

          <!-- Drive chain and driven sprocket at the rear wheel -->
          <line x1="120.8" y1="66.2" x2="80.9" y2="66.9" stroke-width="1.2"></line>
          <line x1="121.5" y1="71.4" x2="80.9" y2="81.7" stroke-width="1.2"></line>
          <circle cx="80.9" cy="74.3" r="7.4" fill="url(#motoEngineGrad)" stroke-width="1.15"></circle>
          <circle cx="80.9" cy="74.3" r="3.9" stroke-width="0.85" stroke-opacity="0.75"></circle>
        </g>
      </g>
    </svg>`,
  5: `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <filter id="motoEngineGlow" x="-20%" y="-25%" width="140%" height="150%">
          <feGaussianBlur stdDeviation="1.4" result="blur"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
        <linearGradient id="motoEngineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5ce6e1" stop-opacity="0.46"></stop>
          <stop offset="50%" stop-color="#29c5c0" stop-opacity="0.22"></stop>
          <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.46"></stop>
        </linearGradient>
        <linearGradient id="motoClutchHousingGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#29c5c0" stop-opacity="0.45"></stop>
          <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.32"></stop>
        </linearGradient>
      </defs>

      <g filter="url(#motoEngineGlow)">
        <!-- Soft outer halo of powertrain, radiator and chain drive -->
        <g stroke="#29c5c0" stroke-width="2.6" stroke-opacity="0.32">
          <path d="M144.8 33.8 L156.8 32.5 L161.6 36.5 L166.8 42.2 L177.8 39.6 L179.2 41.2 L173.2 63.8 L167.4 62.4 L169.2 54.2 L157.5 56 L160.8 68.6 L153.8 75.5 L125.3 75.5 L120.8 67.5 L121.9 53.3 L139 53.3 Z"></path>
          <path d="M166.2 41.8 L117.4 43.8 L115.2 48.6 L101.2 56.4"></path>
          <circle cx="80.9" cy="74.3" r="7.4"></circle>
          <line x1="120.8" y1="66.2" x2="80.9" y2="66.9"></line>
          <line x1="121.5" y1="71.4" x2="80.9" y2="81.7"></line>
        </g>

        <!-- Main outline of engine, cases, radiator and final drive -->
        <g stroke="#5ce6e1" stroke-width="1.2">
          <!-- Upper feed line / control cables under the tank -->
          <path d="M166.2 41.8 L117.4 43.8 L115.2 48.6 L101.2 56.4" stroke-width="1.25"></path>

          <!-- Head cover and canted cylinder block -->
          <path d="M144.8 33.8 L156.8 32.5 L161.6 36.5 L159.6 39.2 L143.4 37.6 Z" fill="url(#motoEngineGrad)"></path>
          <path d="M143.4 37.6 L159.6 39.2 L166.8 42.4 L156.4 56 L139 53.3 Z" fill="url(#motoEngineGrad)"></path>
          <line x1="141.9" y1="42" x2="163" y2="45.4" stroke-width="0.85" stroke-opacity="0.65"></line>
          <line x1="140.7" y1="47.1" x2="160.2" y2="50.2" stroke-width="0.85" stroke-opacity="0.65"></line>

          <!-- Engine cases and sump lip -->
          <path d="M121.9 53.3 L157.2 55.5 L160.8 68.6 L153.8 75.5 L125.3 75.5 L120.8 67.5 Z" fill="url(#motoEngineGrad)"></path>

          <!-- Left recess for clutch and drive sprocket -->
          <path d="M121.9 53.3 L139 53.3 L142.4 64.5 L137.4 75.5 L125.3 75.5 L120.8 67.5 Z" fill="url(#motoClutchHousingGrad)" stroke-width="0.95" stroke-opacity="0.8"></path>

          <!-- Case and generator covers -->
          <circle cx="134.4" cy="65.8" r="7.3" stroke-width="1.05" stroke-opacity="0.85"></circle>
          <circle cx="134.4" cy="65.8" r="2.2" stroke-width="0.8" stroke-opacity="0.65"></circle>
          <circle cx="149.8" cy="65.8" r="5.4" stroke-width="1.05" stroke-opacity="0.85"></circle>

          <!-- Cooling radiator and side deflector -->
          <path d="M167.2 42.2 L177.8 39.6 L179.2 41.2 L173.2 63.8 L167.4 62.4 L169.2 54.2 L162.8 53.2 Z" fill="url(#motoEngineGrad)"></path>
          <line x1="173.8" y1="40.6" x2="169.4" y2="62.8" stroke-width="0.8" stroke-opacity="0.65"></line>
          <line x1="171.2" y1="45.5" x2="177.6" y2="46.8" stroke-width="0.7" stroke-opacity="0.5"></line>
          <line x1="169.8" y1="51.2" x2="176.2" y2="52.5" stroke-width="0.7" stroke-opacity="0.5"></line>
          <line x1="168.4" y1="56.8" x2="174.8" y2="58.1" stroke-width="0.7" stroke-opacity="0.5"></line>

          <!-- Drive chain and driven sprocket at the rear wheel -->
          <line x1="120.8" y1="66.2" x2="80.9" y2="66.9" stroke-width="1.2"></line>
          <line x1="121.5" y1="71.4" x2="80.9" y2="81.7" stroke-width="1.2"></line>
          <circle cx="80.9" cy="74.3" r="7.4" fill="url(#motoEngineGrad)" stroke-width="1.15"></circle>
          <circle cx="80.9" cy="74.3" r="3.9" stroke-width="0.85" stroke-opacity="0.75"></circle>
        </g>
      </g>
    </svg>`,
  8: `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <filter id="motoEngineGlow" x="-20%" y="-25%" width="140%" height="150%">
          <feGaussianBlur stdDeviation="1.4" result="blur"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
        <linearGradient id="motoEngineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5ce6e1" stop-opacity="0.46"></stop>
          <stop offset="50%" stop-color="#29c5c0" stop-opacity="0.22"></stop>
          <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.46"></stop>
        </linearGradient>
        <linearGradient id="motoClutchHousingGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#29c5c0" stop-opacity="0.45"></stop>
          <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.32"></stop>
        </linearGradient>
      </defs>

      <g filter="url(#motoEngineGlow)">
        <!-- Soft outer halo of powertrain, radiator and chain drive -->
        <g stroke="#29c5c0" stroke-width="2.6" stroke-opacity="0.32">
          <path d="M144.8 33.8 L156.8 32.5 L161.6 36.5 L166.8 42.2 L177.8 39.6 L179.2 41.2 L173.2 63.8 L167.4 62.4 L169.2 54.2 L157.5 56 L160.8 68.6 L153.8 75.5 L125.3 75.5 L120.8 67.5 L121.9 53.3 L139 53.3 Z"></path>
          <path d="M166.2 41.8 L117.4 43.8 L115.2 48.6 L101.2 56.4"></path>
          <circle cx="80.9" cy="74.3" r="7.4"></circle>
          <line x1="120.8" y1="66.2" x2="80.9" y2="66.9"></line>
          <line x1="121.5" y1="71.4" x2="80.9" y2="81.7"></line>
        </g>

        <!-- Main outline of engine, cases, radiator and final drive -->
        <g stroke="#5ce6e1" stroke-width="1.2">
          <!-- Upper feed line / control cables under the tank -->
          <path d="M166.2 41.8 L117.4 43.8 L115.2 48.6 L101.2 56.4" stroke-width="1.25"></path>

          <!-- Head cover and canted cylinder block -->
          <path d="M144.8 33.8 L156.8 32.5 L161.6 36.5 L159.6 39.2 L143.4 37.6 Z" fill="url(#motoEngineGrad)"></path>
          <path d="M143.4 37.6 L159.6 39.2 L166.8 42.4 L156.4 56 L139 53.3 Z" fill="url(#motoEngineGrad)"></path>
          <line x1="141.9" y1="42" x2="163" y2="45.4" stroke-width="0.85" stroke-opacity="0.65"></line>
          <line x1="140.7" y1="47.1" x2="160.2" y2="50.2" stroke-width="0.85" stroke-opacity="0.65"></line>

          <!-- Engine cases and sump lip -->
          <path d="M121.9 53.3 L157.2 55.5 L160.8 68.6 L153.8 75.5 L125.3 75.5 L120.8 67.5 Z" fill="url(#motoEngineGrad)"></path>

          <!-- Left recess for clutch and drive sprocket -->
          <path d="M121.9 53.3 L139 53.3 L142.4 64.5 L137.4 75.5 L125.3 75.5 L120.8 67.5 Z" fill="url(#motoClutchHousingGrad)" stroke-width="0.95" stroke-opacity="0.8"></path>

          <!-- Case and generator covers -->
          <circle cx="134.4" cy="65.8" r="7.3" stroke-width="1.05" stroke-opacity="0.85"></circle>
          <circle cx="134.4" cy="65.8" r="2.2" stroke-width="0.8" stroke-opacity="0.65"></circle>
          <circle cx="149.8" cy="65.8" r="5.4" stroke-width="1.05" stroke-opacity="0.85"></circle>

          <!-- Cooling radiator and side deflector -->
          <path d="M167.2 42.2 L177.8 39.6 L179.2 41.2 L173.2 63.8 L167.4 62.4 L169.2 54.2 L162.8 53.2 Z" fill="url(#motoEngineGrad)"></path>
          <line x1="173.8" y1="40.6" x2="169.4" y2="62.8" stroke-width="0.8" stroke-opacity="0.65"></line>
          <line x1="171.2" y1="45.5" x2="177.6" y2="46.8" stroke-width="0.7" stroke-opacity="0.5"></line>
          <line x1="169.8" y1="51.2" x2="176.2" y2="52.5" stroke-width="0.7" stroke-opacity="0.5"></line>
          <line x1="168.4" y1="56.8" x2="174.8" y2="58.1" stroke-width="0.7" stroke-opacity="0.5"></line>

          <!-- Drive chain and driven sprocket at the rear wheel -->
          <line x1="120.8" y1="66.2" x2="80.9" y2="66.9" stroke-width="1.2"></line>
          <line x1="121.5" y1="71.4" x2="80.9" y2="81.7" stroke-width="1.2"></line>
          <circle cx="80.9" cy="74.3" r="7.4" fill="url(#motoEngineGrad)" stroke-width="1.15"></circle>
          <circle cx="80.9" cy="74.3" r="3.9" stroke-width="0.85" stroke-opacity="0.75"></circle>
        </g>
      </g>
    </svg>`,
  6: `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <filter id="motoNitrousGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="blur"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
        <linearGradient id="motoNitrousGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5ce6e1" stop-opacity="0.5"></stop>
          <stop offset="50%" stop-color="#29c5c0" stop-opacity="0.22"></stop>
          <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.5"></stop>
        </linearGradient>
      </defs>

      <g filter="url(#motoNitrousGlow)" transform="rotate(23 81.5 42.6)">
        <g stroke="#29c5c0" stroke-width="2.8" stroke-opacity="0.35">
          <path d="M81.5 43.2 Q81.5 42.4 82.4 42.4 L92.8 42.4 Q95.6 42.4 96.2 44.6 L96.2 45.6 Q95.6 47.8 92.8 47.8 L82.4 47.8 Q81.5 47.8 81.5 47 Z"></path>
          <path d="M96.2 45.1 L101.2 45.1 Q103.2 45.1 104.8 47.4"></path>
        </g>

        <g stroke="#5ce6e1" stroke-width="1.25">
          <path d="M81.5 43.2 Q81.5 42.4 82.4 42.4 L92.8 42.4 Q95.6 42.4 96.2 44.6 L96.2 45.6 Q95.6 47.8 92.8 47.8 L82.4 47.8 Q81.5 47.8 81.5 47 Z" fill="url(#motoNitrousGrad)"></path>
          <line x1="85.2" y1="42.6" x2="85.2" y2="47.6" stroke-width="0.85" stroke-opacity="0.65"></line>
          <line x1="91.2" y1="42.6" x2="91.2" y2="47.6" stroke-width="0.85" stroke-opacity="0.65"></line>
          <rect x="96.2" y="44.3" width="2.1" height="1.6" rx="0.6" fill="url(#motoNitrousGrad)" stroke-width="1.05"></rect>
          <path d="M98.3 45.1 L101.2 45.1 Q103.2 45.1 104.8 47.4" stroke-width="1.15"></path>
        </g>
      </g>
    </svg>`,
  12: `<svg viewBox="0 0 260 100" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <filter id="motoTiresGlow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="1.4" result="blur"></feGaussianBlur>
          <feMerge>
            <feMergeNode in="blur"></feMergeNode>
            <feMergeNode in="SourceGraphic"></feMergeNode>
          </feMerge>
        </filter>
        <linearGradient id="motoTiresGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#5ce6e1" stop-opacity="0.54"></stop>
          <stop offset="50%" stop-color="#29c5c0" stop-opacity="0.22"></stop>
          <stop offset="100%" stop-color="#5ce6e1" stop-opacity="0.54"></stop>
        </linearGradient>
      </defs>


      <!-- Lit tires (Tires) -->
      <g filter="url(#motoTiresGlow)">
        <!-- Soft outer halo for rear and front tire -->
        <g stroke="#29c5c0" stroke-width="2.6" stroke-opacity="0.34">
          <circle cx="80.9" cy="74.3" r="23.4"></circle>
          <circle cx="194.9" cy="74.9" r="22.8"></circle>
        </g>

        <!-- Main outlines, gradients and tread -->
        <g stroke="#5ce6e1">
          <!-- Rear wheel -->
          <path d="M80.9 50.9 A23.4 23.4 0 1 0 80.9 97.7 A23.4 23.4 0 1 0 80.9 50.9 M80.9 57 A17.3 17.3 0 1 1 80.9 91.6 A17.3 17.3 0 1 1 80.9 57 Z" fill="url(#motoTiresGrad)" stroke-width="1.2" fill-rule="evenodd"></path>
          <!-- Tread grooves -->
          <circle cx="80.9" cy="74.3" r="21.4" stroke-opacity="0.45" stroke-dasharray="1 3.2" stroke-width="0.95"></circle>
          <circle cx="80.9" cy="74.3" r="19.4" stroke-opacity="0.35" stroke-dasharray="1 4" stroke-width="0.85"></circle>
          <!-- Inner rim outline -->
          <circle cx="80.9" cy="74.3" r="17.3" stroke-width="1.1"></circle>

          <!-- Front wheel -->
          <path d="M194.9 52.1 A22.8 22.8 0 1 0 194.9 97.7 A22.8 22.8 0 1 0 194.9 52.1 M194.9 58 A16.9 16.9 0 1 1 194.9 91.8 A16.9 16.9 0 1 1 194.9 58 Z" fill="url(#motoTiresGrad)" stroke-width="1.2" fill-rule="evenodd"></path>
          <!-- Tread grooves -->
          <circle cx="194.9" cy="74.9" r="20.8" stroke-opacity="0.45" stroke-dasharray="1 3.2" stroke-width="0.95"></circle>
          <circle cx="194.9" cy="74.9" r="18.9" stroke-opacity="0.35" stroke-dasharray="1 4" stroke-width="0.85"></circle>
          <!-- Inner rim outline -->
          <circle cx="194.9" cy="74.9" r="16.9" stroke-width="1.1"></circle>
        </g>
      </g>
    </svg>`,


};

/* The base layer for a vehicle: the detailed car body, or the bike frame. */
function xrayBase(moto) { return moto ? XRAY_BASE_MOTO : XRAY_BASE_CAR; }

/* One category's drawing, lit or dimmed. Every part is always on screen:
   the active one pulses in cyan, the rest sit back in grey, so switching
   categories never makes anything appear or vanish. */
function xrayPart(catIdx, moto, lit) {
  var s = (moto ? MOTO_SCHEMATICS[catIdx] : SCHEMATICS[catIdx]);
  if (!s) return "";
  return s.replace("<svg ", '<svg class="xray-layer ' + (lit ? "xray-active" : "xray-dim") + '" ');
}

/* Paint the stack: base, then every part the vehicle has, lit one last so it
   sits on top. */
const CAR_CAT_IDX = TUNE_CATS.map((_, i) => i);

function paintXray(catIdx, moto) {
  const list = moto ? MOTO_CATS : CAR_CAT_IDX;
  let html = xrayBase(moto).replace("<svg ", '<svg class="xray-layer xray-base" ');
  for (let i = 0; i < list.length; i++) {
    if (list[i] !== catIdx) html += xrayPart(list[i], moto, false);
  }
  html += xrayPart(catIdx, moto, true);
  el("shopSchematic").innerHTML = html;
}

  Object.assign(MCLA.ui, { paintXray });
})();
