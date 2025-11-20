import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AnalysisResult } from '../models/scan.model';
import { ThermalData } from '../models/thermal.model';

interface VertexAIResponse {
  predictions: Array<{
    diagnosis?: string;
    confidence?: number;
    affected_areas?: Array<{
      name: string;
      location: { x: number; y: number; width: number; height: number };
      severity: number;
      temperature: number;
    }>;
    recommendations?: string[];
    severity?: string;
    requires_veterinary_attention?: boolean;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class AiAnalysisService {
  private readonly apiKey =
    'AQ.Ab8RN6JOAbfKoMu-2v7p4fZhJtU8sqeQ0BxIw0tFKYhaZF0eAQ';
  private readonly projectId = 'prj-bison-3097627891-rindern';
  private readonly location = 'us-central1';

  constructor(private http: HttpClient) {}

  /**
   * Analyze thermal image using Vertex AI
   */
  async analyze(
    imageBlob: Blob,
    thermalData?: ThermalData
  ): Promise<AnalysisResult> {
    console.log('AI Analysis Service - analyze() called');
    console.log('Image blob size:', imageBlob.size, 'type:', imageBlob.type);

    try {
      // Convert blob to base64
      console.log('Converting blob to base64...');

      const base64Image = await this.blobToBase64(imageBlob);
      console.log('Base64 conversion complete, length:', base64Image.length);

      // Gemini API endpoint - using Gemini 2.5 Pro for better analysis
      const url = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/gemini-2.5-pro:generateContent?key=${this.apiKey}`;
      console.log('Gemini API URL:', url);

      // Prepare Gemini request payload
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Du bist ein Experte für Klauengesundheit und Infrarotdiagnostik bei Rindern.

⚠️ SCHRITT 0: BILDVALIDIERUNG (VERPFLICHTEND)

Prüfe ZUERST, ob das Bild tatsächlich eine Rinderklaue oder ein Rinderbein zeigt:
- Ist eine Klaue/Huf erkennbar?
- Zeigt das Bild ein Rinderbein?
- Ist es ein Thermalbild/FLIR-Aufnahme?

Falls NICHT → Gib sofort dieses JSON zurück und STOPPE die Analyse:
{
  "diagnosis": "Ungültiges Bild",
  "confidence": 0,
  "severity": "none",
  "summary": "Das Bild zeigt keine Rinderklaue. Bitte fotografieren Sie die Klaue des Tieres.",
  "affected_areas": [],
  "recommendations": ["Neues Bild von der Klaue aufnehmen"],
  "requires_veterinary_attention": false,
  "uncertainties": "Kein Klauenbild erkennbar"
}

Falls JA → Fahre mit der Analyse fort.

Analysiere das folgende FLIR-Infrarotbild einer Kuhklaue sehr präzise. Verwende unbedingt die typische FLIR-Farbskala zur Interpretation.

🎨 A) FLIR-Farbskala korrekt interpretieren

Nutze folgende Farbbedeutungen:
- Weiss / Gelb → heisseste Bereiche
- Orange → sehr warm
- Rot → warm
- Magenta / Pink → mild
- Lila / Violett → kühl
- Blau / Schwarz → sehr kalt (Hintergrund)

Bewerte relative Temperaturunterschiede, keine absoluten °C.

🦶 B) Anatomie im Bild identifizieren

Analysiere:
- Zehenspitzen
- Sohle
- Ballen
- Zwischenklauenspalt
- Kronrand
- dorsale/plantare Seite
- Links/Rechts-Asymmetrie
- Form- oder Strukturabweichungen

Wenn etwas wegen Kamerawinkel/Schmutz/Nässe schwer erkennbar ist → bitte klar erwähnen.

🔥 C) Temperaturmuster erkennen

Finde:
- Hotspots (weiss/gelb)
- lokale Hitzeinseln (punktförmig)
- ringförmige Erwärmung
- grossflächige Erwärmung
- asymmetrische Hitze
- Temperaturverlauf über Zehe → Ballen

🦠 D) Prüfe auf folgende Klauenkrankheiten

Digitale Dermatitis (Mortellaro)
→ heisser Zwischenklauenspalt, symmetrische Erwärmung

Sohlengeschwür
→ klar lokalisierter Hotspot an der Sohle

Abszess
→ kleine, sehr helle punktförmige Hitze

Klauenrehe (Laminitis)
→ gleichmässig warme Klaue, Zehenbereich stark

Kronrandentzündung
→ warmes Band am Kronrand

Weitere Krankheiten: Moderhinke, Weisse-Linie-Defekt, Ballenfäule

📊 E) Ausgabeformat (verpflichtend)

Antworte NUR mit JSON (keine Markdown-Codeblöcke, keine Erklärungen):

{
  "diagnosis": "Name der Krankheit oder 'gesund'",
  "confidence": 85,
  "severity": "none/mild/moderate/severe",
  "temperature_zones": "Beschreibung der Temperaturzonen mit Farbbedeutung",
  "disease_probability_scores": {
    "Digitale Dermatitis": 75,
    "Sohlengeschwür": 10,
    "Klauenrehe": 5
  },
  "lameness_probability": 65,
  "urgency_level": 2,
  "summary": "Kurze Zusammenfassung der Analyse",
  "affected_areas": [{"name": "Bereich", "severity": 3, "temperature": 38}],
  "recommendations": ["Handlungsempfehlung 1", "Handlungsempfehlung 2"],
  "uncertainties": "Bildfaktoren die die Bewertung erschweren (Winkel, Schmutz, etc.)",
  "requires_veterinary_attention": true
}

Dringlichkeitslevel:
0 = kein Befund
1 = mild – beobachten
2 = mittleres Risiko – Kontrolle empfohlen
3 = hoch – Klauenpfleger / Tierarzt nötig

WICHTIG:
- Antworte IMMER auf DEUTSCH
- "confidence" und Wahrscheinlichkeiten sind Werte zwischen 0-100
- Handlungsempfehlungen kurz, klar, landwirtfreundlich
- Wenn die Klaue gesund aussieht, verwende "gesund" als diagnosis`,
              },
              {
                inline_data: {
                  mime_type: imageBlob.type || 'image/jpeg',
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
        },
      };

      console.log('Making HTTP request to Gemini...');
      const response = await firstValueFrom(this.http.post<any>(url, payload));
      console.log('Gemini response received:', response);

      // Parse Gemini response
      return this.parseGeminiResponse(response);
    } catch (error: any) {
      console.error('Gemini analysis error:', error);
      console.log('Falling back to mock data');

      // Return mock result for POC if API fails
      return this.getMockAnalysisResult();
    }
  }

  /**
   * Convert Blob to base64 string
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Parse Gemini response into AnalysisResult
   */
  private parseGeminiResponse(response: any): AnalysisResult {
    try {
      // Extract text from Gemini response
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('Gemini text response:', text);

      // Remove markdown code blocks if present
      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '');

      // Try to extract JSON from the response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);

        // Normalize confidence to 0-1 range (Gemini might return 0-100 or 0-1)
        let confidence = parsedData.confidence || 0;
        if (confidence > 1) {
          confidence = confidence / 100; // Convert 75 to 0.75
        }

        return {
          diagnosis: parsedData.diagnosis || 'Unbekannt',
          confidence: confidence,
          summary: parsedData.summary || '',
          affectedAreas: parsedData.affected_areas || [],
          recommendations: parsedData.recommendations || [],
          severity: this.mapSeverity(parsedData.severity),
          requiresVeterinaryAttention:
            parsedData.requires_veterinary_attention || false,
          temperatureZones: parsedData.temperature_zones,
          diseaseProbabilityScores: parsedData.disease_probability_scores,
          lamenessProbability: parsedData.lameness_probability,
          urgencyLevel: parsedData.urgency_level,
          uncertainties: parsedData.uncertainties,
        };
      }

      // If no JSON found, return mock data
      console.warn('No JSON found in Gemini response, using mock data');
      return this.getMockAnalysisResult();
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return this.getMockAnalysisResult();
    }
  }

  /**
   * Map severity string to severity type (handles German and English)
   */
  private mapSeverity(
    severity?: string
  ): 'none' | 'mild' | 'moderate' | 'severe' {
    if (!severity) return 'none';

    const lower = severity.toLowerCase();

    // German mappings
    if (lower.includes('keine') || lower.includes('gesund')) return 'none';
    if (lower.includes('leicht') || lower.includes('gering')) return 'mild';
    if (lower.includes('mittel') || lower.includes('mässig')) return 'moderate';
    if (lower.includes('schwer') || lower.includes('stark')) return 'severe';

    // English mappings (fallback)
    if (lower.includes('none')) return 'none';
    if (lower.includes('mild')) return 'mild';
    if (lower.includes('moderate')) return 'moderate';
    if (lower.includes('severe')) return 'severe';

    return 'none';
  }

  /**
   * Mock analysis result for POC testing
   */
  private getMockAnalysisResult(): AnalysisResult {
    return {
      diagnosis: 'gesund',
      confidence: 0.92,
      summary: 'Die Klaue zeigt keine Anzeichen von Krankheiten oder Verletzungen. Die Hornqualität ist gut und die Anatomie ist normal.',
      affectedAreas: [],
      recommendations: [
        'Regelmässige Klauenpflege fortsetzen',
        'Auf Veränderungen im Gang oder Verhalten achten',
        'Nächste Kontrolle in 3 Monaten einplanen',
      ],
      severity: 'none',
      requiresVeterinaryAttention: false,
    };
  }
}
