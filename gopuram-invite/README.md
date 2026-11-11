# Nandeesh & Sampreetha - Wedding Invitation (Gopuram design)

A blue, temple-gopuram invitation made for phones. The guest draws a heart, passes through the clouds to the gopuram page with the two names, then scrolls down to the temple doorway with the **Muhurtha** and **Reception** boxes. A round button in the corner turns the music on and off.

It is a plain website (HTML, CSS and a little JavaScript). There is nothing to install and nothing to build. **Almost everything you will want to change is in one file: [`config.js`](config.js).**

## Contents

1. [The two versions you send](#1-the-two-versions-you-send)
2. [See it on your computer](#2-see-it-on-your-computer)
3. [Change the times, venue and map link](#3-change-the-times-venue-and-map-link)
4. [Change which boxes each version shows](#4-change-which-boxes-each-version-shows)
5. [Add your music](#5-add-your-music)
6. [Change names, wording and pictures](#6-change-names-wording-and-pictures)
7. [Put it online and share it](#7-put-it-online-and-share-it)
8. [Check it on a phone](#8-check-it-on-a-phone)
9. [Troubleshooting](#9-troubleshooting)
10. [What is in this folder](#10-what-is-in-this-folder)

## 1. The two versions you send

| Send this to | Page | What it shows |
| --- | --- | --- |
| Guests invited to **Muhurtha and Reception** | `index.html` | Muhurtha box, then Reception box |
| Guests invited to the **Reception only** | `reception.html` | Reception box only |

Both pages use the same pictures, music and `config.js`, so when you change a time or a venue it changes in both.

Once it is online (section 7) the two links look like this:

- Both events: `https://<your-user>.github.io/<repository>/gopuram-invite/`
- Reception only: `https://<your-user>.github.io/<repository>/gopuram-invite/reception.html`

## 2. See it on your computer

For the most faithful preview (same fonts as your guests see):

1. Open a terminal in this folder (in VS Code: right-click the `gopuram-invite` folder and choose **Open in Integrated Terminal**).
2. Run `python -m http.server 8080`
3. Open <http://localhost:8080> (Muhurtha + Reception) and <http://localhost:8080/reception.html> (Reception only).
4. Press `Ctrl+C` in the terminal to stop.

Tips:

- After you edit `config.js`, save it and refresh the page (`Ctrl+F5` if you do not see the change).
- Add `?skip` to the address, for example <http://localhost:8080/?skip>, to jump straight past the heart and see the pages without waiting.
- Double-clicking `index.html` also opens it, but Chrome and Edge do not load fonts from a file on your disk, so the lettering looks plainer. Use the steps above or publish it to judge the real look.

## 3. Change the times, venue and map link

Open `config.js` and find the `events` list. Each box on the second page is one block:

```js
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
```

Keep the quotes `' '` and the commas exactly as they are. Lines that start with `//` are notes, not settings.

| Line | What to write | Example |
| --- | --- | --- |
| `date` | The day as `YYYY-MM-DD`. The page writes it out as "Friday, 19 February 2027". | `'2027-02-19'` |
| `timeText` | A few words shown **until you know the exact time**. | `'Morning'`, `'Evening'` |
| `startTime` | The exact start in **24-hour time**. | `'09:30'` |
| `endTime` | Optional end time, same style. | `'11:00'` |
| `venueName` | The hall or venue. | `'Venue name'` |
| `address` | Street, area, city. | `'Street, Area, City'` |
| `mapUrl` | A Google Maps **Share** link. Adds a **View on map** button. | `'https://maps.app.goo.gl/...'` |
| `note` | An extra line at the bottom of the box (parking, dress code...). | `'Lunch will be served'` |

**To set the time later**, fill `startTime` (and `endTime` if you like). Once `startTime` has a value, the page shows the real time and stops showing `timeText`:

```js
timeText: 'Morning',     // not shown any more once startTime is filled
startTime: '09:30',      // on its own it shows "9:30 AM onwards"
endTime: '11:00',        // with an end time it shows "9:30 AM - 11:00 AM"
```

24-hour times, for reference:

| Time | Write | Time | Write |
| --- | --- | --- | --- |
| 6:00 AM | `'06:00'` | 4:00 PM | `'16:00'` |
| 9:30 AM | `'09:30'` | 6:30 PM | `'18:30'` |
| 11:00 AM | `'11:00'` | 7:30 PM | `'19:30'` |
| 12:00 noon | `'12:00'` | 9:00 PM | `'21:00'` |

What guests see in each row: the **date** (or "Details to follow"), the **time** (the exact time, otherwise `timeText`, otherwise "Details to follow") and the **venue** (or "Details to follow"). Leave a line `''` until the families confirm it. Do not publish details that are not final.

Every box that has a `date` also gets **Google Calendar** and **Apple / Outlook** buttons. With a `startTime` they add a timed event; without one they add an all-day event.

Right now both boxes are on 19 February 2027: Muhurtha in the morning and Reception in the evening.

## 4. Change which boxes each version shows

Further up in `config.js`, the `versions` block decides what `index.html` and `reception.html` show:

```js
versions: {
  both: {                       // index.html
    events: ['muhurtha', 'reception'],   // the boxes, in this order
    invite: 'invite you to bless and celebrate their wedding',
    title: 'Wedding Invitation',
  },
  reception: {                  // reception.html
    events: ['reception'],
    invite: 'invite you to join them for their wedding reception',
    title: 'Reception Invitation',
  },
},
```

- To swap the order of the boxes, swap the words inside `events: [...]`.
- `invite` is the line under the two names on the second page, `title` is the name on the browser tab.
- Need a third version (for example only the Muhurtha)? Copy `reception.html` to a new name such as `muhurtha.html`, change `data-version="reception"` at the top of the new file to `data-version="muhurtha"`, and add a matching `muhurtha: { ... }` block under `versions`.

## 5. Add your music

No music is included. Until you add your song, a soft built-in tune plays so that the round button already works.

1. Get a song you are allowed to use (you own it, you have permission, or it is properly licensed). A soft instrumental that loops well suits the invitation. Do not use film or album recordings without permission, because this website is public.
2. Save it as an **MP3** named `music.mp3` in the folder `assets/audio/` (the path is `assets/audio/music.mp3`).
3. Refresh the page. The next time you draw the heart, your song fades in softly and the round button in the top-right corner turns it off and on.

Keep the file small so it loads quickly on a phone: a 3 to 4 minute song at 128 kbps is about 3 to 4 MB. The song repeats until the guest turns it off.

If you use a different file name, write it in `config.js`:

```js
music: {
  enabled: true,                      // false removes the music button completely
  src: 'assets/audio/music.mp3',      // the path of your song
  volume: 0.45,                       // starting volume, 0 (silent) to 1 (full)
  autoStart: true,                    // true = starts once the heart is drawn; false = only when the guest taps the button
  ambientIfMissing: true,             // true = the built-in tune plays until your song exists; false = silence until then
},
```

Notes:

- Phones only allow sound after a touch, so the music starts when the guest draws the heart. It never starts by itself.
- iPhones ignore the `volume` setting; guests use the phone's volume buttons (and the silent switch must be off).
- If your song file is missing, your browser's developer console may show a harmless "404" for `music.mp3`.

## 6. Change names, wording and pictures

**Names and date.** In `config.js`: `couple` (the two names) and `wedding.date` (the day on the first page, written `YYYY-MM-DD`).

**Wording.** Everything guests read is under `text` in `config.js`: the "Draw a heart" words, "are getting married", the Kannada blessing, "Together with their families", "With love and blessings", the button names and "Details to follow".

**Pictures.** All pictures are in the `assets` folder. To change one, save your new file **over** the old one with the **same name and the same shape**:

| File | What it is | Shape |
| --- | --- | --- |
| `clouds.webp` | the blue sky and clouds (first page) | tall, 2 : 3 (1355 x 2048) |
| `gopuram.webp` | the gopuram, transparent background | the same 1355 x 2048 canvas as the sky |
| `leaves.webp` | the trees in front, transparent background | the same 1355 x 2048 canvas as the sky |
| `venkatramana.webp` | the Venkatramana logo above the names | transparent background |
| `frame-top.webp`, `frame-tile.webp`, `frame-bottom.webp` | the temple doorway on the second page, cut in three so it can grow to fit the words | all the same width (1365) |
| `share.jpg` | the picture in the WhatsApp link preview | 1200 x 630 |

The sky, the gopuram and the trees must stay on the same canvas so they line up. Use only artwork you have the right to publish (for example artwork you bought with a template). WebP is best: sharp and small.

## 7. Put it online and share it

The simplest way is **GitHub Pages**, using the repository you already have (`Wedding`, branch `Main`).

1. In VS Code open **Source Control**, stage the `gopuram-invite` folder, write a message such as "Gopuram invitation", **Commit**, then **Sync Changes** (push).
2. On GitHub open the repository, then **Settings > Pages**, choose **Deploy from a branch**, pick the branch `Main` and the `/ (root)` folder, and save. After a minute the site is live.
3. Your two links are:
   - `https://<your-user>.github.io/<repository>/gopuram-invite/` (Muhurtha and Reception)
   - `https://<your-user>.github.io/<repository>/gopuram-invite/reception.html` (Reception only)

   GitHub shows the exact address at the top of **Settings > Pages**. For this repository it should be `https://nandeeshdharmalingam.github.io/Wedding/gopuram-invite/`.
4. Open **both** links on your own phone before you share them (see section 8).

Every time you change `config.js` or a picture, commit and push again, wait a minute and refresh.

The first design (the `index.html` at the top of the repository and the `draw-a-heart` folder) is not touched. If you want the gopuram invitation at the main address instead, copy the **contents** of this folder into the top of the repository (or into `wedding-gh-pages`) instead of the folder itself, and the links become `.../` and `.../reception.html`.

**Link preview in WhatsApp.** WhatsApp shows a picture only if it is given the **full** web address of it. After you publish, open `index.html` and `reception.html`, find the line

```html
<meta property="og:image" content="assets/share.jpg">
```

and replace `assets/share.jpg` with the full address, for example `https://nandeeshdharmalingam.github.io/Wedding/gopuram-invite/assets/share.jpg`. Commit and push. WhatsApp remembers a link's preview for a while, so test with a fresh link.

## 8. Check it on a phone

The best test is the real thing: publish, then open both links on your phone (an iPhone in Safari and an Android phone in Chrome if you can). To test before publishing, run `python -m http.server 8080 --bind 0.0.0.0` in this folder, find your computer's address with `ipconfig` (the "IPv4 Address", for example 192.168.1.20) and open `http://192.168.1.20:8080` on a phone on the same Wi-Fi. Allow Python through the firewall for private networks only, and press `Ctrl+C` to stop when you are done.

Check these, in order:

1. The invitation opens on the dark blue "Draw a heart" screen with no sound.
2. Draw the heart with a finger. It turns gold, then pink as it floats up between the names while clouds drift away. The page does not wobble or scroll while you draw.
3. The music fades in (or the round button turns it on), and the button turns it off again.
4. The first page shows the logo, **Nandeesh**, the pink heart, **Sampreetha**, the date and the whole gopuram, with only a little of the trees at the bottom corners. Scroll or tap **Scroll**: it feels like falling out of the sky, the gopuram and trees rise past the names, and the second page slides up over them.
5. The second page shows the right boxes (Muhurtha and Reception on `index.html`, Reception only on `reception.html`) with the right date and time.
6. **Google Calendar**, **View on map** and **Apple / Outlook** work.

## 9. Troubleshooting

| Problem | What to try |
| --- | --- |
| The heart will not draw | Follow the dotted heart slowly. After a few seconds a button **Tap to draw it for me** appears. |
| A change does not show | Save the file, then refresh with `Ctrl+F5`. Online: commit, push, wait a minute, refresh. |
| No music | Check the file is exactly `assets/audio/music.mp3` (or that `music.src` matches its name). iPhones also need the silent switch off and the volume up. |
| The built-in tune plays instead of my song | The song file was not found. Check the name and the folder. |
| Plain lettering | You opened the file by double-clicking. Use the preview in section 2 or the published link. |
| The page is too busy on an old phone | In `config.js` set `effects.animations: false` for a still, calm page. Guests who choose "Reduce motion" on their phone get that automatically. |
| A box says "Details to follow" | That line in `config.js` is still `''`. Fill it in (section 3). |

## 10. What is in this folder

```text
gopuram-invite/
├─ index.html           the invitation: Muhurtha + Reception
├─ reception.html       the same invitation: Reception only
├─ config.js            names, date, times, venues, wording, music (EDIT THIS)
├─ README.md            this guide
├─ css/styles.css       colours, layout and animations
├─ js/                  the code that runs the page
│  ├─ gate.js           the "draw a heart" screen
│  ├─ main.js           the opening, the scrolling and the event boxes
│  ├─ audio.js          the music button
│  ├─ art.js            the clouds, stars and rangoli drawn in code
│  └─ calendar.js       the "add to calendar" buttons
└─ assets/
   ├─ audio/            PUT YOUR MUSIC HERE (music.mp3)
   ├─ fonts/            Cormorant Garamond and Great Vibes
   ├─ clouds.webp, gopuram.webp, leaves.webp, venkatramana.webp
   ├─ frame-top.webp, frame-tile.webp, frame-bottom.webp
   └─ share.jpg, favicon.svg
```
