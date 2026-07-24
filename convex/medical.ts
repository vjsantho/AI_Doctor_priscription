import { query, mutation, action, internalQuery, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.CONVEX_OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_KEY ? undefined : process.env.CONVEX_OPENAI_BASE_URL,
});

export const createConsultation = mutation({
  args: {
    patientAge: v.number(),
    patientSex: v.string(),
    chiefComplaint: v.string(),
    symptoms: v.array(v.object({
      symptom: v.string(),
      duration: v.string(),
      severity: v.string(),
      description: v.string()
    })),
    medicalHistory: v.optional(v.string()),
    medications: v.optional(v.string()),
    vitals: v.optional(v.object({
      temperature: v.optional(v.string()),
      bloodPressure: v.optional(v.string()),
      heartRate: v.optional(v.string()),
      respiratoryRate: v.optional(v.string())
    }))
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Check for emergency keywords
    const emergencyKeywords = [
      "chest pain", "difficulty breathing", "severe headache", "loss of consciousness",
      "severe bleeding", "stroke", "heart attack", "suicide", "overdose",
      "severe abdominal pain", "high fever", "seizure", "allergic reaction",
      "can't breathe", "crushing chest pain", "sudden weakness", "slurred speech"
    ];

    const allText = `${args.chiefComplaint} ${args.symptoms.map(s => `${s.symptom} ${s.description}`).join(" ")}`.toLowerCase();
    const isEmergency = emergencyKeywords.some(keyword => allText.includes(keyword));

    const consultationId = await ctx.db.insert("consultations", {
      userId,
      patientAge: args.patientAge,
      patientSex: args.patientSex,
      chiefComplaint: args.chiefComplaint,
      symptoms: args.symptoms,
      medicalHistory: args.medicalHistory,
      medications: args.medications,
      vitals: args.vitals,
      isEmergency,
      status: isEmergency ? "emergency" : "pending_analysis",
      messages: []
    });

    // Start AI analysis immediately
    await ctx.scheduler.runAfter(0, internal.medical.performAIAnalysis, {
      consultationId
    });

    return consultationId;
  }
});

export const performAIAnalysis = internalAction({
  args: {
    consultationId: v.id("consultations")
  },
  handler: async (ctx, args) => {
    const consultation = await ctx.runQuery(internal.medical.getConsultationInternal, {
      consultationId: args.consultationId
    });

    if (!consultation) {
      throw new Error("Consultation not found");
    }

    if (consultation.isEmergency) {
      const emergencyAnalysis = {
        clinicalObservations: "🚨 EMERGENCY SYMPTOMS DETECTED - Immediate medical attention required.",
        medicalConsiderations: ["Medical emergency requiring immediate evaluation"],
        riskLevel: "CRITICAL",
        recommendedActions: [
          "🚨 CALL 911 IMMEDIATELY",
          "Seek emergency medical care NOW",
          "Do not delay - this is time-sensitive",
          "Have someone drive you to the nearest ER if ambulance is delayed"
        ],
        emergencyWarnings: [
          "This appears to be a medical emergency",
          "Time-sensitive condition requiring immediate care",
          "Do not attempt self-treatment"
        ],
        aiResponse: "I've detected symptoms that suggest a medical emergency. Please call 911 immediately and seek emergency medical care. Do not wait or try to treat this yourself."
      };

      await ctx.runMutation(internal.medical.updateConsultationAnalysis, {
        consultationId: args.consultationId,
        analysis: emergencyAnalysis
      });

      return emergencyAnalysis;
    }

    // Create detailed prompt for AI analysis
    const prompt = createMedicalAnalysisPrompt(consultation);

    try {
      if (!openai.apiKey) {
        throw new Error("OPENAI_API_KEY is not set in Convex environment variables. Please add it in your Convex dashboard.");
      }

      console.log("Starting OpenAI analysis with model: gpt-4o-mini");
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an advanced medical AI assistant providing clinical decision support. You must:
            1. Provide thorough, evidence-based medical analysis
            2. Always emphasize the need for professional medical evaluation
            3. Use clear, professional medical language
            4. Provide specific, actionable recommendations
            5. Include appropriate medical disclaimers
            6. Be empathetic but professional
            
            CRITICAL: You are providing clinical decision support, NOT medical diagnosis. Always recommend professional medical evaluation.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const aiResponse = completion.choices[0].message.content;

      // Parse AI response and create structured analysis
      const analysis = await parseAIResponse(aiResponse || "", consultation);

      await ctx.runMutation(internal.medical.updateConsultationAnalysis, {
        consultationId: args.consultationId,
        analysis: {
          ...analysis,
          aiResponse: aiResponse || "Analysis completed successfully."
        }
      });

      return analysis;
    } catch (error: any) {
      console.error("AI Analysis failed profoundly:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause
      });

      // Special handling for missing API key or common API errors
      const isApiKeyMissing = !openai.apiKey || error.message?.includes("API key");
      const errorDetail = isApiKeyMissing
        ? "Missing OpenAI API Key. Please set OPENAI_API_KEY in your Convex dashboard environment variables."
        : `Connection Error: ${error.message || "Unknown error"}`;

      // Fallback to rule-based analysis
      const fallbackAnalysis = performClinicalAnalysis(consultation);

      await ctx.runMutation(internal.medical.updateConsultationAnalysis, {
        consultationId: args.consultationId,
        analysis: {
          ...fallbackAnalysis,
          aiResponse: `⚠️ AI Analysis Error: ${errorDetail}\n\nFalling back to clinical decision support algorithms.`
        }
      });

      return fallbackAnalysis;
    }
  }
});

