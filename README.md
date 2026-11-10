# NepVoice

### Understand documents. Hear what matters. In Nepali.

NepVoice is a voice-first mobile application that helps Nepali-speaking users understand everyday documents more easily.

Simply take a picture of a document, and NepVoice extracts the text, identifies its category, simplifies the information into conversational Nepali, and reads it aloud. Users can also ask follow-up questions using their voice.

I started this project with a simple idea: **important information should be understandable to everyone, regardless of their reading ability or familiarity with formal language.**

## Features

- **Document Scanning:** Capture documents using your phone's camera.
- **Text Extraction:** Extract text from images using Gemini Vision.
- **Document Classification:** Identify different types of documents.
- **Nepali Simplification:** Turn complex information into conversational Nepali.
- **Text-to-Speech:** Listen to simplified content.
- **Voice Interaction:** Ask questions about scanned documents.
- **Scan History & Insights:** Access previous scans and document summaries.

## How It Works

**Capture → Extract → Understand → Simplify → Listen → Ask**

1. Capture a document using the mobile application.
2. Preprocess the image and extract its text using Gemini.
3. Identify the document category.
4. Simplify its contents into conversational Nepali.
5. Generate audio using gTTS.
6. Ask follow-up questions using text or voice.

## Technology Stack

| Area | Technologies |
|---|---|
| Mobile | React Native, Expo, TypeScript |
| Backend | Python, Flask, REST APIs |
| AI | Google Gemini API |
| Speech | faster-whisper, gTTS |
| Database | SQLite, SQLAlchemy |
| Infrastructure | Docker, Docker Compose, Redis |

## Project Structure

```text
NepVoice/
├── backend/
│   └── app/
│       ├── api/
│       ├── models/
│       ├── prompts/
│       ├── services/
│       └── utils/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   └── services/
└── README.md
```

## Getting Started

**1. Clone the repository**

```bash
git clone https://github.com/ArSoham/NepVoice.git
cd NepVoice
```

**2. Set up the backend**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Add your Gemini API key to `.env`.

**3. Start the backend**

```bash
python wsgi.py
```

**4. Start the mobile application**

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Configure the backend URL in `frontend/constants/api.ts` according to your testing environment.

You can use Expo Go to run the application on a physical device.

## Current Limitations

NepVoice is still a work in progress. Some areas that need improvement include:

- Better Nepali speech recognition and text-to-speech.
- Improved OCR for low-quality document images.
- Offline support for low-connectivity environments.
- User authentication and stronger backend security.
- More reliable session and conversation persistence.

AI-generated summaries should always be verified, particularly for medical, legal, and other important information.

## Future Improvements

- Better Nepali language processing.
- Hands-free voice navigation.
- Improved document recognition.
- Offline functionality.
- Production-ready deployment and security.

## Author

**Soham Aryal**

[GitHub](https://github.com/ArSoham)

---

*Built with the goal of making everyday information easier to understand and access.*
