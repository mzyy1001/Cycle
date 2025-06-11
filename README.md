
# 🚀 Project Cycle – Technical Overview

This project implements a full-stack mood tracking app with continuous deployment, cross-platform compatibility, and RESTful API support.

---

## 🔧 Tech Stack Summary

### 🖥️ Frontend (Web + Mobile)

* **Framework:** [React Native](https://reactnative.dev/)
* **Platform:** [Expo](https://expo.dev/)
* **Web Export:** `expo export --platform web`
* **CI/CD Host:** [Vercel](https://vercel.com/)
* **Deployment URL:** [https://cycle-theta.vercel.app](https://cycle-theta.vercel.app)

#### Environment Variables

* `EXPO_PUBLIC_API_BASE_URL=https://cycle-nzen.onrender.com`

---

### 🌐 Backend (REST API)

* **Framework:** [Express.js](https://expressjs.com/)
* **Language:** Node.js 18
* **Hosting Platform:** [Render](https://render.com/)
* **Deployment URL:** [https://cycle-1-4g2h.onrender.com](https://cycle-1-4g2h.onrender.com)

#### API Endpoints

* `GET /api/mood` – Returns an array of all mood entries
* `POST /api/mood` – Accepts `{ mood: string, timestamp: ISOString }`

---

### 🔁 Continuous Integration

#### GitHub Actions Workflows

* `.github/workflows/frontend.yml` → Web CI Build
* `.github/workflows/backend.yml` → Smoke Test + Build Check

#### Additional

* `vercel.json` → Controls Vercel web export and build output
* `render.yaml` → Defines Render auto-deploy for backend from monorepo

---

### ✅ Test Tooling

* `test_backend.sh` – Shell script to test API availability and correctness after deployment

---

## 📁 Project Structure

```
app/
├── backend/            # Express API service
├── frontend/           # Expo project for web and mobile
│   ├── vercel.json     # Vercel deploy configuration
├── test_backend.sh     # Smoke test after deployment
.github/
└── workflows/          # GitHub CI for frontend/backend
```

---




# Cycle: A Mood-Responsive Productivity App

## 🧠 Project Overview

**Cycle** is a mobile application designed to bridge the gap between productivity and mental well-being. Unlike rigid task management tools, Cycle adapts your daily schedule based on your current emotional state—helping you stay productive without burning out.

## 📚 Context and Knowledge Base

Our project addresses the rising issue of emotional fatigue and toxic productivity among students and young professionals, especially in a post-pandemic world. Many digital tools optimize for output but fail to consider the user’s mental health.

We bring interdisciplinary expertise in **computer science**, **psychology**, and **UX design**, alongside personal experiences navigating emotional ups and downs while managing deadlines. We also have access to:

- University mental health forums
- Peer productivity communities
- Early user testers for concept validation

## 👥 Target Users and Stakeholders

### 🎯 Primary Users

- **University students** dealing with stress, burnout, and deadline fatigue.
- **Young professionals**, especially in remote/hybrid roles, struggling with unstructured workdays.
- **Neurodivergent individuals** (e.g., ADHD) seeking tools for emotional regulation and routine.

### 🤝 Stakeholders

- Mental health advocates & university counsellors  
- Productivity coaches  
- Existing users of tools like Notion, Todoist, Headspace

### 📌 Example Personas

- **Ella**, 21: Final-year student, overwhelmed by coursework and anxiety. Uses to-do lists but feels guilty when off track.
- **Tom**, 26: Remote developer. Productivity collapses under emotional stress, leading to deadline anxiety.

## 🔍 User Research & Evidence

We conducted:

- **Informal interviews** with 5 students and 3 professionals  
- **Mood journaling trials** to observe productivity patterns  

> Key feedback:
> - “I push through even when I feel terrible, then crash and waste an entire day.”
> - “I never know how to pace my day when I wake up anxious.”
> - “Some apps make me feel worse when I miss tasks.”

## 💡 Insight & Analysis

Our core insight:  
> Emotional state **directly impacts** productivity rhythm, yet most tools treat all days equally.

Users want **structure with empathy**, not pressure.

### 🔑 Design Imperatives

1. Normalize mood check-ins—no guilt.
2. Adapt tasks and schedule to reduce overload.
3. Build long-term consistency over short-term hustle.

## ❗ Problem Statement

Most productivity apps ignore emotional well-being. This leads to burnout and negative self-perception when users can't meet rigid goals.

## 🌱 Opportunity Statement

**How might we** design a **mood-aware productivity app** that supports mental health while still encouraging meaningful progress?

## 📱 Initial Product Concept

- **Daily mood check-in** to guide planning
- **Adaptive to-do list** that scales workload to mental energy
- **Smart scheduling** to reduce decision fatigue on low-energy days
- **Integrated self-care suggestions**: micro-breaks, mindfulness, journaling
- **Pattern tracking** to reveal links between habits, mood, and productivity

---

> _Cycle helps users honor their emotions while staying in motion._