export const chatWithAI = action({
  args: {
    consultationId: v.id("consultations"),
    message: v.string()
  },
  handler: async (ctx, args): Promise<string> => {
    const consultation = await ctx.runQuery(internal.medical.getConsultationInternal, {
      consultationId: args.consultationId
    });

    if (!consultation) {
      throw new Error("Consultation not found");
    }

    // Add user message
    await ctx.runMutation(internal.medical.addChatMessage, {
      consultationId: args.consultationId,
      message: {
        role: "user",
        content: args.message,
        timestamp: Date.now()
      }
    });

    // Create context for AI chat
    const chatContext = createChatContext(consultation, args.message);

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are Dr. AI, a compassionate medical AI assistant. Be conversational like ChatGPT but with medical expertise.

APPROACH: Warm, empathetic, professional. Ask follow-up questions. Explain simply. Show genuine concern.

STYLE: Natural conversation. Use "I understand..." "That sounds concerning..." Ask "Can you tell me more about when this started?"

MEDICAL: Emphasize professional evaluation. Never diagnose definitively. Clear about urgent symptoms. Practical advice when appropriate.

Patient: ${JSON.stringify(consultation, null, 2)}`
          },
          ...(consultation.messages || []).map((msg: any) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content
          })),
          {
            role: "user",
            content: args.message
          }
        ],
        temperature: 0.8,
        max_tokens: 1500
      });

      const aiResponse = completion.choices[0].message.content || "I apologize, but I couldn't generate a response. Please try again.";

      // Add AI response
      await ctx.runMutation(internal.medical.addChatMessage, {
        consultationId: args.consultationId,
        message: {
          role: "assistant",
          content: aiResponse,
          timestamp: Date.now()
        }
      });

      return aiResponse;
    } catch (error) {
      console.error("Chat AI failed:", error);
      const fallbackResponse = "I'm sorry, but I'm having trouble processing your request right now. Please consult with a healthcare professional for medical advice.";

      await ctx.runMutation(internal.medical.addChatMessage, {
        consultationId: args.consultationId,
        message: {
          role: "assistant",
          content: fallbackResponse,
          timestamp: Date.now()
        }
      });

      return fallbackResponse;
    }
  }
});

export const analyzePrescription = action({
  args: {
    image: v.string(), // Base64 or URL
  },
  handler: async (ctx, args) => {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // Use a model with vision capabilities
        messages: [
          {
            role: "system",
            content: `You are a medical prescription reading assistant.

Your role is to analyze handwritten or unclear doctor prescriptions and help identify possible medicine names by interpreting the text.

You are NOT a doctor and do NOT prescribe medicine.

Rules:
- Only decode and transcribe what is written.
- If handwriting is unclear, list possible medicine name matches with low confidence.
- Do NOT suggest new medicines.
- Do NOT confirm dosage, diagnosis, or treatment.
- Clearly state when text cannot be reliably identified.

Always assume:
- The prescription was written by a licensed doctor.
- Final confirmation must be done by a pharmacist or doctor.

Output style (JSON format):
{
  "transcription": "The raw text you can decipher from the handwriting...",
  "medicines": [
    {
      "name": "Tablet/Medicine Name",
      "confidence": "High/Medium/Low",
      "dosage": "If visible (e.g., 500mg)",
      "instructions": "If visible (e.g., 1 tablet daily)"
    }
  ],
  "notes": "Any additional notes about legibility or ambiguity.",
  "disclaimer": "The system decodes handwritten prescriptions to identify possible medicine names, while final verification remains with healthcare professionals."
}`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this prescription image and identify the medicines." },
              {
                type: "image_url",
                image_url: {
                  url: args.image,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const responseContent = completion.choices[0].message.content;
      return responseContent ? JSON.parse(responseContent) : null;
    } catch (error) {
      console.error("Prescription analysis failed:", error);
      throw new Error("Failed to analyze prescription");
    }
  }
});

export const analyzeReport = action({
  args: {
    image: v.string(), // Base64 or URL
  },
  handler: async (ctx, args) => {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert medical report analyzer.
            
Your role is to analyze medical reports (lab results, discharge summaries, imaging reports, etc.) and provide a structured summary.

CRITICAL:
- You are NOT a doctor.
- You are providing information extraction, NOT diagnosis.
- Always include disclaimers.

Output style (JSON format):
{
  "summary": "Brief summary of the report type and key context.",
  "findings": [
    {
      "category": "Blood Work / Imaging / Vitals / Etc.",
      "results": [
        {
          "test": "Name of test (e.g., Hemoglobin)",
          "value": "Value found (e.g., 12.5 g/dL)",
          "referenceRange": "Reference range if available",
          "status": "Normal / Abnormal / High / Low / Critical"
        }
      ]
    }
  ],
  "abnormalities": [
    "List of specific abnormal findings with context..."
  ],
  "recommendations": [
    "Suggested next steps based on the report content (e.g., Follow up with cardiologist)"
  ],
  "notes": "Any additional context or observation about the report quality.",
  "disclaimer": "This analysis is for informational purposes only and does not constitute a medical diagnosis. Please consult with a healthcare professional."
}`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this medical report and extract key information." },
              {
                type: "image_url",
                image_url: {
                  url: args.image,
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
      });

      const responseContent = completion.choices[0].message.content;
      return responseContent ? JSON.parse(responseContent) : null;
    } catch (error) {
      console.error("Report analysis failed:", error);
      throw new Error("Failed to analyze report");
    }
  }
});



