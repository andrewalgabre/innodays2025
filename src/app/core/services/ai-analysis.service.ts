import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AnalysisResult } from '../models/scan.model';
import { ThermalData } from '../models/thermal.model';
import { SettingsService } from './settings.service';

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
  // Gemini (Vertex AI) configuration
  private readonly geminiApiKey =
    'AQ.Ab8RN6JOAbfKoMu-2v7p4fZhJtU8sqeQ0BxIw0tFKYhaZF0eAQ';
  private readonly projectId = 'prj-bison-3097627891-rindern';
  private readonly location = 'us-central1';

  // Anthropic configuration
  private readonly anthropicApiKey =
    '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'; // TODO: Replace with your API key
  private readonly anthropicModel = 'claude-sonnet-4-5-20250929';
  private readonly anthropicVersion = '2023-06-01';

  constructor(
    private http: HttpClient,
    private settingsService: SettingsService
  ) {}

  /**
   * Analyze thermal image using selected AI provider
   */
  async analyze(
    imageBlob: Blob,
    thermalData?: ThermalData
  ): Promise<AnalysisResult> {
    const provider = this.settingsService.getProvider();
    console.log(
      'AI Analysis Service - analyze() called with provider:',
      provider
    );
    console.log('Image blob size:', imageBlob.size, 'type:', imageBlob.type);

    if (provider === 'anthropic') {
      return await this.analyzeWithAnthropic(imageBlob);
    } else {
      return await this.analyzeWithGemini(imageBlob);
    }
  }

  /**
   * Analyze with Anthropic Claude (supports FLIR metadata extraction)
   */
  private async analyzeWithAnthropic(imageBlob: Blob): Promise<AnalysisResult> {
    console.log('Using Anthropic Claude Sonnet 4.5...');

    try {
      // Convert blob to base64
      const base64Image = await this.blobToBase64(imageBlob);

      // Anthropic API endpoint
      const url = 'https://api.anthropic.com/v1/messages';

      // Build system and user prompts
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt();

      // Prepare Anthropic request payload with prompt caching
      const payload = {
        model: this.anthropicModel,
        max_tokens: 4096,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' }, // Enable prompt caching (90% discount!)
          },
        ],
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: imageBlob.type || 'image/jpeg',
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: userPrompt,
              },
            ],
          },
        ],
      };

      const headers = {
        'x-api-key': this.anthropicApiKey,
        'anthropic-version': this.anthropicVersion,
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      };

      console.log('Making HTTP request to Anthropic...');
      const response = await firstValueFrom(
        this.http.post<any>(url, payload, { headers })
      );
      console.log('Anthropic response received:', response);

      // Parse Anthropic response
      return this.parseAnthropicResponse(response);
    } catch (error: any) {
      console.error('Anthropic analysis error:', error);

      // Create user-friendly error message
      let errorMessage = 'Anthropic API Fehler';

      if (error.status === 401) {
        errorMessage =
          'Ungültiger Anthropic API-Key. Bitte in den Einstellungen prüfen.';
      } else if (error.status === 429) {
        errorMessage =
          'Anthropic Rate Limit erreicht. Bitte später erneut versuchen.';
      } else if (error.error?.error?.message) {
        errorMessage = `Anthropic: ${error.error.error.message}`;
      } else if (error.message) {
        errorMessage = `Anthropic: ${error.message}`;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Analyze with Google Gemini (visual analysis only)
   */
  private async analyzeWithGemini(imageBlob: Blob): Promise<AnalysisResult> {
    console.log('Using Google Gemini 2.5 Pro...');

    try {
      // Convert blob to base64
      const base64Image = await this.blobToBase64(imageBlob);

      // Gemini API endpoint
      const url = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/gemini-2.5-pro:generateContent?key=${this.geminiApiKey}`;

      // Build combined prompt for Gemini
      const promptText = this.buildPrompt();

      // Prepare Gemini request payload
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: promptText },
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
          maxOutputTokens: 4096,
        },
      };

      console.log('Making HTTP request to Gemini...');
      const response = await firstValueFrom(this.http.post<any>(url, payload));
      console.log('Gemini response received:', response);

      // Parse Gemini response
      return this.parseGeminiResponse(response);
    } catch (error: any) {
      console.error('Gemini analysis error:', error);

      // Create user-friendly error message
      let errorMessage = 'Gemini API Fehler';

      if (error.status === 401 || error.status === 403) {
        errorMessage = 'Ungültiger Gemini API-Key oder keine Berechtigung.';
      } else if (error.status === 429) {
        errorMessage =
          'Gemini Rate Limit erreicht. Bitte später erneut versuchen.';
      } else if (error.error?.error?.message) {
        errorMessage = `Gemini: ${error.error.error.message}`;
      } else if (error.message) {
        errorMessage = `Gemini: ${error.message}`;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Build system prompt for Anthropic (cached for cost savings)
   */
  private buildSystemPrompt(): string {
    return `Du bist ein Experte für Klauengesundheit und Infrarotdiagnostik bei Rindern mit jahrelanger Erfahrung in der Analyse von FLIR-Thermalbildern.

Deine Expertise umfasst:
- Erkennung von Klauenkrankheiten (Mortellaro, Sohlengeschwür, Klauenrehe, etc.)
- Interpretation von FLIR-Farbskalen und Temperaturmustern
- Extraktion und Analyse von FLIR-EXIF-Metadaten
- Beurteilung von Lahmheitsrisiken
- Empfehlungen für Landwirte

Du antwortest immer auf Deutsch und gibst präzise, strukturierte Analysen im JSON-Format.`;
  }

  /**
   * Build user prompt for Anthropic
   */
  private buildUserPrompt(): string {
    return `Analysiere dieses FLIR-Infrarotbild einer Rinderklaue.

📸 SCHRITT 1: FLIR-EXIF-Metadaten extrahieren

Extrahiere ALLE verfügbaren FLIR-EXIF-Metadaten aus dem Bild:
- Temperatur-Daten (min_temp, max_temp, center_temp)
- Kamera-Info (camera_model, camera_serial)
- Umgebungsbedingungen (emissivity, reflected_temperature, atmospheric_temperature, relative_humidity, distance)
- Bild-Metadaten (timestamp, width, height)

Falls FLIR-Metadaten vorhanden → nutze sie für präzisere Analyse
Falls KEINE Metadaten → setze "flir_metadata": null

⚠️ SCHRITT 2: BILDVALIDIERUNG

Prüfe ob das Bild eine Rinderklaue oder ein Rinderbein zeigt.
Falls NICHT → Gib zurück: {"diagnosis": "Ungültiges Bild", "confidence": 0, ...}

🦶 SCHRITT 3: Anatomie identifizieren

Analysiere: Zehenspitzen, Sohle, Ballen, Zwischenklauenspalt, Kronrand, Asymmetrie

🔥 SCHRITT 4: Temperaturmuster erkennen

Finde: Hotspots, Hitzeinseln, ringförmige/grossflächige Erwärmung, asymmetrische Hitze

🦠 SCHRITT 5: Krankheiten prüfen

- Digitale Dermatitis (Mortellaro): heisser Zwischenklauenspalt, Kronsaumbereich
- Sohlengeschwür: lokalisierter Hotspot an Sohle
- Abszess: punktförmige Hitze
- Klauenrehe: gleichmässig warme Klaue
- Kronrandentzündung: warmes Band am Kronrand
- Weitere: Moderhinke, Weisse-Linie-Defekt, Ballenfäule

🔬 SCHRITT 6: Detaillierte Thermal-Analyse (WICHTIG!)

Berechne und extrahiere folgende Daten:

**Kritische Befunde:**
1. Maximaltemperatur mit Beschreibung (z.B. "42°C - deutlich erhöht")
2. Extreme Hotspots in % und Lokalisation (z.B. "8.95% extreme Hotspots im Kronenbereich")
3. Asymmetrie in °C links vs. rechts (z.B. "1.71°C Asymmetrie → einseitige Entzündung")
4. Erhöhte Temperatur-Fläche in % (z.B. "26.68% der Klaue zeigt erhöhte Temperaturen")
5. Temperaturgrenzen-Beschreibung (z.B. "Scharfe Temperaturgrenzen → lokalisierte Läsionen")

**Krankheits-spezifische Muster:**
Für die diagnostizierte Krankheit (z.B. Mortellaro/Digitale Dermatitis):
- Liste mit 4-5 typischen Indikatoren die erfüllt sind
- Beispiele: "Erhöhte Temperatur über dem Kronsaum", "Lokalisierte Entzündungsherde (3-5°C über normal)", "Asymmetrische Verteilung", "Scharfe Übergänge zwischen entzündet/gesund"

📊 AUSGABEFORMAT (verpflichtend - NUR JSON):

{
  "diagnosis": "Name der Krankheit oder 'gesund'",
  "confidence": 85,
  "severity": "none/mild/moderate/severe",
  "temperature_zones": "Beschreibung",
  "disease_probability_scores": {"Digitale Dermatitis": 75, ...},
  "lameness_probability": 65,
  "urgency_level": 2,
  "summary": "Kurze Zusammenfassung (max 3 Sätze!)",
  "affected_areas": [{"name": "Bereich", "severity": 3, "temperature": 38}],
  "recommendations": ["Empfehlung 1", "Empfehlung 2"],
  "uncertainties": "Bildfaktoren",
  "requires_veterinary_attention": true,
  "flir_metadata": {
    "camera_model": "FLIR E8",
    "min_temp": 32.5,
    "max_temp": 42.3,
    ...
  },
  "thermal_data": {
    "critical_findings": {
      "max_temperature": 42.0,
      "max_temp_description": "42°C - deutlich erhöht",
      "extreme_hotspots_percent": 8.95,
      "extreme_hotspots_location": "im Kronenbereich",
      "asymmetry_degrees": 1.71,
      "asymmetry_description": "links vs. rechts → einseitige Entzündung",
      "elevated_area_percent": 26.68,
      "temperature_boundaries": "Scharfe Temperaturgrenzen → lokalisierte Läsionen"
    },
    "disease_patterns": [
      {
        "disease_name": "Mortellaro",
        "indicators": [
          "Erhöhte Temperatur über dem Kronsaum",
          "Lokalisierte Entzündungsherde (3-5°C über normal)",
          "Asymmetrische Verteilung",
          "Scharfe Übergänge zwischen entzündet/gesund"
        ]
      }
    ]
  }
}

Dringlichkeitslevel: 0=kein Befund, 1=beobachten, 2=Kontrolle empfohlen, 3=Tierarzt nötig

WICHTIG:
- Antworte NUR mit JSON (keine Markdown-Codeblöcke!)
- Alle Texte auf DEUTSCH
- confidence/Wahrscheinlichkeiten: 0-100
- Bei gesunder Klaue: diagnosis="gesund"
- thermal_data MUSS immer ausgefüllt sein mit konkreten Werten!`;
  }

  /**
   * Parse Anthropic response into AnalysisResult
   */
  private parseAnthropicResponse(response: any): AnalysisResult {
    try {
      // Extract text from Anthropic response
      const text = response.content?.[0]?.text || '';
      console.log('Anthropic text response:', text);

      // Remove markdown code blocks if present
      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '');

      // Try to extract JSON from the response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);

        // Normalize confidence to 0-1 range
        let confidence = parsedData.confidence || 0;
        if (confidence > 1) {
          confidence = confidence / 100;
        }

        // Parse FLIR metadata from response
        const flirMetadata = parsedData.flir_metadata
          ? {
              cameraModel: parsedData.flir_metadata.camera_model,
              cameraSerial: parsedData.flir_metadata.camera_serial,
              minTemp: parsedData.flir_metadata.min_temp,
              maxTemp: parsedData.flir_metadata.max_temp,
              centerTemp: parsedData.flir_metadata.center_temp,
              emissivity: parsedData.flir_metadata.emissivity,
              reflectedTemperature:
                parsedData.flir_metadata.reflected_temperature,
              atmosphericTemperature:
                parsedData.flir_metadata.atmospheric_temperature,
              relativeHumidity: parsedData.flir_metadata.relative_humidity,
              distance: parsedData.flir_metadata.distance,
              timestamp: parsedData.flir_metadata.timestamp
                ? new Date(parsedData.flir_metadata.timestamp)
                : undefined,
              width: parsedData.flir_metadata.width,
              height: parsedData.flir_metadata.height,
            }
          : undefined;

        // Parse thermal data from response
        const thermalData = parsedData.thermal_data
          ? {
              width: parsedData.thermal_data.width || 0,
              height: parsedData.thermal_data.height || 0,
              temperatures: parsedData.thermal_data.temperatures || [],
              timestamp: new Date(),
              minTemp: parsedData.thermal_data.min_temp || 0,
              maxTemp: parsedData.thermal_data.max_temp || 0,
              avgTemp: parsedData.thermal_data.avg_temp || 0,
              criticalFindings: parsedData.thermal_data.critical_findings
                ? {
                    maxTemperature:
                      parsedData.thermal_data.critical_findings.max_temperature,
                    maxTempDescription:
                      parsedData.thermal_data.critical_findings
                        .max_temp_description,
                    extremeHotspotsPercent:
                      parsedData.thermal_data.critical_findings
                        .extreme_hotspots_percent,
                    extremeHotspotsLocation:
                      parsedData.thermal_data.critical_findings
                        .extreme_hotspots_location,
                    asymmetryDegrees:
                      parsedData.thermal_data.critical_findings
                        .asymmetry_degrees,
                    asymmetryDescription:
                      parsedData.thermal_data.critical_findings
                        .asymmetry_description,
                    elevatedAreaPercent:
                      parsedData.thermal_data.critical_findings
                        .elevated_area_percent,
                    temperatureBoundaries:
                      parsedData.thermal_data.critical_findings
                        .temperature_boundaries,
                  }
                : undefined,
              diseasePatterns: parsedData.thermal_data.disease_patterns
                ? parsedData.thermal_data.disease_patterns.map(
                    (pattern: any) => ({
                      diseaseName: pattern.disease_name,
                      indicators: pattern.indicators || [],
                    })
                  )
                : [],
            }
          : undefined;

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
          flirMetadata: flirMetadata,
          thermalData: thermalData,
        };
      }

      // If no JSON found, return mock data
      console.warn('No JSON found in Anthropic response, using mock data');
      return this.getMockAnalysisResult();
    } catch (error) {
      console.error('Failed to parse Anthropic response:', error);
      return this.getMockAnalysisResult();
    }
  }

  /**
   * Build prompt for Gemini to extract FLIR metadata and analyze
   */
  private buildPrompt(): string {
    return `Du bist ein Experte für Klauengesundheit und Infrarotdiagnostik bei Rindern.

📸 SCHRITT 1: FLIR-EXIF-Metadaten extrahieren

Prüfe ob das Bild FLIR-Thermalkamera EXIF-Metadaten enthält und extrahiere folgende Alle FLIR-Metadaten:

Temperatur-Daten:
- Minimale Temperatur im Bild (min_temp)
- Maximale Temperatur im Bild (max_temp)
- Zentrumstemperatur/Spot (center_temp)

Kamera-Info:
- Kameramodell/Hersteller (camera_model)
- Seriennummer falls vorhanden (camera_serial)

Umgebungsbedingungen:
- Emissionsgrad (emissivity)
- Reflektierte Temperatur (reflected_temperature)
- Atmosphärische Temperatur (atmospheric_temperature)
- Relative Luftfeuchtigkeit in % (relative_humidity)
- Messabstand in Metern (distance)

Bild-Metadaten:
- Aufnahmezeit (timestamp)
- Bildauflösung (width, height)

Falls FLIR-Metadaten vorhanden → nutze sie für präzisere Temperaturbeurteilung
Falls KEINE Metadaten vorhanden → setze "flir_metadata": null und nutze nur visuelle Analyse


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
  "requires_veterinary_attention": true,
  "flir_metadata": {
    "camera_model": "FLIR E8",
    "camera_serial": "12345678",
    "min_temp": 32.5,
    "max_temp": 42.3,
    "center_temp": 37.8,
    "emissivity": 0.95,
    "reflected_temperature": 20.0,
    "atmospheric_temperature": 20.0,
    "relative_humidity": 65,
    "distance": 0.5,
    "timestamp": "2025-11-20T14:30:00",
    "width": 320,
    "height": 240
  }
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
- Wenn die Klaue gesund aussieht, verwende "gesund" als diagnosis`;
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

        // Parse FLIR metadata from Gemini response
        const flirMetadata = parsedData.flir_metadata
          ? {
              cameraModel: parsedData.flir_metadata.camera_model,
              cameraSerial: parsedData.flir_metadata.camera_serial,
              minTemp: parsedData.flir_metadata.min_temp,
              maxTemp: parsedData.flir_metadata.max_temp,
              centerTemp: parsedData.flir_metadata.center_temp,
              emissivity: parsedData.flir_metadata.emissivity,
              reflectedTemperature:
                parsedData.flir_metadata.reflected_temperature,
              atmosphericTemperature:
                parsedData.flir_metadata.atmospheric_temperature,
              relativeHumidity: parsedData.flir_metadata.relative_humidity,
              distance: parsedData.flir_metadata.distance,
              timestamp: parsedData.flir_metadata.timestamp
                ? new Date(parsedData.flir_metadata.timestamp)
                : undefined,
              width: parsedData.flir_metadata.width,
              height: parsedData.flir_metadata.height,
            }
          : undefined;

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
          flirMetadata: flirMetadata,
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
      summary:
        'Die Klaue zeigt keine Anzeichen von Krankheiten oder Verletzungen. Die Hornqualität ist gut und die Anatomie ist normal.',
      affectedAreas: [],
      recommendations: [
        'Regelmässige Klauenpflege fortsetzen',
        'Auf Veränderungen im Gang oder Verhalten achten',
        'Nächste Kontrolle in 3 Monaten einplanen',
      ],
      severity: 'none',
      requiresVeterinaryAttention: false,
      flirMetadata: {
        cameraModel: 'FLIR E8 (Mock)',
        minTemp: 32.5,
        maxTemp: 38.2,
        centerTemp: 35.4,
        emissivity: 0.95,
        relativeHumidity: 65,
        distance: 0.5,
        atmosphericTemperature: 20.0,
      },
    };
  }
}
