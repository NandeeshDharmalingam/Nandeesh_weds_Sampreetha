/* ============================================================================
   NANDEESH & SAMPREETHA - "DRAW A HEART" INVITATION
   The only file you need to edit: names, date, venue, music and skin colours.
   Keep the quotes ' ' and the commas exactly as they are. Lines starting
   with // are notes. Save the file and refresh the page to see changes.
   ========================================================================== */
window.HEART_CONFIG = {

  couple: { groom: 'Nandeesh', bride: 'Sampreetha' },

  // From the save-the-date card (19.02.2027). Format YYYY-MM-DD.
  wedding: { date: '2027-02-19', timeZone: 'Asia/Kolkata' },

  text: {
    gate: {
      title: 'Draw a heart',
      hint: 'to begin',
      help: 'Follow the dotted heart',
      auto: 'Tap to draw it for me',
    },
    scroll: 'Scroll',
    blessing: 'ಶ್ರೀ ಗಣೇಶಾಯ ನಮಃ', // '' hides this line
    invite: 'invite you to bless and celebrate their wedding',
    closing: 'With love and blessings',
    toFollow: 'Details to follow',
    labels: {
      time: 'Time',
      venue: 'Venue',
      map: 'View on map',
      google: 'Add to Google Calendar',
      ics: 'Apple / Outlook',
    },
  },

  /* Events. Leave startTime, venueName, address and mapUrl '' until confirmed;
     the page then shows "Details to follow". An event with no date and no
     venue is shown as one quiet line. Times use 24-hour format, e.g. '10:30'. */
  events: [
    {
      id: 'muhurtha',
      title: 'Muhurtha',
      titleLocal: 'ಮುಹೂರ್ತ',
      date: '2027-02-19',
      startTime: '',
      endTime: '',
      venueName: '',
      address: '',
      mapUrl: '', // paste a Google Maps "Share" link to show "View on map"
      note: '',
    },
    {
      id: 'reception',
      title: 'Reception',
      titleLocal: 'ಆರತಕ್ಷತೆ',
      date: '',
      startTime: '',
      endTime: '',
      venueName: '',
      address: '',
      mapUrl: '',
      note: '',
    },
  ],

  music: {
    enabled: true,
    // '' = the built-in calm soundtrack (no file needed).
    // Your own track: put an mp3 in the assets/audio folder and write its path here,
    // for example 'assets/audio/our-song.mp3'. Use music you own or have permission to use.
    src: '',
    volume: 0.35, // 0 (silent) to 1 (full)
  },

  effects: {
    animations: true, // false = a still, calm page (visitors who prefer less motion get this automatically)
    petals: true, // the stream of petals that pours from the hands
  },
};