export const saveReport = mutation({
  args: {
    title: v.string(),
    type: v.string(),
    imageUrl: v.string(),
    analysis: v.object({
      summary: v.string(),
      findings: v.optional(v.array(v.object({
        category: v.string(),
        results: v.array(v.object({
          test: v.string(),
          value: v.string(),
          referenceRange: v.optional(v.string()),
          status: v.string()
        }))
      }))),
      abnormalities: v.optional(v.array(v.string())),
      recommendations: v.optional(v.array(v.string())),
      notes: v.optional(v.string()),
      disclaimer: v.optional(v.string())
    })
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.insert("reports", {
      userId,
      title: args.title,
      type: args.type,
      imageUrl: args.imageUrl,
      analysis: args.analysis,
      timestamp: Date.now()
    });

    if (userId) {
      await ctx.db.insert("notifications", {
        userId,
        title: "Report Saved",
        message: `Your ${args.type} "${args.title}" has been saved successfully.`,
        type: "INFO",
        isRead: false,
        timestamp: Date.now()
      });
    }
  }
});



export const triggerSOS = mutation({
  args: {
    lat: v.number(),
    lng: v.number(),
    accuracy: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const emergencyId = await ctx.db.insert("emergencies", {
      location: {
        lat: args.lat,
        lng: args.lng,
        accuracy: args.accuracy
      },
      status: "ACTIVE",
      timestamp: Date.now()
    });

    const userId = await getAuthUserId(ctx);
    if (userId) {
      await ctx.db.insert("notifications", {
        userId,
        title: "SOS Triggered",
        message: "Your emergency alert has been sent. Help is on the way.",
        type: "SOS",
        isRead: false,
        timestamp: Date.now()
      });
    }
    return emergencyId;
  }
});

