# 🚀 NeuraChat

> A production-ready multi-agent AI platform built with LangGraph, LangChain, FastAPI, and Next.js.

NeuraChat orchestrates specialized AI agents, supports multiple LLM providers and user-configurable API keys, and delivers fast, context-aware AI conversations with streaming responses and tool calling.

---

## ✨ Features

- 🤖 Multi-agent architecture powered by LangGraph
- 🧠 Intelligent request routing
- 💬 Real-time streaming responses
- 🔧 Tool calling
- 🔑 User-configurable API keys
- 🌐 Multiple LLM providers
- 📚 Conversation management
- 🔒 Clerk authentication
- ⚡ FastAPI backend
- 🎨 Modern Next.js frontend
- 🗄️ PostgreSQL database
- 📈 Production-ready architecture

---

## 🏗️ Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Clerk

### Backend

- FastAPI
- LangGraph
- LangChain
- SQLAlchemy
- PostgreSQL
- AsyncPG
- Pydantic

### AI Providers

- OpenAI
- Google Gemini
- Groq

---

## 📂 Project Structure

```text
NeuraChat
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   ├── config/
│   │   ├── features/
│   │   ├── helpers/
│   │   ├── jobs/
│   │   └── main.py
│   ├── run.py
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── types/
│
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ArhamKhan45/NeuraChat.git
cd NeuraChat
```

---

### 2. Backend Setup

```bash
cd backend

python -m venv .venv

source .venv/bin/activate      # Linux / macOS
# .venv\Scripts\activate       # Windows

pip install -r requirements.txt

python run.py
```

---

### 3. Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=
CLERK_SECRET_KEY=
BACKEND_API_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_BACKEND_API_URL=
NEXT_PUBLIC_CLERK_TELEMETRY_DISABLED=1
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
```

---

## 📌 Roadmap

- ✅ Multi-agent architecture
- ✅ Conversation management
- ✅ Streaming responses
- ✅ Tool calling
- ✅ Multiple LLM providers
- ✅ Clerk authentication
- ⏳ Retrieval-Augmented Generation (RAG)
- ⏳ Local LLM support
- ⏳ File upload & knowledge base
- ⏳ Web search integration

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature/my-feature
```

3. Commit your changes.

```bash
git commit -m "Add new feature"
```

4. Push to your branch.

```bash
git push origin feature/my-feature
```

5. Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## ⭐ Support

If you find NeuraChat helpful, consider giving this repository a ⭐ to support the project.
