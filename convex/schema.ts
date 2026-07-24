import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  consultations: defineTable({
    userId: v.id("users"),
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
    })),
    analysis: v.optional(v.object({
      clinicalObservations: v.string(),
      medicalConsiderations: v.array(v.string()),
      riskLevel: v.string(),
      recommendedActions: v.array(v.string()),
      alternativeTreatments: v.optional(v.array(v.string())),
      doctorRecommendations: v.optional(v.array(v.string())),
      suggestedMedications: v.optional(v.array(v.string())),
      requiredSupplies: v.optional(v.array(v.string())),
      emergencyWarnings: v.optional(v.array(v.string())),
      supplements: v.optional(v.array(v.string())),
      aiResponse: v.optional(v.string())
    })),
    messages: v.optional(v.array(v.object({
      role: v.string(),
      content: v.string(),
      timestamp: v.number()
    }))),
    isEmergency: v.boolean(),
    status: v.string()
  }).index("by_user", ["userId"]),

  emergencyKeywords: defineTable({
    keyword: v.string(),
    category: v.string(),
    severity: v.string()
  }).index("by_keyword", ["keyword"]),

  reports: defineTable({
    userId: v.id("users"),
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
    }),
    timestamp: v.number()
  }).index("by_user", ["userId"]),

  emergencies: defineTable({
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      accuracy: v.optional(v.number())
    }),
    status: v.string(), // "ACTIVE", "RESOLVED"
    timestamp: v.number()
  }),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.string(), // "INFO", "SOS", "ORDER"
    isRead: v.boolean(),
    timestamp: v.number()
  }).index("by_user", ["userId"])
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
