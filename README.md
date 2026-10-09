# Nandeesh & Sampreetha - Wedding Invitation

A devotional, joyful wedding invitation website: a temple-gate welcome, gently falling flowers, South Indian decorations (mango-leaf torans, jasmine garlands, brass lamps, kolam), the blessings of Lord Ganesha and Lord Venkateshwara, and optional wedding music.

It is a plain website (HTML, CSS and a little JavaScript). There is nothing to install and nothing to build.

**Everything you will want to change is in one file: [`config.js`](config.js).**

## Contents

1. [What is in this folder](#1-what-is-in-this-folder)
2. [See it on your computer](#2-see-it-on-your-computer)
3. [Fill in your details](#3-fill-in-your-details)
4. [Flowers, Decorations and Wedding Music](#4-flowers-decorations-and-wedding-music)
5. [Publish it on GitHub Pages](#5-publish-it-on-github-pages)
6. [Troubleshooting](#6-troubleshooting)
7. [Credits and licences](#7-credits-and-licences)

## 1. What is in this folder

```text
Wedding eInvite/
├─ index.html          the page (you rarely need to edit it)
├─ config.js           ALL settings: names, dates, wording, flowers, music, decorations, artwork
├─ css/styles.css      colours, layout and animations
├─ js/                 the code that runs the page
└─ public/
   ├─ audio/           PUT THE WEDDING MUSIC HERE
   ├─ fonts/           Cormorant Garamond and Great Vibes
   └─ images/
      ├─ ganesha.svg, gopuram.svg, temple.svg, namam.svg
      ├─ flowers/      the four falling-flower pictures
      └─ decor/        torans, garlands, lamps, kolam, mandapam and more
```

The invitation unfolds in this order: **Welcome screen** (Ganesha, temple bell, rising gopuram, blessing, "Enter Wedding Invitation") then **Cover**, **Family**, **Muhurtha**, **Reception** and **Final blessing**.

## 2. See it on your computer

For the most faithful preview (same fonts and sound as your guests):

1. Open a terminal in this folder.
2. Run `python -m http.server 8080`
3. Open <http://localhost:8080> in your browser. Press `Ctrl+C` in the terminal to stop.

Any other simple web server works too (for example the "Live Server" extension in VS Code).

Double-clicking `index.html` also opens the invitation, but Chrome and Edge refuse to load fonts from a file on your disk, so the lettering looks plainer. Use the steps above, or publish it, to judge the real look.

After changing `config.js`, save it and refresh the page (`Ctrl+F5` if you do not see the change).

## 3. Fill in your details

Open `config.js` in any text editor (VS Code or Notepad). Keep the quotes `' '` and the commas exactly as they are. Lines that start with `//` are notes, not settings.

| To change | Look for |
| --- | --- |
| Names | `couple` |
| Date shown on the cover | `wedding.date` (written like `2027-02-19`) |
| Wording of every section | `text` |
| Events: date, time, venue, map link | `events` |
| Parents' names (optional) | `text.family.groom.parents` and `text.family.bride.parents` |

**Events.** The Muhurtha date is already set to 19 February 2027, taken from the save-the-date card. Times, venues and the Reception date are empty, so guests see "To be announced" until you fill them in. Only add details the families have confirmed.

```js
{
  id: 'muhurtha',
  theme: 'muhurtha',                 // 'muhurtha' or 'reception' (chooses the decorations)
  title: 'Muhurtha',
  titleLocal: 'ಮುಹೂರ್ತ',
  tagline: 'The auspicious hour of the wedding',
  date: '2027-02-19',                // '' until confirmed
  startTime: '10:30',                // 24-hour time, example only. '' = to be announced
  endTime: '12:30',                  // optional
  venueName: 'Venue name',           // example only
  address: 'Street, Area, City',     // example only
  mapUrl: 'https://maps.app.goo.gl/your-link',  // a Google Maps "Share" link, example only
  note: '',                          // optional extra line
},
```

- An event that has a date automatically gets **Add to Google Calendar** and **Download for Apple / Outlook** buttons. With no time, it is added as an all-day event.
- An event with a map link gets a **View on Map** button.
- To add another event, copy an event block and change it. To remove one, delete its block.

## 4. Flowers, Decorations and Wedding Music

### How it behaves

- **Welcome screen:** banana leaves and blossoms frame the screen, a small Ganesha sits between two temple bells, the gopuram rises slowly, and a gentle shower of petals falls. Guests can tap **Enter Wedding Invitation** at any moment, there is no waiting.
- **Falling flowers:** soft rose petals, white jasmine, golden marigold petals and the occasional lotus petal. A festive shower falls when the invitation opens and again at the final blessing, with a quieter shower in between. Petals never block taps or scrolling, fewer fall on phones, they pause when the tab is in the background, and they are skipped for guests whose phone asks for reduced motion.
- **Music:** never starts by itself. Guests choose it (**Enter with Wedding Music** on the welcome screen, or the floating **Play Wedding Music** button). The invitation reads perfectly well with sound off.

### Replace the temple gopuram illustration

The gopuram appears on the welcome screen and on the cover. The wide temple scene with the lotus pond at the final blessing is a separate picture.

1. Prepare your picture: a transparent background, roughly 4 : 5 portrait (the original is 400 x 520), SVG, PNG or WebP, ideally under 150 KB.
2. **Easiest:** save it over `public/images/gopuram.svg` (keep the same file name and type).
3. **Or:** save it with any name in `public/images/` and set its path in `config.js`:

```js
images: {
  gopuram: 'public/images/my-gopuram.png',
  templeIllustration: 'public/images/my-temple-scene.png',  // the final blessing scene
  // ...the other pictures stay as they are
},
```

### Replace the Ganesha emblem

Same idea. The Ganesha appears small at the top of the welcome screen and the cover. Use a square picture with a transparent background (the original is 200 x 200). Save it over `public/images/ganesha.svg`, or set `images.ganesha` in `config.js`. The Sanskrit/Kannada line under it is `text.welcome.ganeshaLine`.

### Add custom jasmine, lotus, rose and marigold illustrations

The falling-flower pictures live in `public/images/flowers/`:

| Flower | File | Used for |
| --- | --- | --- |
| Rose | `rose-petal.svg` | soft pink rose petals |
| Jasmine | `jasmine.svg` | small white jasmine flowers |
| Marigold | `marigold-petal.svg` | golden-yellow marigold petals |
| Lotus | `lotus-petal.svg` | occasional lotus petals |

1. Make a small picture of **one** petal or flower: square, transparent background, about 64 x 64 pixels, petal tip pointing up.
2. Save it over the old file, or save it under a new name and set `image` in `config.js`.

```js
flowers: {
  rose: { enabled: true, image: 'public/images/flowers/rose-petal.svg', weight: 4, size: [16, 28], fall: 1.0, motion: 'flutter' },
  // ...jasmine, marigold and lotus are listed the same way
  // A brand-new flower type:
  hibiscus: { enabled: true, image: 'public/images/flowers/hibiscus.png', weight: 2, size: [16, 26], fall: 1.0, motion: 'flutter' },
},
```

- `weight`: how often it appears compared with the others (bigger = more often).
- `size`: smallest and largest size in pixels.
- `fall`: speed of this flower (higher = falls faster).
- `motion`: `'flutter'` (turns over like a petal) or `'spin'` (turns flat like a flower seen from above).
- `enabled: false` removes that flower.

### Change the falling-flower intensity

```js
flowerShower: {
  enabled: true,
  intensity: 1,      // 0 = none, 0.5 = half, 1 = normal, 1.5 = lush
  speed: 1,          // 0.7 = slower and calmer, 1.4 = faster
  maxPetals: { desktop: 24, tablet: 16, mobile: 10 },   // petals on screen at once
  levels: { off: 0, whisper: 0.25, gentle: 0.5, medium: 0.8, festive: 1.3 },
  sectionLevels: {   // how full the shower is in each part of the page
    welcome: 'gentle', opening: 'gentle', family: 'whisper',
    muhurtha: 'gentle', reception: 'medium', blessing: 'festive',
  },
  // ...the other flowerShower settings stay as they are
},
```

The number of petals on screen is `maxPetals x level x intensity`. For a calmer look try `intensity: 0.6` and `speed: 0.8`. Keep `mobile` at 10 or fewer so phones stay smooth. Older or low-memory phones and "data saver" mode automatically get fewer petals.

### Configure the opening and closing flower showers

```js
openingShower: { enabled: true, level: 'festive', durationMs: 5500 },  // when the guest taps Enter
closingShower: { enabled: true, level: 'festive', durationMs: 9000 },  // at the final blessing
```

- `enabled: false` turns that shower off.
- `level` is any name from `levels` (or a number).
- `durationMs` is in milliseconds (1000 = 1 second).
- The gentle shower on the welcome screen is controlled by `sectionLevels.welcome`.

### Disable animations

| Goal | Setting in `config.js` |
| --- | --- |
| Stop **all** movement (falling flowers, swaying leaves, swinging bells, flickering lamps, fading text) | `animations: false` |
| Stop only the falling flowers | `flowerShower.enabled: false` |
| Hide a group of decorations | `decorations.lamps: false` (and so on, see below) |

Guests who switch on "Reduce motion" on their phone or computer automatically get the still version, without any setting from you. To try it yourself: Windows **Settings > Accessibility > Visual effects > Animation effects**, iPhone **Settings > Accessibility > Motion > Reduce Motion**, Android **Settings > Accessibility > Remove animations**.

### Add the main instrumental wedding track

1. Get a piece of music you are allowed to use (see [Music licensing](#music-licensing)). A soft flute or veena instrumental suits the invitation best. Use a track that loops smoothly.
2. Save it as MP3 with exactly this name: `public/audio/wedding-instrumental.mp3`
3. Refresh the page. **Enter with Wedding Music** and the floating **Play Wedding Music** button appear as soon as the file is found.

No file yet? The invitation works silently and the music buttons stay hidden. (Your browser's developer console may show a harmless "404" for the missing file.)

Settings, with the file names and where each one goes:

```js
music: {
  enabled: true,
  showControlInitially: false,  // false = the music button appears after the guest's first tap
  volume: 0.45,                 // starting volume, 0 to 1
  crossfadeSeconds: 2.5,        // smooth change between tracks, 0 = no crossfade
  rememberChoices: true,        // remembers track, volume and mute during the visit
  pauseWhenPageHidden: true,    // pauses when the guest switches app or tab
  tracks: {
    opening:     { src: '', title: 'Opening Blessing', artist: '' },
    main:        { src: 'public/audio/wedding-instrumental.mp3', title: 'Wedding Instrumental', artist: '' },
    alternate:   { src: 'public/audio/optional-devotional-instrumental.mp3', title: 'Devotional Instrumental', artist: '' },
    celebration: { src: 'public/audio/wedding-celebration.mp3', title: 'Celebration Instrumental', artist: '' },
  },
  celebration: { playAtFinalBlessing: true, returnToMainWhenLeaving: true },
},
```

`title` and `artist` appear in the music options, so you can credit the musician (for example `artist: 'Played by ...'`).

What guests get: a play / pause button with a clear label, a visible **Playing** or **Paused** status, floating music notes while it plays, a volume slider, a mute button, a track choice, a temple-bell switch and **Turn music off**. Everything works by touch and by keyboard (`Esc` closes the options).

### Add optional devotional and celebration tracks

| File in `public/audio/` | What it does |
| --- | --- |
| `optional-devotional-instrumental.mp3` | Guests can choose it under **Track** in the music options (the choice appears when at least two tracks exist). |
| `wedding-celebration.mp3` | Fades in at the final blessing if the guest is already listening, and returns to the main track when they scroll back up. Turn off with `celebration.playAtFinalBlessing: false`. |
| *(optional)* an opening track, for example `opening.mp3` | A short, calm introduction (set `tracks.opening.src: 'public/audio/opening.mp3'`). It plays once when the guest chooses music, then the main track follows. |

Only one track plays at a time. Tracks crossfade only on devices that let web pages control volume (not iPhones, where the track simply changes). Set `crossfadeSeconds: 0` to switch crossfading off.

Suggested mood: soft instrumental flute or veena for the main track; a gentle devotional instrumental inspired by Lord Venkateshwara as the alternate; a traditional nadaswaram instrumental, used tastefully, for the celebration. Avoid loud percussion and sudden changes in volume.

### Temple bell (optional, never automatic)

A soft temple bell is built into the page, so no file is needed. It is off unless a guest chooses it: by tapping the bell on the welcome screen, or with the **Temple bell** switch in the music options (which appears together with the music button). When the switch is on, the bell chimes once as the invitation opens and once at the final blessing. It never loops, stays quiet and follows the mute button.

```js
templeBell: {
  enabled: true,            // false removes every bell sound
  volume: 0.22,             // keep it low, 0 to 1
  file: '',                 // optional: 'public/audio/temple-bell.mp3' to use your own recording
  chimeOnEnter: true,
  chimeAtBlessing: true,
},
```

### Change the music volume

- `music.volume` is the starting volume from 0 to 1 (0.45 is fairly soft). Guests can change it with the slider. On iPhones web pages cannot change volume, so guests use the phone's volume buttons (the page says so).
- Make your tracks about equally loud before adding them (use "normalize" in any audio editor). That works better than trying to fix it here.
- The bell has its own level: `templeBell.volume`.

### Test the music on a phone

The best test is the real thing: publish the site (see [section 5](#5-publish-it-on-github-pages)) and open it on the phones your guests are likely to use (an iPhone in Safari and an Android phone in Chrome). To test before publishing, run `python -m http.server 8080 --bind 0.0.0.0` in this folder, find your computer's address with `ipconfig` (the "IPv4 Address", for example 192.168.1.20), and open `http://192.168.1.20:8080` on a phone on the same Wi-Fi. Allow Python through the firewall for private networks only, and press `Ctrl+C` to stop when you are done.

Check these, in order:

1. Opening the link makes **no sound** by itself.
2. Tap **Enter with Wedding Music**: the music starts softly and the floating button says **Pause Music** with notes rising.
3. Open the music options: pause, mute, volume (an iPhone shows "Use your device volume buttons"), track choice and **Turn music off** all work with a finger.
4. Switch to another app, then come back: the music pauses while you are away and resumes when you return (on some phones you may need to tap **Play Wedding Music** again).
5. Scroll to the final blessing: the celebration track fades in and the flowers fall more festively.
6. Tap **Enter Wedding Invitation** (without music) in a fresh tab: the invitation reads perfectly well in silence.
7. If you hear nothing on an iPhone, check the silent switch and the volume buttons.

### Music licensing

Use only music you own, music the family has permission to use, or properly licensed recordings. A friend or family member who plays the flute, veena or nadaswaram can record something just for you. Music libraries that allow use on a website also work: read their licence first. Do not add commercial film or album recordings without permission, because this website is public. No music is included in this folder.

### Replace decorative images with family-selected artwork

Every picture can be replaced in two ways: save your own file **over** the old one (same name), or save it with any name in `public/images/` and set its path in `config.js` under `images`. SVG is best (sharp at every size and very small). PNG and WebP also work. Use transparent backgrounds, keep each file under about 150 KB, and keep the proportions of the picture you replace.

| `images` setting | Default file | Where it appears |
| --- | --- | --- |
| `ganesha` | `ganesha.svg` | welcome screen, cover |
| `gopuram` | `gopuram.svg` | welcome screen, cover |
| `templeIllustration` | `temple.svg` | final blessing |
| `namam` | `namam.svg` | Venkateshwara namam with shankha and chakra: cover, final blessing |
| `mandapam` | `decor/mandapam.svg` | Muhurtha |
| `kuthuvilakku` | `decor/kuthuvilakku.svg` | Muhurtha (two brass lamps) |
| `kalash` | `decor/kalash.svg` | Muhurtha |
| `lotus` | `decor/lotus.svg` | Muhurtha, Reception, final blessing |
| `kolam` | `decor/kolam.svg` | welcome screen, cover, Reception (faint patterns) |
| `templeBell` | `decor/temple-bell.svg` | welcome screen (tap to ring) |
| `bananaLeaf`, `bananaBlossom` | `decor/banana-leaf.svg`, `decor/banana-blossom.svg` | welcome screen, Muhurtha |
| `marigoldJasmine` | `decor/marigold-jasmine.svg` | Reception corners |
| `ornamentDivider`, `dividerGopuram` | `decor/ornament-divider.svg`, `decor/divider-gopuram.svg` | welcome screen, cover, Family |
| `toran` | `decor/toran.svg` | cover, Muhurtha, final blessing |
| `jasmineGarland` | `decor/jasmine-garland.svg` | Family, Reception |
| `silkBorder` | `decor/silk-border.svg` | frames, Muhurtha, Reception |

`toran`, `jasmineGarland` and `silkBorder` repeat sideways like a ribbon, so draw them as a tile whose left and right edges match.

To remove a whole group of decorations without touching any file:

```js
decorations: {
  banana: true,        // banana leaves and blossoms
  toran: true,         // mango-leaf torans
  garlands: true,      // jasmine garlands
  lamps: true,         // brass kuthu vilakku lamps
  kolam: true,         // kolam / rangoli patterns and lotus flowers
  silkBorders: true,   // silk-saree style borders
  mandapam: true,      // wedding mandapam (Muhurtha)
  kalash: true,        // kalasha motifs
  arrangements: true,  // marigold and jasmine arrangements
  bells: true,         // hanging temple bells
},
```

## 5. Publish it on GitHub Pages

1. Copy everything inside this folder into your GitHub repository folder (the workspace has an empty `wedding-gh-pages` folder for this). `index.html` must sit at the top, with `config.js`, `css`, `js` and `public` beside it.
2. Commit and push.
3. On GitHub open the repository, then **Settings > Pages**, choose **Deploy from a branch**, pick your branch and the `/ (root)` folder, and save. After a minute the invitation is live at `https://<your-user>.github.io/<repository>/`.
4. Open the link on your own phone before sharing it, and repeat the phone checklist above.

All paths are relative, so the site works at any address. After every change, copy the changed files again and push.

## 6. Troubleshooting

| Problem | What to try |
| --- | --- |
| A change does not show | Save `config.js`, then refresh with `Ctrl+F5`. On a phone, close the tab and open the link again. |
| Blank page or the page does not open | A quote or comma was removed in `config.js`. Compare with the examples above. VS Code underlines the mistake. |
| No music button | The audio file is missing or named differently. Names are case-sensitive on GitHub Pages: `Wedding-Instrumental.mp3` is not `wedding-instrumental.mp3`. |
| Music button shows but there is no sound | Check the phone's volume and silent switch, tap the button once more, or try another browser. |
| No falling flowers | Check `animations`, `flowerShower.enabled` and `intensity`, and whether "Reduce motion" is on for the device. |
| Kannada letters show as boxes | The device has no Kannada font (very old phones). Update the phone. |
| Lettering looks plain when I double-click `index.html` | Use the local server in [section 2](#2-see-it-on-your-computer) or publish the site. |

## 7. Credits and licences

- Fonts: Cormorant Garamond and Great Vibes, released under the SIL Open Font License 1.1 (files in `public/fonts/`).
- All illustrations (Ganesha, gopuram, temple, flowers and decorations) are original SVG drawings made for this invitation. You may edit or replace them freely.
- No music is included. Add only music you have the right to use.
