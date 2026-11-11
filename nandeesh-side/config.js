/* ============================================================================
   NANDEESH'S SIDE - GOPURAM INVITATION
   This one file controls both invitations in this folder:
     muhurtha-reception/   Muhurtha + Reception
     reception/            Reception only
   Names, parents, date, events, music and wording are all here.
   Keep the quotes ' ' and the commas exactly as they are. Lines starting
   with // are notes. Save the file and refresh the page to see the change.
   ========================================================================== */
window.INVITE_CONFIG = {

  // first: who is named first on both pages, in the browser tab and in calendar entries. Write 'groom' or 'bride'.
  couple: { groom: 'Nandeesh', bride: 'Sampreetha', first: 'groom' },

  /* THE FAMILIES, shown under each name on the second page.
       relation  the small words before the parents, for example 'son of'.
       parents   written the way you want it to appear; put & between the two names.
                 '' hides that line. */
  families: {
    groom: { relation: 'son of', parents: 'Smt. Saritha D & Sri. Dharmalingam M' },
    bride: { relation: 'daughter of', parents: 'Smt. Sudha B & Sri. Dr. M S Sudheer Kumar' },
  },

  // From the save-the-date card (19.02.2027). Format YYYY-MM-DD.
  wedding: { date: '2027-02-19', timeZone: 'Asia/Kolkata' },

  text: {
    gate: {
      title: 'Draw a heart',
      hint: 'to begin',
      help: 'Follow the dotted heart',
      auto: 'Tap to draw it for me',
    },
    blessing: 'ಶ್ರೀ ಗಣೇಶಾಯ ನಮಃ', // '' hides this line
    hero: { line: 'are getting married', scroll: 'Scroll' },
    page2: {
      lead: 'Together with their families',
      closing: 'With love and blessings',
    },
    toFollow: 'Details to follow',
    labels: {
      date: 'Date',
      time: 'Time',
      venue: 'Venue',
      map: 'View on map',
      google: 'Google Calendar',
      ics: 'Apple / Outlook',
    },
    music: { turnOn: 'Turn music on', turnOff: 'Turn music off' },
  },

  /* THE TWO INVITATIONS IN THIS FOLDER
       muhurtha-reception/   = the 'both' version       (Muhurtha and Reception)
       reception/            = the 'reception' version  (Reception only)
     events: which boxes appear, by id, in this order.
     invite: the line under the two names.   title: the name shown on the browser tab. */
  versions: {
    both: {
      events: ['muhurtha', 'reception'],
      invite: 'invite you to bless and celebrate their wedding',
      title: 'Wedding Invitation',
    },
    reception: {
      events: ['reception'],
      invite: 'invite you to join them for their wedding reception',
      title: 'Reception Invitation',
    },
  },

  /* THE EVENTS (the boxes on the second page)
     date       the day, written YYYY-MM-DD.  '' shows "Details to follow".
     timeText   a few words shown until you know the exact time, e.g. 'Morning' or 'Evening'.
     startTime  the exact start, in 24-hour time: '10:30' is 10:30 AM, '19:00' is 7:00 PM.
     endTime    optional end, same style. Once startTime is filled, timeText is not shown.
     venueName, address   shown under the pin. '' shows "Details to follow".
     mapUrl     a Google Maps "Share" link; adds a "View on map" button.
     note       optional extra line at the bottom of the box.
     A box with a date also gets "Google Calendar" and "Apple / Outlook" buttons. */
  events: [
    {
      id: 'muhurtha',
      title: 'Muhurtha',
      titleLocal: 'ಮುಹೂರ್ತ',
      date: '2027-02-19',
      timeText: 'Morning',
      startTime: '',
      endTime: '',
      venueName: '',
      address: '',
      mapUrl: '',
      note: '',
    },
    {
      id: 'reception',
      title: 'Reception',
      titleLocal: 'ಆರತಕ್ಷತೆ',
      date: '2027-02-19',
      timeText: 'Evening',
      startTime: '',
      endTime: '',
      venueName: '',
      address: '',
      mapUrl: '',
      note: '',
    },
  ],

  /* Music. Put your song in this folder's assets/audio folder and name it music.mp3
     (mp3 works everywhere). The path in src starts with ../ because it is written from
     inside the muhurtha-reception and reception folders. The round button in the corner
     turns it on and off. Use music you own or have permission to use. */
  music: {
    enabled: true,
    src: '../assets/audio/music.mp3',
    volume: 0.45, // 0 (silent) to 1 (full)
    autoStart: true, // starts softly once the heart is drawn; guests can switch it off
    ambientIfMissing: true, // until your song is added, a soft built-in tune plays so the button works
  },

  effects: {
    animations: true, // false = a still, calm page (guests who prefer less motion get this automatically)
  },
};
