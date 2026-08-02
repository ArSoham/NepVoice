# NepVoice — Phase 3

This phase adds a proper post-scan AI summary experience, keeps Gemini prompts compact for lower token usage, and improves the Expo/mobile setup for a more polished demo.

## What changed
- Added a dedicated AI summary screen with overview, key points, and next steps after a scan.
- Made the backend prompt sizes smaller to stay friendly to free-tier token limits.
- Wired the frontend to store and display the richer summary payload.
- Updated Expo app metadata and gitignore rules for smoother local development.

## Run the backend
1. Open a terminal in the backend folder.
2. Create and activate a virtual environment.
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the example environment file and edit it if needed:
   ```bash
   copy .env.example .env
   ```
5. Start the Flask server:
   ```bash
   python wsgi.py
   ```
6. The API will be available at http://localhost:5000.

## Connect the frontend to the backend
In the frontend constants file, update the base URL to your computer's LAN IP when testing on a physical phone.

Example:
```ts
export const API_BASE_URL = 'http://192.168.1.83:5000';
```

Use these rules:
- iOS Simulator: http://localhost:5000
- Android Emulator: http://10.0.2.2:5000
- Physical phone: http://YOUR_LAN_IP:5000

## Run the frontend in Expo Go
1. Open the frontend folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Expo:
   ```bash
   npx expo start
   ```
4. Open the QR code in Expo Go on your phone.

## Database notes
The project currently uses SQLite by default, so no separate database server is required for local development.
If you want to switch later, update the DATABASE_URL value in backend/.env to a PostgreSQL connection string.
