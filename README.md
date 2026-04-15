# Raja Mantri Chor Sipahi 👑🦸‍♂️🦹‍♂️👮

A modern, real-time web-based adaptation of the classic Indian childhood game "Raja Mantri Chor Sipahi". 

This application offers a seamless and responsive digital experience of the traditional 4-player social deduction game, featuring local, bot-based, and complete online multiplayer modes.

## 🌟 Features

- **Multiple Game Modes:**
  - **Local Play (Pass & Play):** Play together on a single device.
  - **Play vs Bots:** Practice or fill empty seats with AI opponents.
  - **Online Multiplayer:** Create sessions, share room codes, and play in real-time with friends anywhere.
- **Classic Gameplay Mechanics:**
  - Role drafting (Raja, Mantri, Chor, Sipahi).
  - The iconic interaction: *“Mantriji, chor ka pata lagao!”* (Minister, find out who the thief is!).
  - Proper scoring system and round tracking.
- **Beautiful & Modern UI:**
  - Smooth animations powered by Framer Motion.
  - Responsive design for optimal performance across all device sizes.
  - Vibrant, rich aesthetics and engaging game interactions.
- **Real-Time Communication:**
  - Seamless, low-latency multiplayer experience using WebSockets.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (Version 16+)
- **UI Library:** [React](https://react.dev/) (Version 19)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Backend Server:** Node.js & [Express](https://expressjs.com/)
- **Websockets:** [Socket.io](https://socket.io/)

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation & Running Locally

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd rmcs-game
   ```

2. **Install the dependencies:**
   ```bash
   npm install
   ```

3. **Start the custom development server:**
   Since this application requires a WebSocket server running alongside Next.js, use the custom dev server command:
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000) to start playing.

## 📜 How to Play

1. **The Roles & Scores:**
   - **Raja (King):** Always earns 1000 points. Acts as the judge.
   - **Mantri (Minister):** Earns 800 points for a correct guess, 0 if wrong.
   - **Sipahi (Police):** Defaults to 500 points (keeps identity secret while someone guesses).
   - **Chor (Thief):** Earns 800 points if the Mantri gets the guess wrong, otherwise 0 points.

2. **The Flow:**
   - At the beginning of the round, four roles are randomly distributed.
   - The **Raja** immediately declares their role and commands the Mantri: *"Mantriji, chor ka pata lagao!"*
   - The **Mantri** must deduce which of the two remaining unknown players is the Chor and which is the Sipahi.
   - Points are awarded based on the Mantri's success.
