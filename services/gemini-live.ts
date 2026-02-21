
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createBlob, decode, decodeAudioData } from './audio-utils';

const SYSTEM_INSTRUCTION = `
You are Synapse, a real-time sensory assistant for blind and low-vision users.
Convert camera and microphone signals into short, clear, safety-first guidance.

🎯 PRINCIPLES
- Use clock-face directions (e.g., “Obstacle at 2 o’clock”).
- Start hazards with “STOP” or “CAUTION”.
- Be brief. Never hallucinate.

👋 FLOW
On session start, ALWAYS say:
“Hello. I am Synapse, your sensory assistant for vision. To help you, I need access to your microphone and camera.”
Wait for user input. If they give access, announce: “Camera is on. Microphone is listening. I’m here with you.”
`;

export interface LiveHandlers {
  onTranscription: (text: string, role: 'user' | 'assistant') => void;
  onStatusChange: (status: string) => void;
  onError: (error: string) => void;
}

export class GeminiLiveSession {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private frameInterval: number | null = null;
  private activeSession: any = null;
  private activeStream: MediaStream | null = null;
  private isStopping = false;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async start(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    handlers: LiveHandlers
  ) {
    try {
      this.isStopping = false;
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { 
          facingMode: { ideal: 'environment' }, 
          width: { ideal: 1920, max: 3840 }, 
          height: { ideal: 1080, max: 2160 } 
        } 
      });

      this.activeStream = stream;
      videoElement.srcObject = stream;
      
      // Horizontal flip (scaleX -1) corrects the "mirror" behavior common in front-facing cameras
      // so that the preview appears as "real world" orientation to the user.
      videoElement.style.transform = 'scaleX(-1)';
      
      await videoElement.play();

      this.sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            handlers.onStatusChange('ACTIVE');
            this.sessionPromise?.then(session => {
              this.activeSession = session;
              this.startAudioStreaming(stream);
              this.startVideoStreaming(videoElement, canvasElement);
            });
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              handlers.onTranscription(message.serverContent.outputTranscription.text, 'assistant');
            } else if (message.serverContent?.inputTranscription) {
              handlers.onTranscription(message.serverContent.inputTranscription.text, 'user');
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && this.outputAudioContext && !this.isStopping) {
              this.playAudio(audioData);
            }

            if (message.serverContent?.interrupted) {
              this.stopAllAudio();
            }
          },
          onerror: (e) => {
            console.error("Live session error:", e);
            handlers.onError('SYSTEM LINK FAILURE');
            handlers.onStatusChange('ERROR');
          },
          onclose: () => {
            handlers.onStatusChange('IDLE');
            this.stop();
          },
        },
        config: {
          responseModalities: ['AUDIO'] as any,
          systemInstruction: SYSTEM_INSTRUCTION,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });

      return stream;
    } catch (err) {
      handlers.onError('INITIALIZATION ERROR: ' + (err as Error).message);
      handlers.onStatusChange('ERROR');
      throw err;
    }
  }

  private startAudioStreaming(stream: MediaStream) {
    if (!this.inputAudioContext || this.isStopping) return;

    const source = this.inputAudioContext.createMediaStreamSource(stream);
    const scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    scriptProcessor.onaudioprocess = (event) => {
      if (this.isStopping) return;
      const inputData = event.inputBuffer.getChannelData(0);
      const pcmBlob = createBlob(inputData);
      this.sessionPromise?.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(this.inputAudioContext.destination);
  }

  private startVideoStreaming(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.frameInterval = window.setInterval(() => {
      if (this.isStopping) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Clear and draw flipped to ensure the AI sees the "real world" 
      // instead of a mirrored view, which is critical for directional logic.
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      
      canvas.toBlob(async (blob) => {
        if (blob && !this.isStopping) {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            const base64Data = (reader.result as string).split(',')[1];
            if (!this.isStopping) {
              this.sessionPromise?.then((session) => {
                session.sendRealtimeInput({
                  media: { data: base64Data, mimeType: 'image/jpeg' }
                });
              });
            }
          };
        }
      }, 'image/jpeg', 0.85);
    }, 1500); 
  }

  private async playAudio(base64: string) {
    if (!this.outputAudioContext || this.isStopping || (this.outputAudioContext.state as any) === 'closed') return;

    try {
      this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
      const audioBuffer = await decodeAudioData(decode(base64), this.outputAudioContext, 24000, 1);
      
      if (this.isStopping || (this.outputAudioContext.state as any) === 'closed') return;

      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioContext.destination);
      source.addEventListener('ended', () => this.sources.delete(source));
      
      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.sources.add(source);
    } catch (e) {
      console.warn("Failed to play audio chunk:", e);
    }
  }

  private stopAllAudio() {
    this.sources.forEach((s) => {
      try { s.stop(); } catch (e) {}
    });
    this.sources.clear();
    this.nextStartTime = 0;
  }

  stop() {
    if (this.isStopping) return;
    this.isStopping = true;

    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }
    this.stopAllAudio();
    
    if (this.inputAudioContext && (this.inputAudioContext.state as any) !== 'closed') {
      this.inputAudioContext.close().catch(() => {});
    }
    this.inputAudioContext = null;

    if (this.outputAudioContext && (this.outputAudioContext.state as any) !== 'closed') {
      this.outputAudioContext.close().catch(() => {});
    }
    this.outputAudioContext = null;
    
    if (this.activeStream) {
      this.activeStream.getTracks().forEach(track => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {}
      });
      this.activeStream = null;
    }

    if (this.activeSession) {
      try {
        this.activeSession.close();
      } catch (e) {}
      this.activeSession = null;
    }
    
    this.sessionPromise = null;
  }
}