export const getNotifications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);
  }
});

export const markNotificationsAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    for (const notification of unread) {
      await ctx.db.patch(notification._id, { isRead: true });
    }
  }
});

export const getConsultation = query({
  args: { consultationId: v.id("consultations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const consultation = await ctx.db.get(args.consultationId);
    if (!consultation || consultation.userId !== userId) {
      return null;
    }

    return consultation;
  }
});

export const getConsultationInternal = internalQuery({
  args: { consultationId: v.id("consultations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.consultationId);
  }
});

export const getUserConsultations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("consultations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  }
});

export const updateConsultationAnalysis = internalMutation({
  args: {
    consultationId: v.id("consultations"),
    analysis: v.object({
      clinicalObservations: v.string(),
      medicalConsiderations: v.array(v.string()),
      riskLevel: v.string(),
      recommendedActions: v.array(v.string()),
      emergencyWarnings: v.optional(v.array(v.string())),
      aiResponse: v.optional(v.string())
    })
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.consultationId, {
      analysis: args.analysis,
      status: "completed"
    });
  }
});

export const addChatMessage = internalMutation({
  args: {
    consultationId: v.id("consultations"),
    message: v.object({
      role: v.string(),
      content: v.string(),
      timestamp: v.number()
    })
  },
  handler: async (ctx, args) => {
    const consultation = await ctx.db.get(args.consultationId);
    if (!consultation) {
      throw new Error("Consultation not found");
    }

    const messages = consultation.messages || [];
    messages.push(args.message);

    await ctx.db.patch(args.consultationId, {
      messages: messages
    });
  }
});

function createMedicalAnalysisPrompt(consultation: any): string {
  const { patientAge, patientSex, chiefComplaint, symptoms, medicalHistory, medications, vitals } = consultation;

  let prompt = `Please provide a comprehensive medical analysis for the following patient presentation:

PATIENT INFORMATION:
- Age: ${patientAge} years
- Sex: ${patientSex}
- Chief Complaint: ${chiefComplaint}

SYMPTOMS:
${symptoms.map((s: any, i: number) =>
    `${i + 1}. ${s.symptom} - Severity: ${s.severity}, Duration: ${s.duration}${s.description ? `, Description: ${s.description}` : ''}`
  ).join('\n')}`;

  if (medicalHistory) {
    prompt += `\n\nMEDICAL HISTORY:\n${medicalHistory}`;
  }

  if (medications) {
    prompt += `\n\nCURRENT MEDICATIONS:\n${medications}`;
  }

  if (vitals && Object.keys(vitals).length > 0) {
    prompt += `\n\nVITAL SIGNS:\n${Object.entries(vitals)
      .filter(([_, value]) => value)
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n')}`;
  }

  prompt += `\n\nPlease provide a CONCISE medical analysis (approx. 5-6 lines total) structured as follows:
1. ASSESSMENT: A brief clinical summary (1-2 lines).
2. RISK: Low/Moderate/High and why (1 line).
3. NEEDED ITEMS: Essential medications or supplies (1 line).
4. SUPPLEMENTS: Recommended tablets, vitamins, or minerals (1 line).
5. ACTIONS: 2-3 immediate next steps.
6. WARNINGS: Clear "Red Flag" symptoms.

CRITICAL: Keep the response extremely brief and punchy. Avoid long paragraphs.`;

  return prompt;
}

