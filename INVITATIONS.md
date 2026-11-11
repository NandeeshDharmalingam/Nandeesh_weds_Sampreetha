# Nandeesh & Sampreetha - invitations (gopuram design)

Four invitations: one pair for each family, and each pair has a **Muhurtha + Reception** version and a **Reception only** version. Each side is a complete folder, so both sides can be hosted at the same time, or one side can be handed to its family on its own. It is a plain website (HTML, CSS, a little JavaScript): nothing to install, nothing to build.

## 1. Which folder is which

```text
Wedding eInvite/
├─ nandeesh-side/                  Nandeesh's family
│  ├─ muhurtha-reception/          invitation: Muhurtha + Reception
│  ├─ reception/                   invitation: Reception only
│  ├─ config.js                    EDIT THIS: names, parents, times, venues, wording, music
│  ├─ assets/audio/                PUT YOUR SONG HERE (music.mp3)
│  └─ assets/, css/, js/           pictures and code used by the two invitations above
├─ sampreetha-side/                Sampreetha's family: exactly the same layout
└─ gopuram-invite/                 the earlier single-folder version (delete it once you are happy with the two sides)
```

The `config.js` of a side controls **both** invitations of that side. The two sides do not affect each other, so each family can have its own venue, time, parents and music. On Nandeesh's side Nandeesh is named first; on Sampreetha's side Sampreetha is named first (page 1, page 2 with her parents first, the browser tab and the calendar entries). The older designs at the top of the repository (`index.html`, `css`, `js`, `public`, `draw-a-heart`) are not touched.

## 2. See them on your computer

1. Open a terminal and go to the repository folder, then start the server:

   ```text
   cd "c:\Nandeesh\wedding\Wedding eInvite"
   python -m http.server 8081 --bind 127.0.0.1
   ```

2. Open the invitation you want:

   | Side | Guests invited to | Address |
   | --- | --- | --- |
   | Nandeesh | Muhurtha + Reception | <http://localhost:8081/nandeesh-side/muhurtha-reception/> |
   | Nandeesh | Reception only | <http://localhost:8081/nandeesh-side/reception/> |
   | Sampreetha | Muhurtha + Reception | <http://localhost:8081/sampreetha-side/muhurtha-reception/> |
   | Sampreetha | Reception only | <http://localhost:8081/sampreetha-side/reception/> |

3. Press `Ctrl+C` in the terminal to stop.

All four are live at the same time. Add `?skip` to an address to jump past the heart. After editing `config.js`, save it and refresh (`Ctrl+F5` if nothing changes). Double-clicking an `index.html` does not give the real look (browsers do not load fonts from a file on disk), so use the server.

## 3. What to change

Everything is in the `config.js` of the side you are editing. Keep the quotes `' '` and the commas as they are; lines starting with `//` are notes.

**Parents.** The `families` block, under each name on the second page:

```js
families: {
  groom: { relation: 'son of', parents: 'Smt. Saritha D & Sri. Dharmalingam M' },
  bride: { relation: 'daughter of', parents: 'Smt. Sudha B & Sri. Dr. M S Sudheer Kumar' },
},
```

Write the parents the way you want them to appear, with `&` between the two names. `''` hides that line.

**Times, venue and map link.** The `events` list has one block per box (`muhurtha`, `reception`):

| Line | What to write | Example |
| --- | --- | --- |
| `date` | The day as `YYYY-MM-DD` | `'2027-02-19'` |
| `timeText` | A few words shown **until you know the exact time** | `'Morning'`, `'Evening'` |
| `startTime` | The exact start in **24-hour time**. Once filled, `timeText` is not shown | `'09:30'` |
| `endTime` | Optional end, same style | `'11:00'` |
| `venueName`, `address` | The hall and the street, area, city | `'Venue name'` |
| `mapUrl` | A Google Maps **Share** link; adds a **View on map** button | `'https://maps.app.goo.gl/...'` |
| `note` | An extra line at the bottom of the box | `'Lunch will be served'` |

24-hour times: 9:30 AM is `'09:30'`, 12:00 noon is `'12:00'`, 4:00 PM is `'16:00'`, 7:30 PM is `'19:30'`. A line left as `''` shows "Details to follow", so leave it empty until the family confirms it. Every box that has a `date` also gets **Google Calendar** and **Apple / Outlook** buttons.

**Which boxes each invitation shows.** The `versions` block: `both` is the `muhurtha-reception` folder, `reception` is the `reception` folder. Each has its own `events` list (the boxes, in this order), the `invite` line under the names and the browser-tab `title`.

**Music.** No music is included; until you add a song, a soft built-in tune plays so the round button works. Save your song as `music.mp3` in that side's `assets/audio/` folder (use music you own or have permission to use, because the page is public). A "404" for `music.mp3` in the browser console is harmless. If the file has another name, change `music.src` in `config.js` (it starts with `../` because it is written from inside the invitation folders).

**Names, wording and pictures.** `couple` and `wedding.date` are at the top. In `couple`, `first: 'groom'` puts Nandeesh first and `first: 'bride'` puts Sampreetha first. That setting does not change the `<title>` and `og:title` lines in the two `index.html` files of the side, or the names drawn in `share.jpg` (what WhatsApp shows); those are set separately. All other words are under `text`. To change a picture, save the new file over the old one in the side's `assets` folder, with the same name and shape:

| File | What it is | Shape |
| --- | --- | --- |
| `clouds.webp`, `gopuram.webp`, `leaves.webp` | the three layers of the first page | all the same tall canvas, 1355 x 2048 (gopuram and leaves transparent) |
| `venkatramana.webp` | the logo above the names | transparent background |
| `frame-top.webp`, `frame-tile.webp`, `frame-bottom.webp` | the temple doorway on the second page | all 1365 wide |
| `share.jpg` | the picture in a WhatsApp link preview | 1200 x 630 |

Use only artwork you have the right to publish.

## 4. Put them online later

Any host for plain files works, and each side folder can be hosted on its own: its two links then end in `/muhurtha-reception/` and `/reception/`. With **GitHub Pages** on this repository (branch `Main`, `/ (root)`), the links are:

- `https://nandeeshdharmalingam.github.io/Wedding/nandeesh-side/muhurtha-reception/` and `.../nandeesh-side/reception/`
- `https://nandeeshdharmalingam.github.io/Wedding/sampreetha-side/muhurtha-reception/` and `.../sampreetha-side/reception/`

GitHub Pages needs a public repository on the free plan (a private one needs a paid plan, or another host such as Cloudflare Pages), and the published pages are public either way. The remote and branch are called `Origin` and `Main` (with capitals):

```text
git add nandeesh-side sampreetha-side
git commit -m "Invitations for both sides"
git push -u Origin Main
```

For WhatsApp to show a picture in the link preview, change the line `<meta property="og:image" content="../assets/share.jpg">` in each of the four `index.html` files to the full address, for example `https://nandeeshdharmalingam.github.io/Wedding/nandeesh-side/assets/share.jpg`.

## 5. If something looks wrong

| Problem | What to try |
| --- | --- |
| The heart will not draw | Follow the dotted heart slowly. After a few seconds **Tap to draw it for me** appears. |
| A change does not show | Save the file and refresh with `Ctrl+F5`. |
| The built-in tune plays, not my song | The file is not at `<side>/assets/audio/music.mp3`, or `music.src` has another name. |
| Plain lettering | The page was opened by double-clicking. Use the server in section 2. |
| A box says "Details to follow" | That line in `config.js` is still `''`. |
| Too busy on an old phone | Set `effects.animations: false` in `config.js`. |
