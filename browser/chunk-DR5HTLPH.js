import{a as Z}from"./chunk-YVLH6ENZ.js";import{a as W}from"./chunk-V3EMBTZ5.js";import{a as J}from"./chunk-UJRVMH5Z.js";import{N as U,O as G,b as K,c as L,d as H,e as V,h as j,k as N}from"./chunk-OLYYRW65.js";import{$ as h,$a as f,Fa as w,Ja as E,Oa as p,R as T,Ua as o,V as S,Va as s,Wa as i,Xa as u,_a as x,aa as v,ab as d,f as b,gb as D,hb as A,ib as l,jb as _,kb as y,lb as P,qb as F,rb as B,t as R,ua as O,va as a}from"./chunk-NXH6DGID.js";var M={production:!0,anthropicApiKey:"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",geminiApiKey:"AQ.Ab8RN6JOAbfKoMu-2v7p4fZhJtU8sqeQ0BxIw0tFKYhaZF0eAQ",geminiProjectId:"prj-bison-3097627891-rindern",geminiLocation:"us-central1"};var z=class t{constructor(n,e){this.http=n;this.settingsService=e}geminiApiKey=M.geminiApiKey;projectId=M.geminiProjectId;location=M.geminiLocation;anthropicApiKey=M.anthropicApiKey;anthropicModel="claude-sonnet-4-5-20250929";anthropicVersion="2023-06-01";analyze(n,e){return b(this,null,function*(){let c=this.settingsService.getProvider();return console.log("AI Analysis Service - analyze() called with provider:",c),console.log("Image blob size:",n.size,"type:",n.type),c==="anthropic"?yield this.analyzeWithAnthropic(n):yield this.analyzeWithGemini(n)})}analyzeWithAnthropic(n){return b(this,null,function*(){console.log("Using Anthropic Claude Sonnet 4.5...");try{let e=yield this.blobToBase64(n),c="https://api.anthropic.com/v1/messages",m=this.buildSystemPrompt(),r=this.buildUserPrompt(),g={model:this.anthropicModel,max_tokens:4096,system:[{type:"text",text:m,cache_control:{type:"ephemeral"}}],messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:n.type||"image/jpeg",data:e}},{type:"text",text:r}]}]},C={"x-api-key":this.anthropicApiKey,"anthropic-version":this.anthropicVersion,"content-type":"application/json","anthropic-dangerous-direct-browser-access":"true"};console.log("Making HTTP request to Anthropic...");let k=yield R(this.http.post(c,g,{headers:C}));return console.log("Anthropic response received:",k),this.parseAnthropicResponse(k)}catch(e){console.error("Anthropic analysis error:",e);let c="Anthropic API Fehler";throw e.status===401?c="Ung\xFCltiger Anthropic API-Key. Bitte in den Einstellungen pr\xFCfen.":e.status===429?c="Anthropic Rate Limit erreicht. Bitte sp\xE4ter erneut versuchen.":e.error?.error?.message?c=`Anthropic: ${e.error.error.message}`:e.message&&(c=`Anthropic: ${e.message}`),new Error(c)}})}analyzeWithGemini(n){return b(this,null,function*(){console.log("Using Google Gemini 2.5 Pro...");try{let e=yield this.blobToBase64(n),c=`https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/gemini-2.5-pro:generateContent?key=${this.geminiApiKey}`,r={contents:[{role:"user",parts:[{text:this.buildPrompt()},{inline_data:{mime_type:n.type||"image/jpeg",data:e}}]}],generationConfig:{temperature:.2,topP:.8,topK:40,maxOutputTokens:4096}};console.log("Making HTTP request to Gemini...");let g=yield R(this.http.post(c,r));return console.log("Gemini response received:",g),this.parseGeminiResponse(g)}catch(e){console.error("Gemini analysis error:",e);let c="Gemini API Fehler";throw e.status===401||e.status===403?c="Ung\xFCltiger Gemini API-Key oder keine Berechtigung.":e.status===429?c="Gemini Rate Limit erreicht. Bitte sp\xE4ter erneut versuchen.":e.error?.error?.message?c=`Gemini: ${e.error.error.message}`:e.message&&(c=`Gemini: ${e.message}`),new Error(c)}})}buildSystemPrompt(){return`Du bist ein Experte f\xFCr Klauengesundheit und Infrarotdiagnostik bei Rindern mit jahrelanger Erfahrung in der Analyse von FLIR-Thermalbildern.

Deine Expertise umfasst:
- Erkennung von Klauenkrankheiten (Mortellaro, Sohlengeschw\xFCr, Klauenrehe, etc.)
- Interpretation von FLIR-Farbskalen und Temperaturmustern
- Extraktion und Analyse von FLIR-EXIF-Metadaten
- Beurteilung von Lahmheitsrisiken
- Empfehlungen f\xFCr Landwirte

Du antwortest immer auf Deutsch und gibst pr\xE4zise, strukturierte Analysen im JSON-Format.`}buildUserPrompt(){return`Analysiere dieses FLIR-Infrarotbild einer Rinderklaue.

\u{1F4F8} SCHRITT 1: FLIR-EXIF-Metadaten extrahieren

Extrahiere ALLE verf\xFCgbaren FLIR-EXIF-Metadaten aus dem Bild:
- Temperatur-Daten (min_temp, max_temp, center_temp)
- Kamera-Info (camera_model, camera_serial)
- Umgebungsbedingungen (emissivity, reflected_temperature, atmospheric_temperature, relative_humidity, distance)
- Bild-Metadaten (timestamp, width, height)

Falls FLIR-Metadaten vorhanden \u2192 nutze sie f\xFCr pr\xE4zisere Analyse
Falls KEINE Metadaten \u2192 setze "flir_metadata": null

\u26A0\uFE0F SCHRITT 2: BILDVALIDIERUNG

Pr\xFCfe ob das Bild eine Rinderklaue oder ein Rinderbein zeigt.
Falls NICHT \u2192 Gib zur\xFCck: {"diagnosis": "Ung\xFCltiges Bild", "confidence": 0, ...}

\u{1F9B6} SCHRITT 3: Anatomie identifizieren

Analysiere: Zehenspitzen, Sohle, Ballen, Zwischenklauenspalt, Kronrand, Asymmetrie

\u{1F525} SCHRITT 4: Temperaturmuster erkennen

Finde: Hotspots, Hitzeinseln, ringf\xF6rmige/grossfl\xE4chige Erw\xE4rmung, asymmetrische Hitze

\u{1F9A0} SCHRITT 5: Krankheiten pr\xFCfen

- Digitale Dermatitis (Mortellaro): heisser Zwischenklauenspalt, Kronsaumbereich
- Sohlengeschw\xFCr: lokalisierter Hotspot an Sohle
- Abszess: punktf\xF6rmige Hitze
- Klauenrehe: gleichm\xE4ssig warme Klaue
- Kronrandentz\xFCndung: warmes Band am Kronrand
- Weitere: Moderhinke, Weisse-Linie-Defekt, Ballenf\xE4ule

\u{1F52C} SCHRITT 6: Detaillierte Thermal-Analyse (WICHTIG!)

Berechne und extrahiere folgende Daten:

**Kritische Befunde:**
1. Maximaltemperatur mit Beschreibung (z.B. "42\xB0C - deutlich erh\xF6ht")
2. Extreme Hotspots in % und Lokalisation (z.B. "8.95% extreme Hotspots im Kronenbereich")
3. Asymmetrie in \xB0C links vs. rechts (z.B. "1.71\xB0C Asymmetrie \u2192 einseitige Entz\xFCndung")
4. Erh\xF6hte Temperatur-Fl\xE4che in % (z.B. "26.68% der Klaue zeigt erh\xF6hte Temperaturen")
5. Temperaturgrenzen-Beschreibung (z.B. "Scharfe Temperaturgrenzen \u2192 lokalisierte L\xE4sionen")

**Krankheits-spezifische Muster:**
F\xFCr die diagnostizierte Krankheit (z.B. Mortellaro/Digitale Dermatitis):
- Liste mit 4-5 typischen Indikatoren die erf\xFCllt sind
- Beispiele: "Erh\xF6hte Temperatur \xFCber dem Kronsaum", "Lokalisierte Entz\xFCndungsherde (3-5\xB0C \xFCber normal)", "Asymmetrische Verteilung", "Scharfe \xDCberg\xE4nge zwischen entz\xFCndet/gesund"

\u{1F4CA} AUSGABEFORMAT (verpflichtend - NUR JSON):

{
  "diagnosis": "Name der Krankheit oder 'gesund'",
  "confidence": 85,
  "severity": "none/mild/moderate/severe",
  "temperature_zones": "Beschreibung",
  "disease_probability_scores": {"Digitale Dermatitis": 75, ...},
  "lameness_probability": 65,
  "urgency_level": 2,
  "summary": "Kurze Zusammenfassung (max 3 S\xE4tze!)",
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
      "max_temp_description": "42\xB0C - deutlich erh\xF6ht",
      "extreme_hotspots_percent": 8.95,
      "extreme_hotspots_location": "im Kronenbereich",
      "asymmetry_degrees": 1.71,
      "asymmetry_description": "links vs. rechts \u2192 einseitige Entz\xFCndung",
      "elevated_area_percent": 26.68,
      "temperature_boundaries": "Scharfe Temperaturgrenzen \u2192 lokalisierte L\xE4sionen"
    },
    "disease_patterns": [
      {
        "disease_name": "Mortellaro",
        "indicators": [
          "Erh\xF6hte Temperatur \xFCber dem Kronsaum",
          "Lokalisierte Entz\xFCndungsherde (3-5\xB0C \xFCber normal)",
          "Asymmetrische Verteilung",
          "Scharfe \xDCberg\xE4nge zwischen entz\xFCndet/gesund"
        ]
      }
    ]
  }
}

Dringlichkeitslevel: 0=kein Befund, 1=beobachten, 2=Kontrolle empfohlen, 3=Tierarzt n\xF6tig

WICHTIG:
- Antworte NUR mit JSON (keine Markdown-Codebl\xF6cke!)
- Alle Texte auf DEUTSCH
- confidence/Wahrscheinlichkeiten: 0-100
- Bei gesunder Klaue: diagnosis="gesund"
- thermal_data MUSS immer ausgef\xFCllt sein mit konkreten Werten!`}parseAnthropicResponse(n){try{let e=n.content?.[0]?.text||"";console.log("Anthropic text response:",e);let m=e.replace(/```json\n?/g,"").replace(/```\n?/g,"").match(/\{[\s\S]*\}/);if(m){let r=JSON.parse(m[0]),g=r.confidence||0;g>1&&(g=g/100);let C=r.flir_metadata?{cameraModel:r.flir_metadata.camera_model,cameraSerial:r.flir_metadata.camera_serial,minTemp:r.flir_metadata.min_temp,maxTemp:r.flir_metadata.max_temp,centerTemp:r.flir_metadata.center_temp,emissivity:r.flir_metadata.emissivity,reflectedTemperature:r.flir_metadata.reflected_temperature,atmosphericTemperature:r.flir_metadata.atmospheric_temperature,relativeHumidity:r.flir_metadata.relative_humidity,distance:r.flir_metadata.distance,timestamp:r.flir_metadata.timestamp?new Date(r.flir_metadata.timestamp):void 0,width:r.flir_metadata.width,height:r.flir_metadata.height}:void 0,k=r.thermal_data?{width:r.thermal_data.width||0,height:r.thermal_data.height||0,temperatures:r.thermal_data.temperatures||[],timestamp:new Date,minTemp:r.thermal_data.min_temp||0,maxTemp:r.thermal_data.max_temp||0,avgTemp:r.thermal_data.avg_temp||0,criticalFindings:r.thermal_data.critical_findings?{maxTemperature:r.thermal_data.critical_findings.max_temperature,maxTempDescription:r.thermal_data.critical_findings.max_temp_description,extremeHotspotsPercent:r.thermal_data.critical_findings.extreme_hotspots_percent,extremeHotspotsLocation:r.thermal_data.critical_findings.extreme_hotspots_location,asymmetryDegrees:r.thermal_data.critical_findings.asymmetry_degrees,asymmetryDescription:r.thermal_data.critical_findings.asymmetry_description,elevatedAreaPercent:r.thermal_data.critical_findings.elevated_area_percent,temperatureBoundaries:r.thermal_data.critical_findings.temperature_boundaries}:void 0,diseasePatterns:r.thermal_data.disease_patterns?r.thermal_data.disease_patterns.map(I=>({diseaseName:I.disease_name,indicators:I.indicators||[]})):[]}:void 0;return{diagnosis:r.diagnosis||"Unbekannt",confidence:g,summary:r.summary||"",affectedAreas:r.affected_areas||[],recommendations:r.recommendations||[],severity:this.mapSeverity(r.severity),requiresVeterinaryAttention:r.requires_veterinary_attention||!1,temperatureZones:r.temperature_zones,diseaseProbabilityScores:r.disease_probability_scores,lamenessProbability:r.lameness_probability,urgencyLevel:r.urgency_level,uncertainties:r.uncertainties,flirMetadata:C,thermalData:k}}return console.warn("No JSON found in Anthropic response, using mock data"),this.getMockAnalysisResult()}catch(e){return console.error("Failed to parse Anthropic response:",e),this.getMockAnalysisResult()}}buildPrompt(){return`Du bist ein Experte f\xFCr Klauengesundheit und Infrarotdiagnostik bei Rindern.

\u{1F4F8} SCHRITT 1: FLIR-EXIF-Metadaten extrahieren

Pr\xFCfe ob das Bild FLIR-Thermalkamera EXIF-Metadaten enth\xE4lt und extrahiere folgende Alle FLIR-Metadaten:

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
- Atmosph\xE4rische Temperatur (atmospheric_temperature)
- Relative Luftfeuchtigkeit in % (relative_humidity)
- Messabstand in Metern (distance)

Bild-Metadaten:
- Aufnahmezeit (timestamp)
- Bildaufl\xF6sung (width, height)

Falls FLIR-Metadaten vorhanden \u2192 nutze sie f\xFCr pr\xE4zisere Temperaturbeurteilung
Falls KEINE Metadaten vorhanden \u2192 setze "flir_metadata": null und nutze nur visuelle Analyse


\u26A0\uFE0F SCHRITT 0: BILDVALIDIERUNG (VERPFLICHTEND)

Pr\xFCfe ZUERST, ob das Bild tats\xE4chlich eine Rinderklaue oder ein Rinderbein zeigt:
- Ist eine Klaue/Huf erkennbar?
- Zeigt das Bild ein Rinderbein?
- Ist es ein Thermalbild/FLIR-Aufnahme?

Falls NICHT \u2192 Gib sofort dieses JSON zur\xFCck und STOPPE die Analyse:
{
  "diagnosis": "Ung\xFCltiges Bild",
  "confidence": 0,
  "severity": "none",
  "summary": "Das Bild zeigt keine Rinderklaue. Bitte fotografieren Sie die Klaue des Tieres.",
  "affected_areas": [],
  "recommendations": ["Neues Bild von der Klaue aufnehmen"],
  "requires_veterinary_attention": false,
  "uncertainties": "Kein Klauenbild erkennbar"
}

Falls JA \u2192 Fahre mit der Analyse fort.

Analysiere das folgende FLIR-Infrarotbild einer Kuhklaue sehr pr\xE4zise. Verwende unbedingt die typische FLIR-Farbskala zur Interpretation.

\u{1F3A8} A) FLIR-Farbskala korrekt interpretieren

Nutze folgende Farbbedeutungen:
- Weiss / Gelb \u2192 heisseste Bereiche
- Orange \u2192 sehr warm
- Rot \u2192 warm
- Magenta / Pink \u2192 mild
- Lila / Violett \u2192 k\xFChl
- Blau / Schwarz \u2192 sehr kalt (Hintergrund)

Bewerte relative Temperaturunterschiede, keine absoluten \xB0C.

\u{1F9B6} B) Anatomie im Bild identifizieren

Analysiere:
- Zehenspitzen
- Sohle
- Ballen
- Zwischenklauenspalt
- Kronrand
- dorsale/plantare Seite
- Links/Rechts-Asymmetrie
- Form- oder Strukturabweichungen

Wenn etwas wegen Kamerawinkel/Schmutz/N\xE4sse schwer erkennbar ist \u2192 bitte klar erw\xE4hnen.

\u{1F525} C) Temperaturmuster erkennen

Finde:
- Hotspots (weiss/gelb)
- lokale Hitzeinseln (punktf\xF6rmig)
- ringf\xF6rmige Erw\xE4rmung
- grossfl\xE4chige Erw\xE4rmung
- asymmetrische Hitze
- Temperaturverlauf \xFCber Zehe \u2192 Ballen

\u{1F9A0} D) Pr\xFCfe auf folgende Klauenkrankheiten

Digitale Dermatitis (Mortellaro)
\u2192 heisser Zwischenklauenspalt, symmetrische Erw\xE4rmung

Sohlengeschw\xFCr
\u2192 klar lokalisierter Hotspot an der Sohle

Abszess
\u2192 kleine, sehr helle punktf\xF6rmige Hitze

Klauenrehe (Laminitis)
\u2192 gleichm\xE4ssig warme Klaue, Zehenbereich stark

Kronrandentz\xFCndung
\u2192 warmes Band am Kronrand

Weitere Krankheiten: Moderhinke, Weisse-Linie-Defekt, Ballenf\xE4ule

\u{1F4CA} E) Ausgabeformat (verpflichtend)

Antworte NUR mit JSON (keine Markdown-Codebl\xF6cke, keine Erkl\xE4rungen):

{
  "diagnosis": "Name der Krankheit oder 'gesund'",
  "confidence": 85,
  "severity": "none/mild/moderate/severe",
  "temperature_zones": "Beschreibung der Temperaturzonen mit Farbbedeutung",
  "disease_probability_scores": {
    "Digitale Dermatitis": 75,
    "Sohlengeschw\xFCr": 10,
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
1 = mild \u2013 beobachten
2 = mittleres Risiko \u2013 Kontrolle empfohlen
3 = hoch \u2013 Klauenpfleger / Tierarzt n\xF6tig

WICHTIG:
- Antworte IMMER auf DEUTSCH
- "confidence" und Wahrscheinlichkeiten sind Werte zwischen 0-100
- Handlungsempfehlungen kurz, klar, landwirtfreundlich
- Wenn die Klaue gesund aussieht, verwende "gesund" als diagnosis`}blobToBase64(n){return new Promise((e,c)=>{let m=new FileReader;m.onloadend=()=>{let g=m.result.split(",")[1];e(g)},m.onerror=c,m.readAsDataURL(n)})}parseGeminiResponse(n){try{let e=n.candidates?.[0]?.content?.parts?.[0]?.text||"";console.log("Gemini text response:",e);let m=e.replace(/```json\n?/g,"").replace(/```\n?/g,"").match(/\{[\s\S]*\}/);if(m){let r=JSON.parse(m[0]),g=r.confidence||0;g>1&&(g=g/100);let C=r.flir_metadata?{cameraModel:r.flir_metadata.camera_model,cameraSerial:r.flir_metadata.camera_serial,minTemp:r.flir_metadata.min_temp,maxTemp:r.flir_metadata.max_temp,centerTemp:r.flir_metadata.center_temp,emissivity:r.flir_metadata.emissivity,reflectedTemperature:r.flir_metadata.reflected_temperature,atmosphericTemperature:r.flir_metadata.atmospheric_temperature,relativeHumidity:r.flir_metadata.relative_humidity,distance:r.flir_metadata.distance,timestamp:r.flir_metadata.timestamp?new Date(r.flir_metadata.timestamp):void 0,width:r.flir_metadata.width,height:r.flir_metadata.height}:void 0;return{diagnosis:r.diagnosis||"Unbekannt",confidence:g,summary:r.summary||"",affectedAreas:r.affected_areas||[],recommendations:r.recommendations||[],severity:this.mapSeverity(r.severity),requiresVeterinaryAttention:r.requires_veterinary_attention||!1,temperatureZones:r.temperature_zones,diseaseProbabilityScores:r.disease_probability_scores,lamenessProbability:r.lameness_probability,urgencyLevel:r.urgency_level,uncertainties:r.uncertainties,flirMetadata:C}}return console.warn("No JSON found in Gemini response, using mock data"),this.getMockAnalysisResult()}catch(e){return console.error("Failed to parse Gemini response:",e),this.getMockAnalysisResult()}}mapSeverity(n){if(!n)return"none";let e=n.toLowerCase();return e.includes("keine")||e.includes("gesund")?"none":e.includes("leicht")||e.includes("gering")?"mild":e.includes("mittel")||e.includes("m\xE4ssig")?"moderate":e.includes("schwer")||e.includes("stark")?"severe":e.includes("none")?"none":e.includes("mild")?"mild":e.includes("moderate")?"moderate":e.includes("severe")?"severe":"none"}getMockAnalysisResult(){return{diagnosis:"gesund",confidence:.92,summary:"Die Klaue zeigt keine Anzeichen von Krankheiten oder Verletzungen. Die Hornqualit\xE4t ist gut und die Anatomie ist normal.",affectedAreas:[],recommendations:["Regelm\xE4ssige Klauenpflege fortsetzen","Auf Ver\xE4nderungen im Gang oder Verhalten achten","N\xE4chste Kontrolle in 3 Monaten einplanen"],severity:"none",requiresVeterinaryAttention:!1,flirMetadata:{cameraModel:"FLIR E8 (Mock)",minTemp:32.5,maxTemp:38.2,centerTemp:35.4,emissivity:.95,relativeHumidity:65,distance:.5,atmosphericTemperature:20}}}static \u0275fac=function(e){return new(e||t)(S(j),S(J))};static \u0275prov=T({token:t,factory:t.\u0275fac,providedIn:"root"})};function Y(t,n){if(t&1&&(s(0,"div",11),u(1,"img",12),i()),t&2){let e=d();a(),o("src",e.capturedImage,O)}}function Q(t,n){t&1&&(s(0,"div",13)(1,"div",14),u(2,"lucide-icon",15),i(),s(3,"h2"),l(4,"Thermografische Analyse"),i(),s(5,"p"),l(6,"KI-Modell analysiert Temperaturmuster und Klauengesundheit..."),i()())}function ee(t,n){if(t&1){let e=x();s(0,"div",16)(1,"div",17),u(2,"lucide-icon",18),i(),s(3,"h2"),l(4,"Analyse fehlgeschlagen"),i(),s(5,"p"),l(6),i(),s(7,"button",19),f("click",function(){h(e);let m=d();return v(m.retryAnalysis())}),u(8,"lucide-icon",20),l(9," Erneut versuchen "),i()()}if(t&2){let e=d();a(6),_(e.error)}}function te(t,n){if(t&1&&(s(0,"p",42),l(1),i()),t&2){let e=d(2);a(),y(" ",e.analysisResult.summary," ")}}function ne(t,n){if(t&1&&(s(0,"div",26)(1,"span",27),l(2,"Dringlichkeit"),i(),s(3,"span",29),l(4),i()()),t&2){let e=d(2);a(3),A("urgency-"+e.analysisResult.urgencyLevel),a(),y(" ",e.getUrgencyLabel(e.analysisResult.urgencyLevel)," ")}}function ie(t,n){if(t&1&&(s(0,"div",26)(1,"span",27),l(2,"Lahmheitsrisiko"),i(),s(3,"span",29),l(4),i()()),t&2){let e=d(2);a(4),y("",e.analysisResult.lamenessProbability,"%")}}function ae(t,n){if(t&1&&(s(0,"div",56)(1,"span"),l(2),i()()),t&2){let e=d().$implicit;a(2),y("Temperatur: ",e.temperature,"\xB0C")}}function re(t,n){if(t&1&&(s(0,"div",50)(1,"div",51)(2,"span",52),l(3),i(),s(4,"div",53),u(5,"span",54),i()(),p(6,ae,3,1,"div",55),i()),t&2){let e=n.$implicit;a(3),_(e.name),a(2),A("severity-level-"+e.severity),a(),o("ngIf",e.temperature)}}function se(t,n){if(t&1&&(s(0,"div",47)(1,"div",48),p(2,re,7,4,"div",49),i()()),t&2){let e=d(3);a(2),o("ngForOf",e.analysisResult.affectedAreas)}}function le(t,n){if(t&1){let e=x();s(0,"div",43)(1,"h3",44),f("click",function(){h(e);let m=d(2);return v(m.toggleSection("affectedAreas"))}),s(2,"span"),l(3,"Betroffene Bereiche"),i(),u(4,"lucide-icon",45),i(),p(5,se,3,1,"div",46),i()}if(t&2){let e=d(2);a(4),o("name",e.showAffectedAreas?"chevron-up":"chevron-down"),a(),o("ngIf",e.showAffectedAreas)}}function oe(t,n){if(t&1&&(s(0,"li"),l(1),i()),t&2){let e=n.$implicit;a(),_(e)}}function ce(t,n){if(t&1&&(s(0,"div",47)(1,"ul",57),p(2,oe,2,1,"li",58),i()()),t&2){let e=d(3);a(2),o("ngForOf",e.analysisResult.recommendations)}}function de(t,n){if(t&1){let e=x();s(0,"div",43)(1,"h3",44),f("click",function(){h(e);let m=d(2);return v(m.toggleSection("recommendations"))}),s(2,"span"),l(3,"Empfehlungen"),i(),u(4,"lucide-icon",45),i(),p(5,ce,3,1,"div",46),i()}if(t&2){let e=d(2);a(4),o("name",e.showRecommendations?"chevron-up":"chevron-down"),a(),o("ngIf",e.showRecommendations)}}function me(t,n){if(t&1&&(s(0,"div",61)(1,"span",27),l(2,"Kameramodell"),i(),s(3,"span",29),l(4),i()()),t&2){let e=d(4);a(4),_(e.analysisResult.flirMetadata.cameraModel)}}function pe(t,n){if(t&1&&(s(0,"div",61)(1,"span",27),l(2,"Temperaturbereich"),i(),s(3,"span",29),l(4),i()()),t&2){let e=d(4);a(4),P("",e.analysisResult.flirMetadata.minTemp.toFixed(1),"\xB0C - ",e.analysisResult.flirMetadata.maxTemp.toFixed(1),"\xB0C")}}function ue(t,n){if(t&1&&(s(0,"div",61)(1,"span",27),l(2,"Zentrumstemperatur"),i(),s(3,"span",29),l(4),i()()),t&2){let e=d(4);a(4),y("",e.analysisResult.flirMetadata.centerTemp.toFixed(1),"\xB0C")}}function ge(t,n){if(t&1&&(s(0,"div",61)(1,"span",27),l(2,"Emissionsgrad"),i(),s(3,"span",29),l(4),i()()),t&2){let e=d(4);a(4),_(e.analysisResult.flirMetadata.emissivity)}}function _e(t,n){if(t&1&&(s(0,"div",61)(1,"span",27),l(2,"Luftfeuchtigkeit"),i(),s(3,"span",29),l(4),i()()),t&2){let e=d(4);a(4),y("",e.analysisResult.flirMetadata.relativeHumidity,"%")}}function fe(t,n){if(t&1&&(s(0,"div",61)(1,"span",27),l(2,"Messabstand"),i(),s(3,"span",29),l(4),i()()),t&2){let e=d(4);a(4),y("",e.analysisResult.flirMetadata.distance,"m")}}function he(t,n){if(t&1&&(s(0,"div",47)(1,"div",59),p(2,me,5,1,"div",60)(3,pe,5,2,"div",60)(4,ue,5,1,"div",60)(5,ge,5,1,"div",60)(6,_e,5,1,"div",60)(7,fe,5,1,"div",60),i()()),t&2){let e=d(3);a(2),o("ngIf",e.analysisResult.flirMetadata.cameraModel),a(),o("ngIf",e.analysisResult.flirMetadata.minTemp!==void 0&&e.analysisResult.flirMetadata.maxTemp!==void 0),a(),o("ngIf",e.analysisResult.flirMetadata.centerTemp!==void 0),a(),o("ngIf",e.analysisResult.flirMetadata.emissivity!==void 0),a(),o("ngIf",e.analysisResult.flirMetadata.relativeHumidity!==void 0),a(),o("ngIf",e.analysisResult.flirMetadata.distance!==void 0)}}function ve(t,n){if(t&1){let e=x();s(0,"div",43)(1,"h3",44),f("click",function(){h(e);let m=d(2);return v(m.toggleSection("flirMetadata"))}),s(2,"span"),l(3,"FLIR-Metadaten"),i(),u(4,"lucide-icon",45),i(),p(5,he,8,6,"div",46),i()}if(t&2){let e=d(2);a(4),o("name",e.showFlirMetadata?"chevron-up":"chevron-down"),a(),o("ngIf",e.showFlirMetadata)}}function ye(t,n){if(t&1&&(s(0,"li"),l(1),i()),t&2){let e=d(4);a(),_(e.analysisResult.thermalData==null||e.analysisResult.thermalData.criticalFindings==null?null:e.analysisResult.thermalData.criticalFindings.maxTempDescription)}}function xe(t,n){if(t&1&&(s(0,"li"),l(1),i()),t&2){let e=d(4);a(),P("",e.analysisResult.thermalData==null||e.analysisResult.thermalData.criticalFindings==null?null:e.analysisResult.thermalData.criticalFindings.extremeHotspotsPercent,"% extreme Hotspots ",e.analysisResult.thermalData==null||e.analysisResult.thermalData.criticalFindings==null?null:e.analysisResult.thermalData.criticalFindings.extremeHotspotsLocation)}}function be(t,n){if(t&1&&(s(0,"li"),l(1),i()),t&2){let e=d(4);a(),P("",e.analysisResult.thermalData==null||e.analysisResult.thermalData.criticalFindings==null?null:e.analysisResult.thermalData.criticalFindings.asymmetryDegrees,"\xB0C ",e.analysisResult.thermalData==null||e.analysisResult.thermalData.criticalFindings==null?null:e.analysisResult.thermalData.criticalFindings.asymmetryDescription)}}function Ce(t,n){if(t&1&&(s(0,"li"),l(1),i()),t&2){let e=d(4);a(),y("",e.analysisResult.thermalData==null||e.analysisResult.thermalData.criticalFindings==null?null:e.analysisResult.thermalData.criticalFindings.elevatedAreaPercent,"% der Klaue zeigt erh\xF6hte Temperaturen")}}function we(t,n){if(t&1&&(s(0,"li"),l(1),i()),t&2){let e=d(4);a(),_(e.analysisResult.thermalData==null||e.analysisResult.thermalData.criticalFindings==null?null:e.analysisResult.thermalData.criticalFindings.temperatureBoundaries)}}function Me(t,n){if(t&1&&(s(0,"div",47)(1,"ul",63),p(2,ye,2,1,"li",64)(3,xe,2,2,"li",64)(4,be,2,2,"li",64)(5,Ce,2,1,"li",64)(6,we,2,1,"li",64),i()()),t&2){let e=d(3);a(2),o("ngIf",e.analysisResult.thermalData==null||e.analysisResult.thermalData.criticalFindings==null?null:e.analysisResult.thermalData.criticalFindings.maxTempDescription),a(),o("ngIf",(e.analysisResult.thermalData==null||e.analysisResult.thermalData.criticalFindings==null?null:e.analysisResult.thermalData.criticalFindings.extremeHotspotsPercent)!==void 0),a(),o("ngIf",(e.analysisResult.thermalData==null||e.analysisResult.thermalData.criticalFindings==null?null:e.analysisResult.thermalData.criticalFindings.asymmetryDegrees)!==void 0),a(),o("ngIf",(e.analysisResult.thermalData==null||e.analysisResult.thermalData.criticalFindings==null?null:e.analysisResult.thermalData.criticalFindings.elevatedAreaPercent)!==void 0),a(),o("ngIf",e.analysisResult.thermalData==null||e.analysisResult.thermalData.criticalFindings==null?null:e.analysisResult.thermalData.criticalFindings.temperatureBoundaries)}}function ke(t,n){if(t&1){let e=x();s(0,"div",62)(1,"h3",44),f("click",function(){h(e);let m=d(2);return v(m.toggleSection("criticalFindings"))}),s(2,"span"),l(3,"Kritische Befunde"),i(),u(4,"lucide-icon",45),i(),p(5,Me,7,5,"div",46),i()}if(t&2){let e=d(2);a(4),o("name",e.showCriticalFindings?"chevron-up":"chevron-down"),a(),o("ngIf",e.showCriticalFindings)}}function Ae(t,n){if(t&1&&(s(0,"li"),l(1),i()),t&2){let e=n.$implicit;a(),_(e)}}function Pe(t,n){if(t&1&&(s(0,"div",47)(1,"ul",66),p(2,Ae,2,1,"li",58),i()()),t&2){let e=d(3);a(2),o("ngForOf",e.analysisResult.thermalData==null||e.analysisResult.thermalData.diseasePatterns[0]==null?null:e.analysisResult.thermalData.diseasePatterns[0].indicators)}}function ze(t,n){if(t&1){let e=x();s(0,"div",65)(1,"h3",44),f("click",function(){h(e);let m=d(2);return v(m.toggleSection("diseasePatterns"))}),s(2,"span"),l(3),i(),u(4,"lucide-icon",45),i(),p(5,Pe,3,1,"div",46),i()}if(t&2){let e=d(2);a(3),y("Typisch f\xFCr ",e.analysisResult.thermalData==null||e.analysisResult.thermalData.diseasePatterns[0]==null?null:e.analysisResult.thermalData.diseasePatterns[0].diseaseName),a(),o("name",e.showDiseasePatterns?"chevron-up":"chevron-down"),a(),o("ngIf",e.showDiseasePatterns)}}function Re(t,n){if(t&1&&(s(0,"div",47)(1,"p",67),l(2),i()()),t&2){let e=d(3);a(2),_(e.analysisResult.temperatureZones)}}function Se(t,n){if(t&1){let e=x();s(0,"div",43)(1,"h3",44),f("click",function(){h(e);let m=d(2);return v(m.toggleSection("temperatureZones"))}),s(2,"span"),l(3,"Temperaturzonen"),i(),u(4,"lucide-icon",45),i(),p(5,Re,3,1,"div",46),i()}if(t&2){let e=d(2);a(4),o("name",e.showTemperatureZones?"chevron-up":"chevron-down"),a(),o("ngIf",e.showTemperatureZones)}}function Ie(t,n){if(t&1&&(s(0,"div",70)(1,"span",71),l(2),i(),s(3,"span",72),l(4),i()()),t&2){let e=n.$implicit,c=d(4);a(2),_(e),a(2),y("",c.analysisResult.diseaseProbabilityScores[e],"%")}}function Te(t,n){if(t&1&&(s(0,"div",47)(1,"div",68),p(2,Ie,5,2,"div",69),i()()),t&2){let e=d(3);a(2),o("ngForOf",e.Object.keys(e.analysisResult.diseaseProbabilityScores))}}function Oe(t,n){if(t&1){let e=x();s(0,"div",43)(1,"h3",44),f("click",function(){h(e);let m=d(2);return v(m.toggleSection("probabilityScores"))}),s(2,"span"),l(3,"Wahrscheinlichkeiten"),i(),u(4,"lucide-icon",45),i(),p(5,Te,3,1,"div",46),i()}if(t&2){let e=d(2);a(4),o("name",e.showProbabilityScores?"chevron-up":"chevron-down"),a(),o("ngIf",e.showProbabilityScores)}}function Ee(t,n){if(t&1&&(s(0,"div",47)(1,"p",67),l(2),i()()),t&2){let e=d(3);a(2),_(e.analysisResult.uncertainties)}}function De(t,n){if(t&1){let e=x();s(0,"div",73)(1,"h3",44),f("click",function(){h(e);let m=d(2);return v(m.toggleSection("uncertainties"))}),s(2,"span"),l(3,"Einschr\xE4nkungen"),i(),u(4,"lucide-icon",45),i(),p(5,Ee,3,1,"div",46),i()}if(t&2){let e=d(2);a(4),o("name",e.showUncertainties?"chevron-up":"chevron-down"),a(),o("ngIf",e.showUncertainties)}}function Fe(t,n){if(t&1){let e=x();s(0,"div",21)(1,"div",22)(2,"span",23),l(3),i()(),s(4,"h2"),l(5,"Erstanalyse"),i(),p(6,te,2,1,"p",24),s(7,"div",25)(8,"div",26)(9,"span",27),l(10,"Diagnose"),i(),s(11,"span",28),l(12),F(13,"titlecase"),i()(),s(14,"div",26)(15,"span",27),l(16,"Konfidenz"),i(),s(17,"span",29),l(18),i()(),s(19,"div",26)(20,"span",27),l(21,"Schweregrad"),i(),s(22,"div",30),u(23,"span",31),s(24,"span",29),l(25),i()()(),p(26,ne,5,3,"div",32)(27,ie,5,1,"div",32),i(),p(28,le,6,2,"div",33)(29,de,6,2,"div",33)(30,ve,6,2,"div",33)(31,ke,6,2,"div",34)(32,ze,6,3,"div",35)(33,Se,6,2,"div",33)(34,Oe,6,2,"div",33)(35,De,6,2,"div",36),s(36,"div",37)(37,"button",38),f("click",function(){h(e);let m=d();return v(m.sendFeedback("up"))}),u(38,"lucide-icon",39),s(39,"span"),l(40,"Hilfreich"),i()(),s(41,"button",40),f("click",function(){h(e);let m=d();return v(m.sendFeedback("down"))}),u(42,"lucide-icon",41),s(43,"span"),l(44,"Nicht hilfreich"),i()()()()}if(t&2){let e=d();a(),D("warning",e.analysisResult.diagnosis!=="gesund"),a(2),_(e.analysisResult.diagnosis!=="gesund"?"Befund erkannt":"Keine Auff\xE4lligkeiten"),a(3),o("ngIf",e.analysisResult.summary),a(6),_(B(13,19,e.analysisResult.diagnosis)),a(6),y("",(e.analysisResult.confidence*100).toFixed(0),"%"),a(5),A("severity-"+e.analysisResult.severity),a(2),_(e.getSeverityLabel(e.analysisResult.severity)),a(),o("ngIf",e.analysisResult.urgencyLevel!==void 0),a(),o("ngIf",e.analysisResult.lamenessProbability!==void 0),a(),o("ngIf",e.analysisResult.affectedAreas&&e.analysisResult.affectedAreas.length>0),a(),o("ngIf",e.analysisResult.recommendations.length>0),a(),o("ngIf",e.analysisResult.flirMetadata&&e.hasFlirData(e.analysisResult.flirMetadata)),a(),o("ngIf",(e.analysisResult.thermalData==null?null:e.analysisResult.thermalData.criticalFindings)&&e.hasCriticalFindings(e.analysisResult.thermalData==null?null:e.analysisResult.thermalData.criticalFindings)),a(),o("ngIf",(e.analysisResult.thermalData==null?null:e.analysisResult.thermalData.diseasePatterns)&&((e.analysisResult.thermalData==null||e.analysisResult.thermalData.diseasePatterns==null?null:e.analysisResult.thermalData.diseasePatterns.length)||0)>0),a(),o("ngIf",e.analysisResult.temperatureZones),a(),o("ngIf",e.analysisResult.diseaseProbabilityScores&&e.Object.keys(e.analysisResult.diseaseProbabilityScores).length>0),a(),o("ngIf",e.analysisResult.uncertainties)}}var $=class t{constructor(n,e,c,m){this.aiAnalysisService=n;this.imageTransferService=e;this.storageService=c;this.router=m}isAnalyzing=!0;error=null;analysisResult=null;capturedImage=null;showCriticalFindings=!0;showDiseasePatterns=!0;showAffectedAreas=!1;showRecommendations=!1;showFlirMetadata=!1;showTemperatureZones=!1;showProbabilityScores=!1;showUncertainties=!1;ngOnInit(){console.log("AnalyzingComponent ngOnInit called");let n=this.imageTransferService.getImage();if(console.log("Image blob from service:",n),n){console.log("Image blob received, size:",n.size);let e=new FileReader;e.onload=c=>{this.capturedImage=c.target?.result,console.log("Image converted to data URL")},e.readAsDataURL(n),this.analyzeImage(n)}else console.error("No image blob from transfer service"),this.error="No image to analyze",this.isAnalyzing=!1}analyzeImage(n){return b(this,null,function*(){try{console.log("Starting analysis..."),this.isAnalyzing=!0,this.error=null,console.log("Calling AI analysis service..."),this.analysisResult=yield this.aiAnalysisService.analyze(n),console.log("Analysis complete:",this.analysisResult),console.log("FLIR Metadata:",this.analysisResult?.flirMetadata),console.log("Has FLIR data:",this.hasFlirData(this.analysisResult?.flirMetadata)),this.capturedImage&&this.analysisResult&&(yield this.storageService.saveAnalysis(this.capturedImage,this.analysisResult),console.log("Analysis saved to IndexedDB")),this.isAnalyzing=!1}catch(e){console.error("Analysis error:",e),this.error=e.message||"Failed to analyze image",this.isAnalyzing=!1}})}goToResults(){this.analysisResult&&this.router.navigate(["/results"],{state:{analysisResult:this.analysisResult,capturedImage:this.capturedImage}})}retryAnalysis(){this.router.navigate(["/camera"])}goHome(){this.router.navigate(["/home"])}getUrgencyLabel(n){return["Kein Befund","Beobachten","Kontrolle empfohlen","Tierarzt n\xF6tig"][n]||"Unbekannt"}getSeverityLabel(n){return{none:"Keine",mild:"Leicht",moderate:"Mittel",severe:"Schwer"}[n]||n}hasFlirData(n){return n?!!(n.cameraModel||n.minTemp!==void 0||n.maxTemp!==void 0||n.centerTemp!==void 0||n.emissivity!==void 0||n.relativeHumidity!==void 0||n.distance!==void 0):!1}hasCriticalFindings(n){return n?!!(n.maxTemperature!==void 0||n.extremeHotspotsPercent!==void 0||n.asymmetryDegrees!==void 0||n.elevatedAreaPercent!==void 0||n.temperatureBoundaries):!1}toggleSection(n){switch(n){case"criticalFindings":this.showCriticalFindings=!this.showCriticalFindings;break;case"diseasePatterns":this.showDiseasePatterns=!this.showDiseasePatterns;break;case"affectedAreas":this.showAffectedAreas=!this.showAffectedAreas;break;case"recommendations":this.showRecommendations=!this.showRecommendations;break;case"flirMetadata":this.showFlirMetadata=!this.showFlirMetadata;break;case"temperatureZones":this.showTemperatureZones=!this.showTemperatureZones;break;case"probabilityScores":this.showProbabilityScores=!this.showProbabilityScores;break;case"uncertainties":this.showUncertainties=!this.showUncertainties;break}}sendFeedback(n){console.log("Feedback:",n,"for analysis:",this.analysisResult?.diagnosis),alert(`Vielen Dank f\xFCr dein Feedback! (${n==="up"?"\u{1F44D}":"\u{1F44E}"})`)}Object=Object;static \u0275fac=function(e){return new(e||t)(w(z),w(W),w(Z),w(N))};static \u0275cmp=E({type:t,selectors:[["app-analyzing"]],decls:12,vars:4,consts:[[1,"analyzing-container"],[1,"app-header"],[1,"btn-icon-header",3,"click"],["name","x"],[1,"app-title"],[1,"placeholder"],[1,"analyzing-main"],["class","image-preview",4,"ngIf"],["class","status-card",4,"ngIf"],["class","status-card error-card",4,"ngIf"],["class","results-preview",4,"ngIf"],[1,"image-preview"],["alt","Aufgenommenes Klauenbild",3,"src"],[1,"status-card"],[1,"loading-spinner"],["name","loader-2",1,"loading-icon","animate-spin"],[1,"status-card","error-card"],[1,"error-icon"],["name","alert-circle"],[1,"btn","btn-primary",3,"click"],["name","rotate-cw"],[1,"results-preview"],[1,"result-badge"],[1,"badge-text"],["class","summary-text",4,"ngIf"],[1,"result-summary"],[1,"result-item"],[1,"label"],[1,"value","diagnosis"],[1,"value"],[1,"severity-indicator"],[1,"severity-circle"],["class","result-item",4,"ngIf"],["class","info-section accordion-section",4,"ngIf"],["class","info-section accordion-section critical-findings",4,"ngIf"],["class","info-section accordion-section disease-patterns",4,"ngIf"],["class","info-section accordion-section uncertainties",4,"ngIf"],[1,"feedback-buttons"],[1,"btn","btn-feedback","btn-thumbs-up",3,"click"],["name","thumbs-up"],[1,"btn","btn-feedback","btn-thumbs-down",3,"click"],["name","thumbs-down"],[1,"summary-text"],[1,"info-section","accordion-section"],[1,"accordion-header",3,"click"],[3,"name"],["class","accordion-content",4,"ngIf"],[1,"accordion-content"],[1,"affected-areas-list"],["class","affected-area-item",4,"ngFor","ngForOf"],[1,"affected-area-item"],[1,"area-header"],[1,"area-name"],[1,"area-severity-indicator"],[1,"severity-circle-area"],["class","area-temp",4,"ngIf"],[1,"area-temp"],[1,"recommendations-list"],[4,"ngFor","ngForOf"],[1,"metadata-grid"],["class","metadata-item",4,"ngIf"],[1,"metadata-item"],[1,"info-section","accordion-section","critical-findings"],[1,"findings-list"],[4,"ngIf"],[1,"info-section","accordion-section","disease-patterns"],[1,"pattern-list"],[1,"info-text"],[1,"probability-list"],["class","probability-item",4,"ngFor","ngForOf"],[1,"probability-item"],[1,"disease-name"],[1,"probability-value"],[1,"info-section","accordion-section","uncertainties"]],template:function(e,c){e&1&&(s(0,"div",0)(1,"header",1)(2,"button",2),f("click",function(){return c.goHome()}),u(3,"lucide-icon",3),i(),s(4,"h1",4),l(5,"Analyse"),i(),u(6,"div",5),i(),s(7,"main",6),p(8,Y,2,1,"div",7)(9,Q,7,0,"div",8)(10,ee,10,1,"div",9)(11,Fe,45,21,"div",10),i()()),e&2&&(a(8),o("ngIf",c.capturedImage),a(),o("ngIf",c.isAnalyzing),a(),o("ngIf",c.error&&!c.isAnalyzing),a(),o("ngIf",c.analysisResult&&!c.isAnalyzing&&!c.error))},dependencies:[V,K,L,G,U,H],styles:['.analyzing-container[_ngcontent-%COMP%]{min-height:100vh;background-color:var(--surface-0);display:flex;flex-direction:column}.app-header[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;background-color:#fff;border-bottom:1px solid var(--surface-200)}.app-title[_ngcontent-%COMP%]{font-size:1.125rem;font-weight:700;color:var(--text-900);margin:0;letter-spacing:-.02em}.btn-icon-header[_ngcontent-%COMP%]{width:40px;height:40px;border-radius:50%;border:none;background-color:transparent;color:var(--text-700);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:1.25rem;transition:background-color .2s}.btn-icon-header[_ngcontent-%COMP%]:hover{background-color:var(--surface-100)}.placeholder[_ngcontent-%COMP%]{width:40px}.analyzing-main[_ngcontent-%COMP%]{flex:1;padding:1.5rem 1.25rem;display:flex;flex-direction:column;gap:1.5rem;max-width:480px;margin:0 auto;width:100%}.image-preview[_ngcontent-%COMP%]{width:100%;aspect-ratio:4/3;border-radius:12px;overflow:hidden;background-color:var(--surface-100)}.image-preview[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:100%;height:100%;object-fit:cover}.status-card[_ngcontent-%COMP%]{background-color:#fff;border-radius:20px;padding:3rem 2rem;text-align:center;box-shadow:0 4px 16px #0000001a;border:1px solid var(--surface-100)}.loading-spinner[_ngcontent-%COMP%]{margin-bottom:2rem;display:flex;justify-content:center}.loading-spinner[_ngcontent-%COMP%]   lucide-icon[_ngcontent-%COMP%]{font-size:56px;color:var(--primary-500)}.loading-icon[_ngcontent-%COMP%]{font-size:56px!important;color:var(--primary-500)}@keyframes _ngcontent-%COMP%_spin{to{transform:rotate(360deg)}}.status-card[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{font-size:1.5rem;font-weight:700;color:var(--text-900);margin:0 0 .5rem;letter-spacing:-.02em}.status-card[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{font-size:1rem;font-weight:500;color:var(--text-600);margin:0;line-height:1.5}.error-card[_ngcontent-%COMP%]   .error-icon[_ngcontent-%COMP%]{display:inline-flex;align-items:center;justify-content:center;width:80px;height:80px;background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:20px;margin-bottom:1.5rem;box-shadow:0 4px 16px #ef44444d}.error-card[_ngcontent-%COMP%]   .error-icon[_ngcontent-%COMP%]   lucide-icon[_ngcontent-%COMP%]{font-size:48px;color:#fff}.error-card[_ngcontent-%COMP%]   .btn[_ngcontent-%COMP%]{margin-top:1.5rem}.results-preview[_ngcontent-%COMP%]{background-color:#fff;border-radius:20px;padding:2.5rem 2rem;box-shadow:0 4px 16px #0000001a;border:1px solid var(--surface-100);text-align:center}.result-badge[_ngcontent-%COMP%]{display:inline-block;padding:.5rem 1.25rem;margin-bottom:1rem;border-radius:24px;background-color:var(--primary-50);border:1px solid var(--primary-200)}.result-badge.warning[_ngcontent-%COMP%]{background-color:#fff7ed;border:1px solid #fed7aa}.badge-text[_ngcontent-%COMP%]{font-size:.875rem;font-weight:600;color:var(--primary-700);letter-spacing:.025em}.result-badge.warning[_ngcontent-%COMP%]   .badge-text[_ngcontent-%COMP%]{color:#9a3412}.results-preview[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{font-size:1.5rem;font-weight:700;color:var(--text-900);margin:0 0 1rem;letter-spacing:-.02em}.summary-text[_ngcontent-%COMP%]{font-size:1rem;font-weight:500;color:var(--text-700);line-height:1.6;margin:0 0 1.5rem;text-align:center}.result-summary[_ngcontent-%COMP%]{display:flex;flex-direction:column;gap:1rem;margin-bottom:1.5rem;text-align:left}.result-item[_ngcontent-%COMP%]{display:flex;flex-direction:column;gap:.5rem;padding:1rem;background-color:var(--surface-50);border-radius:8px}.result-item[_ngcontent-%COMP%]   .label[_ngcontent-%COMP%]{font-size:.875rem;color:var(--text-600);font-weight:600}.result-item[_ngcontent-%COMP%]   .value[_ngcontent-%COMP%]{font-size:1.125rem;color:var(--text-900);font-weight:500}.result-item[_ngcontent-%COMP%]   .value.diagnosis[_ngcontent-%COMP%]{text-transform:capitalize}.severity-indicator[_ngcontent-%COMP%]{display:flex;align-items:center;gap:.625rem}.severity-circle[_ngcontent-%COMP%]{width:12px;height:12px;border-radius:50%;flex-shrink:0}.severity-circle.severity-none[_ngcontent-%COMP%]{background-color:#d1d5db}.severity-circle.severity-mild[_ngcontent-%COMP%]{background-color:#fbbf24}.severity-circle.severity-moderate[_ngcontent-%COMP%]{background-color:#f97316}.severity-circle.severity-severe[_ngcontent-%COMP%]{background-color:#dc2626}.urgency-0[_ngcontent-%COMP%]{color:var(--primary-500)}.urgency-1[_ngcontent-%COMP%]{color:#ca8a04}.urgency-2[_ngcontent-%COMP%]{color:#ea580c}.urgency-3[_ngcontent-%COMP%]{color:#dc2626}.info-section[_ngcontent-%COMP%]{text-align:left}.info-section[_ngcontent-%COMP%]:not(.accordion-section){margin-bottom:1.5rem}.info-section[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%]{font-size:1rem;font-weight:700;color:var(--text-900);margin:0 0 .75rem;letter-spacing:-.01em}.info-text[_ngcontent-%COMP%]{font-size:.9375rem;font-weight:500;color:var(--text-700);line-height:1.6;margin:0}.metadata-grid[_ngcontent-%COMP%]{display:grid;grid-template-columns:1fr;gap:.75rem}.metadata-item[_ngcontent-%COMP%]{display:flex;flex-direction:column;gap:.25rem;padding:.75rem;background-color:var(--surface-50);border-radius:8px;border:1px solid var(--surface-200)}.metadata-item[_ngcontent-%COMP%]   .label[_ngcontent-%COMP%]{font-size:.75rem;font-weight:600;color:var(--text-600);text-transform:uppercase;letter-spacing:.025em}.metadata-item[_ngcontent-%COMP%]   .value[_ngcontent-%COMP%]{font-size:.9375rem;font-weight:500;color:var(--primary-600)}.probability-list[_ngcontent-%COMP%]{display:flex;flex-direction:column;gap:.5rem}.probability-item[_ngcontent-%COMP%]{display:flex;justify-content:space-between;align-items:center;padding:.5rem .75rem;background-color:var(--surface-50);border-radius:6px}.disease-name[_ngcontent-%COMP%]{font-size:1rem;font-weight:500;color:var(--text-700)}.probability-value[_ngcontent-%COMP%]{font-size:.875rem;font-weight:500;color:var(--text-900)}.uncertainties[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%]{color:var(--text-900)}.uncertainties[_ngcontent-%COMP%]   .info-text[_ngcontent-%COMP%]{color:var(--text-700)}.recommendations-list[_ngcontent-%COMP%]{list-style:none;padding:0;margin:0}.recommendations-list[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]{font-size:.9375rem;font-weight:500;color:var(--text-700);padding:.5rem 0 .5rem 1.5rem;position:relative;line-height:1.5}.recommendations-list[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]:before{content:"\\2022";position:absolute;left:.5rem;color:var(--primary-500);font-weight:700}.affected-areas-list[_ngcontent-%COMP%]{display:flex;flex-direction:column;gap:.75rem}.affected-area-item[_ngcontent-%COMP%]{padding:.875rem;background-color:var(--surface-50);border-radius:8px;border:1px solid var(--surface-200)}.area-header[_ngcontent-%COMP%]{display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem}.area-name[_ngcontent-%COMP%]{font-size:.9375rem;font-weight:600;color:var(--text-900)}.area-severity-indicator[_ngcontent-%COMP%]{display:flex;align-items:center}.severity-circle-area[_ngcontent-%COMP%]{width:12px;height:12px;border-radius:50%;flex-shrink:0}.severity-circle-area.severity-level-1[_ngcontent-%COMP%]{background-color:#d1d5db}.severity-circle-area.severity-level-2[_ngcontent-%COMP%]{background-color:#fbbf24}.severity-circle-area.severity-level-3[_ngcontent-%COMP%]{background-color:#fb923c}.severity-circle-area.severity-level-4[_ngcontent-%COMP%]{background-color:#f97316}.severity-circle-area.severity-level-5[_ngcontent-%COMP%]{background-color:#dc2626}.area-temp[_ngcontent-%COMP%]{font-size:.875rem;color:var(--text-600)}.alert-box[_ngcontent-%COMP%]{display:flex;align-items:center;gap:.75rem;padding:.875rem 1rem;background-color:#fef2f2;border:1px solid #fca5a5;border-radius:8px;margin-bottom:1.5rem;color:#7f1d1d;font-size:.875rem;font-weight:600;text-align:left}.alert-box[_ngcontent-%COMP%]   lucide-icon[_ngcontent-%COMP%]{color:#dc2626;font-size:20px}.btn[_ngcontent-%COMP%]{width:100%;padding:1rem 1.5rem;border:none;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:.625rem;letter-spacing:-.01em}.btn[_ngcontent-%COMP%]   lucide-icon[_ngcontent-%COMP%]{font-size:20px}.btn-primary[_ngcontent-%COMP%]{background-color:var(--primary-500);color:#fff}.btn-primary[_ngcontent-%COMP%]:hover{background-color:var(--primary-600);transform:translateY(-1px);box-shadow:0 4px 12px #00945640}.btn-primary[_ngcontent-%COMP%]:active{transform:translateY(0)}.feedback-buttons[_ngcontent-%COMP%]{display:flex;gap:1rem;margin-top:1.5rem}.btn-feedback[_ngcontent-%COMP%]{flex:1;padding:.875rem 1.25rem;border:1px solid var(--surface-200);border-radius:12px;background-color:#fff;color:var(--text-700);font-size:.9375rem;font-weight:500;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:.5rem}.btn-feedback[_ngcontent-%COMP%]   lucide-icon[_ngcontent-%COMP%]{font-size:20px}.btn-thumbs-up[_ngcontent-%COMP%]:hover{background-color:var(--primary-50);border-color:var(--primary-500);color:var(--primary-700)}.btn-thumbs-down[_ngcontent-%COMP%]:hover{background-color:#fef2f2;border-color:#fca5a5;color:#dc2626}.btn-feedback[_ngcontent-%COMP%]:active{transform:scale(.98)}.critical-findings[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%]{color:#991b1b;font-size:1rem;font-weight:700;margin-bottom:.75rem}.findings-list[_ngcontent-%COMP%]{list-style:none;padding:0;margin:0}.findings-list[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]{font-size:.9375rem;color:#991b1b;padding:.375rem 0 .375rem 1.25rem;position:relative;line-height:1.5}.findings-list[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]:before{content:"\\2022";position:absolute;left:.25rem;color:#991b1b;font-weight:700}.disease-patterns[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%]{color:var(--text-900);font-size:1rem;font-weight:700;margin-bottom:.75rem}.pattern-list[_ngcontent-%COMP%]{list-style:none;padding:0;margin:0}.pattern-list[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]{font-size:.9375rem;color:var(--text-700);padding:.375rem 0 .375rem 1.25rem;position:relative;line-height:1.5}.pattern-list[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]:before{content:"\\2713";position:absolute;left:.25rem;color:var(--primary-600);font-weight:700}.accordion-section[_ngcontent-%COMP%]{overflow:hidden;border-top:1px solid var(--surface-200);padding-top:.5rem;margin-top:.5rem;padding-bottom:.5rem}.accordion-header[_ngcontent-%COMP%]{display:flex;align-items:center;justify-content:space-between;cursor:pointer;-webkit-user-select:none;user-select:none;padding:.75rem .5rem;margin:0 -.5rem;border-radius:8px;transition:all .2s}.accordion-header[_ngcontent-%COMP%]:hover{background-color:var(--surface-50);color:var(--primary-600)}.accordion-header[_ngcontent-%COMP%]   lucide-icon[_ngcontent-%COMP%]{font-size:20px;transition:transform .2s;color:var(--text-600);flex-shrink:0}.accordion-content[_ngcontent-%COMP%]{animation:_ngcontent-%COMP%_slideDown .2s ease-out}@keyframes _ngcontent-%COMP%_slideDown{0%{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}']})};export{$ as AnalyzingComponent};