function createChatContext(consultation: any, newMessage: string): string {
  return `Patient is asking: "${newMessage}"

Context from consultation:
- Chief Complaint: ${consultation.chiefComplaint}
- Symptoms: ${consultation.symptoms.map((s: any) => s.symptom).join(', ')}
- Analysis Status: ${consultation.status}
${consultation.analysis ? `- Risk Level: ${consultation.analysis.riskLevel}` : ''}

Please provide a helpful, informative response while maintaining appropriate medical disclaimers.`;
}

async function parseAIResponse(aiResponse: string, consultation: any) {
  const lines = aiResponse.split('\n').filter(line => line.trim());

  let clinicalObservations = "";
  let medicalConsiderations: string[] = [];
  let riskLevel = "Moderate";
  let recommendedActions: string[] = [];
  let alternativeTreatments: string[] = [];
  let suggestedMedications: string[] = [];
  let requiredSupplies: string[] = [];
  let doctorRecommendations: string[] = [];
  let emergencyWarnings: string[] = [];
  let supplements: string[] = [];

  // Extract sections from AI response
  let currentSection = "";
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const lowerLine = trimmedLine.toLowerCase();

    if (lowerLine.includes('assessment')) {
      currentSection = "clinical";
      continue;
    } else if (lowerLine.includes('considerations')) {
      currentSection = "considerations";
      continue;
    } else if (lowerLine.includes('risk') && !lowerLine.includes('warnings')) {
      currentSection = "risk";
      if (lowerLine.includes('high') || lowerLine.includes('critical')) riskLevel = "High";
      else if (lowerLine.includes('low')) riskLevel = "Low";
      else if (lowerLine.includes('moderate')) riskLevel = "Moderate";
      continue;
    } else if (lowerLine.includes('actions')) {
      currentSection = "actions";
      continue;
    } else if (lowerLine.includes('needed items') || lowerLine.includes('treatment') || lowerLine.includes('care')) {
      currentSection = "treatment";
      continue;
    } else if (lowerLine.includes('medication') || lowerLine.includes('tablet')) {
      currentSection = "medications";
      continue;
    } else if (lowerLine.includes('supplies') || lowerLine.includes('essentials')) {
      currentSection = "supplies";
      continue;
    } else if (lowerLine.includes('specialist') || lowerLine.includes('doctor')) {
      currentSection = "specialist";
      continue;
    } else if (lowerLine.includes('supplement') || lowerLine.includes('vitamin')) {
      currentSection = "supplements";
      continue;
    } else if (lowerLine.includes('warning') || lowerLine.includes('emergency') || lowerLine.includes('red flag')) {
      currentSection = "warnings";
      continue;
    }

    // Add content to appropriate section
    switch (currentSection) {
      case "clinical":
        clinicalObservations += trimmedLine + " ";
        break;
      case "considerations":
        if (trimmedLine.includes('-') || trimmedLine.includes('•') || /^\d+\./.test(trimmedLine)) {
          medicalConsiderations.push(trimmedLine.replace(/^[-•\d.\s]+/, '').trim());
        }
        break;
      case "risk":
        if (trimmedLine.includes("Low")) riskLevel = "Low";
        else if (trimmedLine.includes("Moderate")) riskLevel = "Moderate";
        else if (trimmedLine.includes("High")) riskLevel = "High";
        else if (trimmedLine.includes("Critical")) riskLevel = "Critical";
        break;
      case "actions":
        if (trimmedLine.includes('-') || trimmedLine.includes('•') || /^\d+\./.test(trimmedLine)) {
          recommendedActions.push(trimmedLine.replace(/^[-•\d.\s]+/, '').trim());
        }
        break;
      case "treatment":
        if (trimmedLine.includes('-') || trimmedLine.includes('•') || /^\d+\./.test(trimmedLine)) {
          alternativeTreatments.push(trimmedLine.replace(/^[-•\d.\s]+/, '').trim());
        }
        break;
      case "medications":
        if (trimmedLine.includes('-') || trimmedLine.includes('•') || /^\d+\./.test(trimmedLine)) {
          suggestedMedications.push(trimmedLine.replace(/^[-•\d.\s]+/, '').trim());
        }
        break;
      case "supplies":
        if (trimmedLine.includes('-') || trimmedLine.includes('•') || /^\d+\./.test(trimmedLine)) {
          requiredSupplies.push(trimmedLine.replace(/^[-•\d.\s]+/, '').trim());
        }
        break;
      case "specialist":
        if (trimmedLine.includes('-') || trimmedLine.includes('•') || /^\d+\./.test(trimmedLine)) {
          doctorRecommendations.push(trimmedLine.replace(/^[-•\d.\s]+/, '').trim());
        }
        break;
      case "warnings":
        if (trimmedLine.includes('-') || trimmedLine.includes('•') || /^\d+\./.test(trimmedLine)) {
          emergencyWarnings.push(trimmedLine.replace(/^[-•\d.\s]+/, '').trim());
        }
        break;
      case "supplements":
        // Handle both list items and comma separated items in a single concise line
        if (trimmedLine.includes('-') || trimmedLine.includes('•') || /^\d+\./.test(trimmedLine)) {
          supplements.push(trimmedLine.replace(/^[-•\d.\s]+/, '').trim());
        } else if (trimmedLine.length > 3) {
          // If it's a plain line (concise format), split by comma if present
          if (trimmedLine.includes(',')) {
            supplements.push(...trimmedLine.split(',').map(s => s.trim()));
          } else {
            supplements.push(trimmedLine);
          }
        }
        break;
    }
  }

  // Fallback to basic analysis if parsing fails
  if (!clinicalObservations) {
    clinicalObservations = `AI analysis of ${consultation.patientAge}-year-old ${consultation.patientSex} presenting with ${consultation.chiefComplaint}.`;
  }

  return {
    clinicalObservations: clinicalObservations.trim(),
    medicalConsiderations: medicalConsiderations.length > 0 ? medicalConsiderations : ["Professional evaluation recommended"],
    riskLevel,
    recommendedActions: recommendedActions.length > 0 ? recommendedActions : ["Consult with healthcare provider"],
    alternativeTreatments: alternativeTreatments.length > 0 ? alternativeTreatments : undefined,
    suggestedMedications: suggestedMedications.length > 0 ? suggestedMedications : undefined,
    requiredSupplies: requiredSupplies.length > 0 ? requiredSupplies : undefined,
    doctorRecommendations: doctorRecommendations.length > 0 ? doctorRecommendations : undefined,
    emergencyWarnings: emergencyWarnings.length > 0 ? emergencyWarnings : undefined,
    supplements: supplements.length > 0 ? supplements : undefined
  };
}

