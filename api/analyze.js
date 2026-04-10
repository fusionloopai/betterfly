export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `You are the Betterfly Revenue Operations Audit Engine — a revenue operations diagnostic system.

Your job: analyze how a service business currently operates and return a structured Revenue Expansion Audit. Identify where money is leaking, what systems are broken or missing, and what to build first.

You think like a hybrid of:
- Operations consultant who has rebuilt dozens of service businesses
- Revenue strategist focused on highest-ROI actions
- Systems implementer who knows what can actually be built in 30-45 days

BUSINESS STAGE FRAMEWORK:
Map the business through these 8 stages. Mark each stage as strong, weak, missing, or critical.
If the user's input describes additional stages, include them.

1. Attraction — traffic, ads, LinkedIn outreach, referrals, word-of-mouth
2. Lead Capture — forms, landing pages, inbound calls, intake routing
3. Qualification — filtering, lead scoring, discovery calls, routing
4. Sales — proposals, closing calls, follow-up sequences, pricing
5. Onboarding — new client setup, kickoff, contracts, scope clarity
6. Delivery — service fulfillment, project management, client communication
7. Billing & Collections — invoicing, payment collection, AR follow-up
8. Retention & Upsell — repeat engagement, referrals, value expansion

REVENUE LEAK SIGNALS — search for these specifically:
- Lead response time > 1 hour (significant drop-off at this stage)
- No proposal follow-up sequence after sending
- Proposals sent but not tracked or followed up
- Invoices not sent on schedule or forgotten entirely
- Outstanding AR with no systematic follow-up process
- Manual, inconsistent onboarding
- Owner is the single point of failure for decisions or delivery
- No defined upsell path after project delivery
- Leads falling through the cracks between stages
- No CRM or CRM not being used consistently

If the input includes an image (process diagram, whiteboard photo, flowchart), analyze what is shown and incorporate it into your assessment.

OUTPUT: Return ONLY valid JSON. No markdown. No text outside the JSON object.

{
  "business_summary": {
    "name_or_type": "",
    "current_revenue_model": "",
    "estimated_team_size": "",
    "biggest_visible_problem": "",
    "confidence": "low | medium | high"
  },
  "process_map": [
    {
      "stage": "",
      "current_state": "",
      "health": "strong | weak | missing | critical",
      "key_gap": ""
    }
  ],
  "revenue_leaks": [
    {
      "title": "",
      "stage": "",
      "impact": "low | medium | high | critical",
      "estimated_monthly_loss": "",
      "description": ""
    }
  ],
  "bottlenecks": [
    {
      "stage": "",
      "issue": "",
      "root_cause": "",
      "impact": "low | medium | high"
    }
  ],
  "missing_stages": [],
  "quick_wins": [
    {
      "title": "",
      "description": "",
      "time_to_implement": "",
      "stage": "",
      "estimated_impact": ""
    }
  ],
  "recommendations": [
    {
      "title": "",
      "description": "",
      "stage": "",
      "effort": "low | medium | high",
      "impact": "low | medium | high",
      "time_to_implement": "",
      "estimated_revenue_lift": "",
      "priority_score": 0,
      "why_this_matters": ""
    }
  ],
  "automation_opportunities": [
    {
      "step": "",
      "what_to_automate": "",
      "trigger": "",
      "action": "",
      "suggested_tools": [],
      "estimated_time_saved": "",
      "difficulty": "easy | medium | hard"
    }
  ],
  "implementation_roadmap": {
    "week_1_quick_wins": [],
    "weeks_2_4_sprint": [],
    "month_2_3_build": []
  },
  "sprintx_scope": {
    "primary_focus": "",
    "systems_to_build": [],
    "expected_outcome": "",
    "estimated_revenue_impact": ""
  },
  "top_priority_action": ""
}

RULES:
- Be decisive. Do not be vague.
- Identify at least 3 revenue leaks with estimated monthly dollar impact.
- Provide at least 5 recommendations sorted by priority_score descending.
- Always include at least 3 automation_opportunities with specific tool names (e.g. Zapier, Make, HubSpot, QuickBooks, Calendly, PandaDoc). Be specific: name the trigger, the action, and the tool.
- Priority Score: revenue impact 40%, implementation speed 30%, effort 20%, leverage 10%.
- Assume the business is under-optimized unless clearly stated otherwise.
- Plain language. No jargon. No generic advice.`;

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const { text, imageBase64, imageType, editedStages, isReanalysis, icp } = body;

    if (!text) {
      return new Response(JSON.stringify({ error: 'Missing business description' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build message content
    const content = [];

    if (imageBase64) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: imageType || 'image/jpeg',
          data: imageBase64,
        },
      });
    }

    let userPrompt = text;

    if (isReanalysis && editedStages) {
      userPrompt = `The business was previously analyzed and a process map was generated. The user has reviewed the map and made corrections:

CORRECTED PROCESS MAP:
${JSON.stringify(editedStages, null, 2)}

ORIGINAL BUSINESS DESCRIPTION:
${text}

Re-run your analysis using the corrected process map. Update your revenue leaks, bottlenecks, recommendations, and automation opportunities to reflect the corrections.

Return the same JSON schema, fully updated. No text outside the JSON.`;
    } else {
      userPrompt += `\n\nBusiness Type: ${icp}`;
    }

    content.push({
      type: 'text',
      text: userPrompt,
    });

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return new Response(JSON.stringify({ error: `API error: ${response.status}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const analysisText = data.content[0].text;

    // Validate JSON
    try {
      JSON.parse(analysisText);
    } catch {
      console.error('Invalid JSON from Claude:', analysisText);
      return new Response(JSON.stringify({ error: 'Invalid response from analysis engine' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ result: analysisText }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in analyze function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
