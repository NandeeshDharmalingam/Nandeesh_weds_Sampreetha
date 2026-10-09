/* ============================================================================
   NANDEESH & SAMPREETHA  -  WEDDING INVITATION
   CENTRAL CONFIGURATION: this is the only file you need to edit to personalise
   the invitation (names, dates, venues, wording, flowers, decorations, music).

   Tips
   - Keep the quotes ' ' and the commas , exactly as they are.
   - Lines that start with // are notes, not settings.
   - true = on, false = off.
   - Save the file and refresh the page to see changes.
   ========================================================================== */
window.WEDDING_CONFIG = {

  /* ---------------------------------------------------------------------- */
  /* 1. COUPLE AND PAGE                                                      */
  /* ---------------------------------------------------------------------- */
  couple: {
    groom: 'Nandeesh',
    bride: 'Sampreetha',
  },
  pageTitle: 'Nandeesh & Sampreetha | Wedding Invitation',

  /* Date shown on the cover. Taken from the save-the-date card (19.02.2027).
     Format: YYYY-MM-DD. Keep it the same as the Muhurtha date below.        */
  wedding: {
    date: '2027-02-19',
    timeZone: 'Asia/Kolkata', // used only for the "Add to calendar" buttons
  },

  /* ---------------------------------------------------------------------- */
  /* 2. WORDING                                                              */
  /*    {groom} and {bride} are replaced by the names above.                 */
  /* ---------------------------------------------------------------------- */
  text: {
    welcome: {
      ganeshaLine: 'ಶ್ರೀ ಗಣೇಶಾಯ ನಮಃ',
      mantra: 'ಓಂ ನಮೋ ವೆಂಕಟೇಶಾಯ',
      blessing: 'With the blessings of Lord Sri Venkateshwara',
      enterButton: 'Enter Wedding Invitation',
      enterWithMusicButton: 'Enter with Wedding Music',
      bellLabel: 'Ring the temple bell (soft sound)',
    },
    hero: {
      eyebrow: 'Together with their families',
      invite: 'invite you to bless and celebrate their wedding',
      scrollHint: 'Scroll for the invitation',
    },
    family: {
      heading: 'With the blessings of our elders',
      message:
        'With hearts full of gratitude and the grace of Lord Venkateshwara, our families joyfully invite you to witness and bless the union of {groom} and {bride}.',
      // Optional. Leave parents '' to hide that column.
      groom: { relation: 'Son of', parents: '' },
      bride: { relation: 'Daughter of', parents: '' },
    },
    blessing: {
      heading: 'Your blessings complete our joy',
      message:
        'Your presence and blessings will make our wedding day truly special. We look forward to celebrating with you.',
      signoff: 'With love and gratitude,',
      mantra: 'ಓಂ ನಮೋ ವೆಂಕಟೇಶಾಯ',
    },
    labels: {
      date: 'Date',
      time: 'Time',
      venue: 'Venue',
      toBeAnnounced: 'To be announced',
      venueToFollow: 'Venue details to follow',
      addToGoogle: 'Add to Google Calendar',
      addToCalendar: 'Download for Apple / Outlook',
      viewMap: 'View on Map',
    },
    music: {
      play: 'Play Wedding Music',
      pause: 'Pause Music',
      playing: 'Playing',
      paused: 'Paused',
      off: 'Music is off',
      volume: 'Volume',
      mute: 'Mute',
      unmute: 'Unmute',
      turnOff: 'Turn music off',
      turnOn: 'Turn music on',
      track: 'Track',
      templeBell: 'Temple bell',
      unavailable: 'Music is not available right now',
      deviceVolume: 'Use your device volume buttons',
    },
  },

  /* ---------------------------------------------------------------------- */
  /* 3. EVENTS                                                               */
  /*    Add, remove or reorder events. Leave date '' until it is confirmed.  */
  /*    Leave startTime/venueName '' to show "To be announced".              */
  /*    startTime / endTime use 24-hour time, e.g. '10:30' or '19:00'.       */
  /*    theme: 'muhurtha' | 'reception'  (chooses the decorations)           */
  /* ---------------------------------------------------------------------- */
  events: [
    {
      id: 'muhurtha',
      theme: 'muhurtha',
      title: 'Muhurtha',
      titleLocal: 'ಮುಹೂರ್ತ',
      tagline: 'The auspicious hour of the wedding',
      date: '2027-02-19', // from the save-the-date card
      startTime: '',
      endTime: '',
      venueName: '',
      address: '',
      mapUrl: '', // paste a Google Maps share link to show "View on Map"
      note: '',
    },
    {
      id: 'reception',
      theme: 'reception',
      title: 'Reception',
      titleLocal: 'ಆರತಕ್ಷತೆ',
      tagline: 'An evening to celebrate together',
      date: '',
      startTime: '',
      endTime: '',
      venueName: '',
      address: '',
      mapUrl: '',
      note: '',
    },
  ],

  /* ---------------------------------------------------------------------- */
  /* 4. MOTION AND FALLING FLOWERS                                           */
  /* ---------------------------------------------------------------------- */
  // Master switch for ALL movement: falling flowers, swaying leaves, swinging
  // bells and fading text. false = a calm, still invitation. Guests who choose
  // "reduce motion" on their phone always get the still version.
  animations: true,

  flowerShower: {
    enabled: true, // false = no falling flowers anywhere
    intensity: 1, // overall amount: 0 = none, 0.5 = half, 1 = normal, 1.5 = lush
    speed: 1, // 1 = natural, 0.7 = slower and calmer, 1.4 = faster

    // Petals on screen at one time when the level is "1". Fewer on phones.
    maxPetals: { desktop: 24, tablet: 16, mobile: 10 },

    // Flower types. Set enabled: false to remove one, or point image to your own artwork.
    // weight = how often it appears, size = [smallest, largest] in pixels.
    flowers: {
      rose: { enabled: true, image: 'public/images/flowers/rose-petal.svg', weight: 4, size: [16, 28], fall: 1.0, motion: 'flutter' },
      jasmine: { enabled: true, image: 'public/images/flowers/jasmine.svg', weight: 5, size: [12, 22], fall: 0.9, motion: 'spin' },
      marigold: { enabled: true, image: 'public/images/flowers/marigold-petal.svg', weight: 3, size: [14, 24], fall: 1.1, motion: 'flutter' },
      lotus: { enabled: true, image: 'public/images/flowers/lotus-petal.svg', weight: 1, size: [20, 32], fall: 0.85, motion: 'flutter' },
    },

    // How full the shower is at each level (multiplied by the numbers above).
    levels: { off: 0, whisper: 0.25, gentle: 0.5, medium: 0.8, festive: 1.3 },

    // Which level is used while each part of the page is on screen.
    sectionLevels: {
      welcome: 'gentle',
      opening: 'gentle',
      family: 'whisper',
      muhurtha: 'gentle',
      reception: 'medium',
      blessing: 'festive',
    },

    // Extra shower when the guest taps "Enter" (the invitation opens).
    openingShower: { enabled: true, level: 'festive', durationMs: 5500 },
    // Extra shower when the guest reaches the final blessing.
    closingShower: { enabled: true, level: 'festive', durationMs: 9000 },

    respectReducedMotion: true, // keep true: skips the shower for guests who ask for less motion
    pauseWhenHidden: true, // stops the shower while the tab or app is in the background
  },

  /* ---------------------------------------------------------------------- */
  /* 5. MUSIC                                                                */
  /*    Music never starts by itself. The guest chooses to play it.          */
  /*    Put your audio files in public/audio/ (see README).                  */
  /*    If a file is missing, the invitation simply works without music.     */
  /* ---------------------------------------------------------------------- */
  music: {
    enabled: true,
    showControlInitially: false, // false = the music button appears after the guest's first tap
    volume: 0.45, // starting volume: 0 (silent) to 1 (full)
    crossfadeSeconds: 2.5, // smooth change between tracks. 0 = no crossfade
    rememberChoices: true, // remembers track, volume and mute during the visit
    pauseWhenPageHidden: true, // pauses when the guest switches tab or app

    tracks: {
      // Optional short intro played once, then the main track follows. '' = skip.
      opening: { src: '', title: 'Opening Blessing', artist: '' },
      // The main background music (soft flute / veena instrumental works well).
      main: { src: 'public/audio/wedding-instrumental.mp3', title: 'Wedding Instrumental', artist: '' },
      // Optional second track the guest can switch to.
      alternate: { src: 'public/audio/optional-devotional-instrumental.mp3', title: 'Devotional Instrumental', artist: '' },
      // Optional festive track for the final blessing.
      celebration: { src: 'public/audio/wedding-celebration.mp3', title: 'Celebration Instrumental', artist: '' },
    },

    // Switch to the celebration track at the final blessing (only if music is playing).
    celebration: { playAtFinalBlessing: true, returnToMainWhenLeaving: true },
  },

  /* ---------------------------------------------------------------------- */
  /* 6. TEMPLE BELL (optional, always quiet)                                 */
  /*    A soft bell the guest can switch on. Off unless the guest turns it   */
  /*    on or taps the bell on the welcome screen.                           */
  /* ---------------------------------------------------------------------- */
  templeBell: {
    enabled: true, // false removes every bell sound
    volume: 0.22, // keep low (0 to 1)
    file: '', // optional: 'public/audio/temple-bell.mp3'. '' = built-in soft bell
    chimeOnEnter: true, // one soft chime when the invitation opens (only if the bell is on)
    chimeAtBlessing: true, // one soft chime at the final blessing (only if the bell is on)
  },

  /* ---------------------------------------------------------------------- */
  /* 7. DECORATIONS: switch groups on or off                                 */
  /* ---------------------------------------------------------------------- */
  decorations: {
    banana: true, // banana leaves and blossoms around the welcome screen
    toran: true, // mango-leaf toran at section entrances
    garlands: true, // jasmine garlands along section borders
    lamps: true, // brass kuthu vilakku lamps
    kolam: true, // kolam / rangoli patterns and lotus flowers
    silkBorders: true, // silk-saree style borders
    mandapam: true, // wedding mandapam illustration (Muhurtha section)
    kalash: true, // kalasha motifs
    arrangements: true, // marigold and jasmine arrangements
    bells: true, // hanging temple bells
  },

  /* ---------------------------------------------------------------------- */
  /* 8. ARTWORK FILES                                                        */
  /*    Replace a file in place (same name) or point to your own file.       */
  /*    SVG, PNG, WebP and JPG all work.                                     */
  /* ---------------------------------------------------------------------- */
  images: {
    ganesha: 'public/images/ganesha.svg',
    gopuram: 'public/images/gopuram.svg',
    templeIllustration: 'public/images/temple.svg',
    namam: 'public/images/namam.svg',
    mandapam: 'public/images/decor/mandapam.svg',
    kuthuvilakku: 'public/images/decor/kuthuvilakku.svg',
    kalash: 'public/images/decor/kalash.svg',
    lotus: 'public/images/decor/lotus.svg',
    kolam: 'public/images/decor/kolam.svg',
    templeBell: 'public/images/decor/temple-bell.svg',
    bananaLeaf: 'public/images/decor/banana-leaf.svg',
    bananaBlossom: 'public/images/decor/banana-blossom.svg',
    marigoldJasmine: 'public/images/decor/marigold-jasmine.svg',
    toran: 'public/images/decor/toran.svg',
    jasmineGarland: 'public/images/decor/jasmine-garland.svg',
    silkBorder: 'public/images/decor/silk-border.svg',
    ornamentDivider: 'public/images/decor/ornament-divider.svg',
    dividerGopuram: 'public/images/decor/divider-gopuram.svg',
  },
};