function performClinicalAnalysis(consultation: any) {
  const { patientAge, patientSex, chiefComplaint, symptoms, medicalHistory, medications, vitals } = consultation;

  // Clinical observations
  let clinicalObservations = `Patient presents as ${patientAge}-year-old ${patientSex} with chief complaint of ${chiefComplaint}. `;

  if (symptoms.length > 0) {
    clinicalObservations += `Associated symptoms include: ${symptoms.map((s: any) =>
      `${s.symptom} (${s.severity} severity, duration: ${s.duration})`
    ).join(", ")}. `;
  }

  if (vitals) {
    const vitalSigns = Object.entries(vitals)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
    if (vitalSigns) {
      clinicalObservations += `Vital signs: ${vitalSigns}. `;
    }
  }

  // Risk assessment
  let riskLevel = "Low";
  const riskFactors = [];

  // Age-based risk
  if (patientAge > 65) {
    riskFactors.push("Advanced age");
    riskLevel = "Moderate";
  }

  // Symptom-based risk assessment
  const moderateRiskSymptoms = ["chest discomfort", "shortness of breath", "severe pain", "high fever", "persistent vomiting"];
  const highRiskSymptoms = ["chest pain", "difficulty breathing", "severe headache", "loss of consciousness"];

  const allSymptomText = symptoms.map((s: any) => s.symptom.toLowerCase()).join(" ");

  if (highRiskSymptoms.some(symptom => allSymptomText.includes(symptom))) {
    riskLevel = "High";
    riskFactors.push("High-risk symptoms present");
  } else if (moderateRiskSymptoms.some(symptom => allSymptomText.includes(symptom))) {
    riskLevel = "Moderate";
    riskFactors.push("Moderate-risk symptoms present");
  }

  // Severity-based risk
  const severeSymptomsCount = symptoms.filter((s: any) => s.severity === "severe").length;
  if (severeSymptomsCount > 0) {
    riskLevel = riskLevel === "Low" ? "Moderate" : "High";
    riskFactors.push(`${severeSymptomsCount} severe symptom(s)`);
  }

  // Medical considerations (differential considerations)
  const medicalConsiderations = generateMedicalConsiderations(chiefComplaint, symptoms, patientAge, patientSex);

  // Recommended actions
  const recommendedActions = generateRecommendedActions(riskLevel, symptoms, patientAge);

  // Emergency warnings if applicable
  let emergencyWarnings;
  if (riskLevel === "High") {
    emergencyWarnings = [
      "Seek immediate medical evaluation",
      "Do not delay professional medical assessment",
      "Monitor for worsening symptoms"
    ];
  }

  return {
    clinicalObservations,
    medicalConsiderations,
    riskLevel,
    recommendedActions,
    emergencyWarnings
  };
}

