# Game Box 🎮

Two small browser games built to work with a Bluetooth gamepad (made for a Kreo Mirage, but any controller works).

- **Blob Maze** (`maze.html`): eat every berry and stay away from the grumpy bugs. Grab a 🌈 and the bugs get scared, so you can catch them.
- **Dig & Load** (`dig.html`): a construction game with a digger, loader, bulldozer and crane. 8 jobs with stars, free play, a garage for upgrades, and a 2-player split-screen battle.
- **The Great Toot Marathon** (`race.html`): a wobbly physics race for 1–3 players in stacked split screen. Players can use their phones as controllers (`pad.html`, join with the 4-digit code or QR).
- **Toot Tub Rapids** (`tub.html`): a 3D co-op river ride (three.js). Up to 3 players share one bubble-bath tub; each controls a toot jet, so you must toot together to go straight. Phones work as controllers.
- **Star Catcher** (`stars.html`): catch falling stars, collect hearts, dodge rocks.

## Playing with the controller
1. Pair the controller with your computer over Bluetooth (it should show up as a gamepad / Xbox-style controller).
2. Open `index.html` in Chrome or Edge.
3. Press any button on the controller so the browser detects it.
4. D-pad or left stick moves, **A** selects or jumps, **Start** pauses.

**Sound:** sound effects and music are built in. Click the page once to turn sound on (browsers require this). **R1** (or **M** on the keyboard) turns sound on or off.

Keyboard works too: arrow keys or WASD, Space, Enter.

## Phone controllers
`race.html` shows a 4-digit code and QR code. Players open `pad.html` on their phone and enter the code. The connection uses WebRTC via [PeerJS](https://peerjs.com) (bundled in `vendor/`, MIT licence). 3D uses [three.js](https://threejs.org) (`vendor/three.module.min.js`, MIT licence), whose free public server only introduces the devices. Add `?local` to both URLs to test with two tabs in one browser.
