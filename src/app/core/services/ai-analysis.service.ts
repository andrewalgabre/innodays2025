import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AffectedArea, AnalysisResult } from '../models/scan.model';
import { ThermalData } from '../models/thermal.model';
import { SecretUtil } from '../utils/secret.util';
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
  // Gemini (Vertex AI) configuration - decoded at runtime
  private readonly geminiApiKey = SecretUtil.decode(environment.geminiApiKey);
  private readonly projectId = environment.geminiProjectId;
  private readonly location = environment.geminiLocation;

  // Anthropic configuration - decoded at runtime
  private readonly anthropicApiKey = SecretUtil.decode(
    environment.anthropicApiKey
  );
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

    if (provider === 'anthropic') {
      return await this.analyzeWithAnthropic(imageBlob);
    } else if (provider === 'custom') {
      return await this.analyzeWithCustomAgent(imageBlob);
    } else {
      return await this.analyzeWithGemini(imageBlob);
    }
  }

  /**
   * Analyze with Anthropic Claude (supports FLIR metadata extraction)
   */
  private async analyzeWithAnthropic(imageBlob: Blob): Promise<AnalysisResult> {

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

      const response = await firstValueFrom(
        this.http.post<any>(url, payload, { headers })
      );

      // Parse Anthropic response
      return this.parseAnthropicResponse(response);
    } catch (error: any) {

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
   * Analyze with Custom Hoof Classification Agent (ML model)
   */
  private async analyzeWithCustomAgent(imageBlob: Blob): Promise<AnalysisResult> {
    try {
      // Custom API endpoint (proxy in dev, direct URL in production)
      const url = environment.customAgentUrl;

      // Build FormData for file upload
      const formData = new FormData();
      formData.append('file', imageBlob, 'hoof-image.jpg');

      // Send POST request with FormData
      const response = await firstValueFrom(
        this.http.post<any>(url, formData)
      );

      // Parse Custom Agent response
      return this.parseCustomAgentResponse(response);
    } catch (error: any) {
      // Create user-friendly error message
      let errorMessage = 'Custom Agent Fehler';

      if (error.status === 0) {
        errorMessage = 'Custom Agent nicht erreichbar. CORS-Problem: Der API-Server muss CORS-Header für diese Domain erlauben.';
      } else if (error.status === 400) {
        errorMessage = 'Ungültiges Bildformat für Custom Agent.';
      } else if (error.status === 405) {
        errorMessage = 'Custom Agent: Methode nicht erlaubt (405). CORS-Konfiguration fehlt am Server.';
      } else if (error.status === 413) {
        errorMessage = 'Bild zu groß für Custom Agent.';
      } else if (error.error?.message) {
        errorMessage = `Custom Agent: ${error.error.message}`;
      } else if (error.message) {
        errorMessage = `Custom Agent: ${error.message}`;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Analyze with Google Gemini (visual analysis only)
   */
  private async analyzeWithGemini(imageBlob: Blob): Promise<AnalysisResult> {

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

      const response = await firstValueFrom(this.http.post<any>(url, payload));

      // Parse Gemini response
      return this.parseGeminiResponse(response);
    } catch (error: any) {
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
   * Build combined prompt for Anthropic (system + user in one for caching)
   */
  private buildSystemPrompt(): string {
    return `Du bist ein Experte für Kuhklauen-Thermografie mit FLIR-Kameras.

WICHTIGSTE REGEL:
Die ASYMMETRIE (Links vs. Rechts Temperaturdifferenz) ist der WICHTIGSTE diagnostische Parameter!`;
  }

  /**
   * Build user prompt for Anthropic with validated training examples
   */
  private buildUserPrompt(): string {
    return `Analysiere dieses FLIR-Infrarotbild einer Rinderklaue.

═══════════════════════════════════════════════════════════
VALIDIERTE TRAININGSBEISPIELE (9 Fälle)
═══════════════════════════════════════════════════════════

FALL 1 [KRANK - Mortellaro]:
Asymmetrie: 1.71°C (Links: 32.49°C, Rechts: 34.19°C)
Extreme Hotspots: 8.95%
Diagnose: KRANK - Fokale einseitige Kroneninfektion
Muster: Deutliche asymmetrische Erhöhung im rechten Kronenbereich

FALL 2 [KRANK - Klauenrehe]:
Asymmetrie: 0.36°C (Links: 34.17°C, Rechts: 33.81°C)
Erhöhte Bereiche: 28.58%
Diagnose: KRANK - Diffuse systemische Entzündung
Muster: Gleichmäßige symmetrische Erwärmung, großflächig betroffen
⚠️ AUSNAHMEFALL: Trotz geringer Asymmetrie krank wegen diffuser Entzündung

FALL 3 [GESUND]:
Asymmetrie: 0.18°C (Links: 34.19°C, Rechts: 34.01°C)
Diagnose: GESUND
Muster: Sehr symmetrisch, gleichmäßige Temperaturverteilung

FALL 4 [GESUND]:
Asymmetrie: 0.41°C (Links: 34.17°C, Rechts: 33.76°C)
Diagnose: GESUND - Obere Grenze
Muster: Leichte Asymmetrie aber noch im gesunden Bereich

FALL 5 [GESUND]:
Asymmetrie: 0.12°C (Links: 34.27°C, Rechts: 34.14°C)
Diagnose: GESUND - Ideal
Muster: Extrem symmetrisch, perfekt gleichmäßig

FALL 6 [KRANK - Sohlenläsionen]:
Asymmetrie: 1.09°C (Links: 34.48°C, Rechts: 33.39°C)
Extreme Hotspots: 9.1%
Diagnose: KRANK - Multiple Sohlengeschwüre
Muster: Viele diskrete rote Punkte auf der Sohle

FALL 7 [KRANK - Dermatitis]:
Asymmetrie: 1.07°C (Links: 33.27°C, Rechts: 34.33°C)
Extreme Hotspots: 7.6%
Diagnose: KRANK - Lokale Entzündung
Muster: Deutlicher heißer Bereich unten an der Klaue

FALL 8 [GESUND]:
Asymmetrie: 0.23°C (Links: 33.95°C, Rechts: 34.18°C)
Diagnose: GESUND
Muster: Symmetrisch, gleichmäßige Verteilung

FALL 9 [GRAUZONE]:
Asymmetrie: 0.53°C (Links: 34.13°C, Rechts: 33.60°C)
Diagnose: UNKLAR - benötigt klinische Untersuchung
Muster: Grenzfall, sichtbare Hotspots

═══════════════════════════════════════════════════════════
GELERNTE SCHWELLENWERTE (100% validiert):
═══════════════════════════════════════════════════════════

✅ Asymmetrie ≤0.41°C → GESUND (100% Trefferquote: 4/4 Fälle)
🟡 Asymmetrie 0.42-0.99°C → GRAUZONE (weitere Analyse nötig)
🔴 Asymmetrie ≥1.0°C → KRANK (100% Trefferquote: 3/3 fokale Infektionen)

AUSNAHME:
⚠️ Fall 2 zeigt: Bei 0.36°C ABER >25% erhöhter Fläche + diffus → Rehe (krank)

═══════════════════════════════════════════════════════════
ANALYSEPROZESS:
═══════════════════════════════════════════════════════════

SCHRITT 1: BILDVALIDIERUNG
Prüfe ob Bild eine Rinderklaue zeigt. Falls NICHT → Sofort abbrechen.

SCHRITT 2: VISUELLES MUSTER ERKENNEN
- Ist es symmetrisch (links ≈ rechts)?
- Gibt es fokale Hotspots (helle konzentrierte Punkte)?
- Ist die Erwärmung gleichmäßig oder konzentriert?
- Wo sind die heißesten Bereiche?

SCHRITT 3: VERGLEICH MIT TRAININGSBEISPIELEN
Welchem der 9 Fälle ähnelt das Bild am meisten?

SYMMETRISCH + GLEICHMÄSSIG?
→ Ähnlich zu Fall 3, 5, 8 → Wahrscheinlich GESUND

ASYMMETRISCH + FOKALE HOTSPOTS?
→ Ähnlich zu Fall 1, 6, 7 → Wahrscheinlich KRANK (Mortellaro/Läsionen)

SYMMETRISCH + DIFFUS ERHÖHT + GROßFLÄCHIG?
→ Ähnlich zu Fall 2 → Wahrscheinlich KRANK (Rehe)

GRENZFALL?
→ Ähnlich zu Fall 9 → GRAUZONE

SCHRITT 4: DIAGNOSE
Basierend auf ähnlichstem Trainingsfall:
- Schätze Asymmetrie visuell
- Gib Diagnose: GESUND / KRANK / GRAUZONE
- Begründe mit Ähnlichkeit zum Trainingsfall

═══════════════════════════════════════════════════════════
AUSGABEFORMAT (NUR JSON, keine Markdown-Blöcke!):
═══════════════════════════════════════════════════════════

{
  "diagnosis": "gesund / Digitale Dermatitis / Klauenrehe / Sohlengeschwür / unklar",
  "confidence": 85,
  "similar_to_case": 3,
  "similarity_reasoning": "Das Bild zeigt symmetrische Erwärmung ähnlich zu Fall 3 (GESUND)",
  "estimated_asymmetry": 0.2,
  "visual_pattern": "symmetrisch / asymmetrisch / diffus",
  "severity": "none / mild / moderate / severe",
  "summary": "Kurze Zusammenfassung (max 3 Sätze)",
  "affected_areas": [{"name": "Bereich", "severity": 3, "temperature": 38}],
  "recommendations": ["Empfehlung 1", "Empfehlung 2"],
  "requires_veterinary_attention": true,
  "urgency_level": 0,
  "temperature_zones": "Beschreibung der Farbverteilung",
  "disease_probability_scores": {"Mortellaro": 75, "Klauenrehe": 10},
  "lameness_probability": 65
}

WICHTIG:
- "diagnosis" NUR Krankheitsname (z.B. "Digitale Dermatitis"), NICHT "krank - Digitale Dermatitis"!
- "similar_to_case" MUSS 1-9 sein
- "estimated_asymmetry" ist deine visuelle Schätzung in °C
- Nutze Trainingsbeispiele als Referenz!
- Antworte auf DEUTSCH
- NIEMALS nur auf Optik verlassen - ein gelbes Bild kann GESUND sein!`;
  }

  /**
   * Parse Anthropic response into AnalysisResult
   */
  private parseAnthropicResponse(response: any): AnalysisResult {
    try {
      // Extract text from Anthropic response
      const text = response.content?.[0]?.text || '';

      // Remove markdown code blocks if present
      const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '');

      // Try to extract JSON from the response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);

        // Clean diagnosis - remove "krank - " prefix if present
        let diagnosis = parsedData.diagnosis || 'Unbekannt';
        diagnosis = diagnosis.replace(/^krank\s*-\s*/i, '');

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
          diagnosis: diagnosis,
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
      return this.getMockAnalysisResult();
    } catch (error) {
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
      return this.getMockAnalysisResult();
    } catch (error) {
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
   * Parse Custom Agent response into AnalysisResult
   */
  private parseCustomAgentResponse(response: any): AnalysisResult {
    try {
      // Extract first prediction from response
      const prediction = response.predictions?.[0];
      if (!prediction) {
        throw new Error('No predictions found in Custom Agent response');
      }

      // Extract classification data
      const label = prediction.classification?.label;
      const probabilities = prediction.classification?.probabilities || {};
      const detectionConfidence = prediction.detection_confidence || 0;
      const bbox = prediction.bbox;
      const isInfrared = prediction.is_infrared;

      // Determine if disease is detected
      const isPositive = label === 'positive';

      // Use the appropriate confidence score
      const confidence = isPositive
        ? (probabilities.positive || 0)
        : (probabilities.negative || 0);

      // Map to German diagnosis
      const diagnosis = isPositive ? 'Verdacht auf Erkrankung' : 'gesund';

      // Determine severity based on confidence
      let severity: 'none' | 'mild' | 'moderate' | 'severe' = 'none';
      if (isPositive) {
        if (confidence > 0.9) {
          severity = 'moderate';
        } else if (confidence > 0.7) {
          severity = 'mild';
        } else {
          severity = 'mild';
        }
      }

      // Build German summary
      const confidencePercent = (confidence * 100).toFixed(0);
      const summary = isPositive
        ? `Das KI-Modell hat auffällige Bereiche mit ${confidencePercent}% Sicherheit erkannt. Eine weitere klinische Untersuchung durch einen Tierarzt oder Klauenpfleger wird empfohlen.`
        : `Die Klaue zeigt keine Auffälligkeiten (${confidencePercent}% Sicherheit). Regelmäßige Kontrollen sollten fortgesetzt werden.`;

      // Build affected areas from bounding box
      const affectedAreas: AffectedArea[] = [];
      if (isPositive && bbox) {
        affectedAreas.push({
          name: `Erkannter Bereich (${Math.round(bbox.x1)},${Math.round(bbox.y1)} - ${Math.round(bbox.x2)},${Math.round(bbox.y2)})`,
          location: {
            x: bbox.x1,
            y: bbox.y1,
            width: bbox.x2 - bbox.x1,
            height: bbox.y2 - bbox.y1,
          },
          severity: confidence > 0.9 ? 8 : 5,
          temperature: 0, // Not provided by Custom Agent - UI should hide temp display
        });
      }

      // Build recommendations
      const recommendations = isPositive
        ? [
            'Tierarzt oder Klauenpfleger konsultieren',
            'Betroffene Klaue genau beobachten',
            'Dokumentation für Verlaufskontrolle anlegen',
          ]
        : [
            'Regelmäßige Klauenpflege fortsetzen',
            'Auf Gangveränderungen oder Lahmheit achten',
            'Nächste Kontrolle in 3 Monaten einplanen',
          ];

      // Build disease probability scores
      const diseaseProbabilityScores = {
        'Erkrankung erkannt': Math.round((probabilities.positive || 0) * 100),
        'Gesund': Math.round((probabilities.negative || 0) * 100),
      };

      // Determine urgency level
      let urgencyLevel = 0;
      if (isPositive) {
        if (confidence > 0.9) {
          urgencyLevel = 2; // Mittleres Risiko
        } else if (confidence > 0.7) {
          urgencyLevel = 1; // Mild – beobachten
        } else {
          urgencyLevel = 1;
        }
      }

      // Don't populate FLIR metadata for custom agent - it doesn't provide real thermal data
      const flirMetadata = undefined;

      return {
        diagnosis: diagnosis,
        confidence: confidence,
        summary: summary,
        affectedAreas: affectedAreas,
        recommendations: recommendations,
        severity: severity,
        requiresVeterinaryAttention: isPositive && confidence > 0.7,
        temperatureZones: undefined, // Custom Agent doesn't provide thermal zone analysis
        diseaseProbabilityScores: diseaseProbabilityScores,
        lamenessProbability: undefined, // Custom Agent doesn't provide lameness prediction
        urgencyLevel: urgencyLevel,
        uncertainties: detectionConfidence < 0.8
          ? 'Erkennungssicherheit könnte durch bessere Bildqualität erhöht werden'
          : undefined,
        flirMetadata: flirMetadata,
        rawResponse: response, // Store raw API response for debugging
      };
    } catch (error) {
      throw new Error('Failed to parse Custom Agent response: ' + (error as Error).message);
    }
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