function generateMedicalConsiderations(chiefComplaint: string, symptoms: any[], age: number, sex: string): string[] {
  const considerations = [];
  const complaint = chiefComplaint.toLowerCase();

  // Common differential considerations based on chief complaint
  if (complaint.includes("headache")) {
    considerations.push("Tension-type headache", "Migraine", "Cluster headache");
    if (age > 50) considerations.push("Secondary headache disorders");
  }

  if (complaint.includes("chest")) {
    considerations.push("Musculoskeletal chest pain", "Gastroesophageal reflux");
    if (age > 40) considerations.push("Cardiac evaluation warranted");
  }

  if (complaint.includes("abdominal") || complaint.includes("stomach")) {
    considerations.push("Gastroenteritis", "Functional dyspepsia", "Inflammatory conditions");
  }

  if (complaint.includes("fever")) {
    considerations.push("Viral syndrome", "Bacterial infection", "Inflammatory process");
  }

  if (complaint.includes("cough")) {
    considerations.push("Upper respiratory tract infection", "Lower respiratory tract involvement", "Allergic component");
  }

  // Add general considerations if none specific found
  if (considerations.length === 0) {
    considerations.push("Requires clinical correlation", "Multiple etiologies possible", "Further evaluation needed");
  }

  return considerations;
}

function generateRecommendedActions(riskLevel: string, symptoms: any[], age: number): string[] {
  const actions = [];

  switch (riskLevel) {
    case "High":
      actions.push(
        "Seek immediate medical evaluation at emergency department",
        "Do not delay professional medical assessment",
        "Arrange immediate transportation to healthcare facility"
      );
      break;

    case "Moderate":
      actions.push(
        "Schedule urgent appointment with primary care physician within 24-48 hours",
        "Monitor symptoms closely for any worsening",
        "Seek immediate care if symptoms worsen or new concerning symptoms develop"
      );
      break;

    case "Low":
      actions.push(
        "Consider routine appointment with primary care physician",
        "Monitor symptoms and seek care if persistent or worsening",
        "Maintain adequate hydration and rest"
      );
      break;
  }

  // Age-specific recommendations
  if (age > 65) {
    actions.push("Consider earlier medical evaluation due to age-related risk factors");
  }

  // Symptom-specific recommendations
  const hasFever = symptoms.some((s: any) => s.symptom.toLowerCase().includes("fever"));
  if (hasFever) {
    actions.push("Monitor temperature regularly", "Maintain adequate fluid intake");
  }

  actions.push("This guidance does not replace professional medical evaluation");

  return actions;
}
