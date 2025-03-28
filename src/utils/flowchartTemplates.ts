export const generateFlowchartPrompt = (flowType: string) => `
Generate a detailed, step-by-step legal flowchart for ${flowType} in India. The flowchart should:

1. Break down the process into clear, logical steps
2. Include all necessary documentation requirements
3. Mention relevant legal sections and authorities
4. Consider different scenarios and their outcomes
5. Provide time frames where applicable
6. Include costs and fees if relevant

Follow these specific guidelines:
- Each step should have clear, actionable options
- Include relevant legal forms and documents needed
- Mention statutory time limits and deadlines
- Reference specific legal authorities and jurisdiction
- Consider both successful and alternative pathways

Return a JSON object with this exact structure:
{
  "id": "${flowType.toLowerCase().replace(/\s+/g, '-')}",
  "title": "${flowType}",
  "description": "Comprehensive guide for ${flowType} in India",
  "steps": [
    {
      "id": "unique-step-id",
      "title": "Clear step title",
      "description": "Detailed description including requirements, documents, and legal references",
      "options": [
        {
          "text": "Clear action or decision option",
          "nextStep": "next-step-id"
        }
      ],
      "isEndPoint": false
    }
  ]
}

Ensure each step contains practical, actionable information with proper legal context.`;

export const flowchartExampleStructure = {
  steps: [
    {
      title: "Initial Assessment",
      description: "Evaluate eligibility and requirements",
      options: [
        { text: "Eligible - Proceed", nextStep: "documentation" },
        { text: "Need more information", nextStep: "consultation" },
        { text: "Not eligible", nextStep: "alternatives" }
      ]
    },
    {
      title: "Documentation",
      description: "Required documents and forms",
      options: [
        { text: "All documents ready", nextStep: "filing" },
        { text: "Missing documents", nextStep: "document-checklist" }
      ]
    }
  ]
};

export const getFallbackFlowchart = (flowType: string) => ({
  id: flowType.toLowerCase().replace(/\s+/g, '-'),
  title: flowType,
  description: `Process guide for ${flowType}`,
  steps: [
    {
      id: "step-1",
      title: "Initial Consultation",
      description: "Consult with a legal professional to understand your rights and options regarding " + flowType,
      options: [
        {
          text: "Ready to proceed",
          nextStep: "step-2"
        },
        {
          text: "Need more information",
          nextStep: "step-1-more-info"
        }
      ]
    },
    {
      id: "step-1-more-info",
      title: "Additional Information",
      description: "Contact a legal aid society or visit the nearest district court for detailed information.",
      options: [
        {
          text: "Return to start",
          nextStep: "step-1"
        }
      ],
      isEndPoint: false
    },
    {
      id: "step-2",
      title: "Document Collection",
      description: "Gather all necessary documents and evidence",
      options: [
        {
          text: "Documents ready",
          nextStep: "step-3"
        }
      ]
    },
    {
      id: "step-3",
      title: "Legal Filing",
      description: "File the necessary paperwork with the appropriate authorities",
      isEndPoint: true
    }
  ]
});
