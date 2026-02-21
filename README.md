
# Synapse Sensory Assistant
> Tap anywhere → Synapse becomes your eyes in real time, or connects you to a human instantly if AI isn’t confident.

<div align="center">
  <img  alt="GHBanner" src="https://drive.google.com/uc?export=view&id=1R9NR5X5wk0JhubLhCN-RoVF36gexbFys" />
</div>
<p align="center">
  <a href="https://www.linkedin.com/in/adina-abrar" target="_blank">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg" width="45" style="margin: 0 10px;"/>
  </a>
  <a href="https://www.kaggle.com/adinaabrar" target="_blank">
    <img src="https://upload.wikimedia.org/wikipedia/commons/7/7c/Kaggle_logo.png" width="45" style="margin: 0 10px;"/>
  </a>
  <a href="https://github.com/Adina-Abrar" target="_blank">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" width="45" style="margin: 0 10px;"/>
  </a>
  <a href="mailto:adinaabrar1111@gmail.com">
    <img src="https://upload.wikimedia.org/wikipedia/commons/4/4e/Gmail_Icon.png" width="45" style="margin: 0 10px;"/>
  </a>
</p>

##  Live Demo
 Web App: https://synapse-sensory-assistant.vercel.app  
 YouTube Demo: https://youtu.be/jNYjTjF_akw 

---

##  Overview
**Synapse** is an AI-powered multimodal assistant designed to help visually impaired users understand and navigate their surroundings through real-time audio guidance.

Instead of simply detecting objects, Synapse translates vision into **spatial understanding**:

> “Obstacle slightly to your right, two steps ahead.”

---

##  Inspiration
Synapse was born from a simple realization:  
Most “smart” systems assume the user can see the screen.

This project explores how AI can translate vision into understanding — not images — enabling independence through audio-first interaction.

---

##  Key Features
-  Real-time environment understanding  
-  Directional audio feedback (left / right / near / far)  
-  Context-aware narration (no information overload)  
-  Tap-based activation (no visual navigation needed)  
-  Conversational guidance  
-  Human fallback when AI confidence is low  

---

## How It Works

Camera + Audio Input → Gemini Multimodal Reasoning → Spatial Audio Feedback

Synapse analyzes surroundings and provides concise, spatially-aware audio instructions.

---

##  Tech Stack
- React.js  
- Node.js & Express  
- Google AI Studio (Gemini API)  
- Computer Vision  
- Speech Synthesis  
- Vercel Deployment  

---

##  Challenges
- Avoiding audio overload  
- Translating vision into spatial meaning  
- Designing for users who cannot see the interface  
- Balancing hackathon scope with usability  

---

##  Impact
Synapse demonstrates how AI can restore independence by adapting to human needs rather than forcing users to adapt to technology.

---


## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
