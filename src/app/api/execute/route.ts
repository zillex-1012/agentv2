import { agentConfigs } from '@/lib/agents/roles';
import { AgentRole } from '@/lib/types';

// EDGE RUNTIME: Cho phép streaming
export const runtime = 'edge';

const BEEKNOEE_BASE_URL = 'https://platform-api.beeknoee.com/v1';
const VALID_AGENTS: AgentRole[] = ['analyst', 'strategist', 'communicator', 'builder'];

export async function POST(req: Request) {
  try {
    const { assignee, description, feedback, contextData } = await req.json();
    const apiKey = process.env.BEE_API_KEY;
    const model = process.env.BEE_MODEL || 'deepseek/deepseek-v3.2';

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing API Key' }), { status: 400 });
    }

    if (!VALID_AGENTS.includes(assignee)) {
      return new Response(JSON.stringify({ error: `Invalid agent: ${assignee}` }), { status: 400 });
    }

    const agentConfig = agentConfigs[assignee as AgentRole];
    
    // Xây dựng System Message
    let systemPrompt = agentConfig.systemPrompt;
    
    // Xây dựng User Message (Bơm Context Passing)
    let userMessage = `--- NHIỆM VỤ ĐƯỢC GIAO ---\n${description}`;
    
    if (contextData) {
      userMessage += `\n\n--- ⚠️ TÀI LIỆU TỪ BƯỚC TRƯỚC (CONTEXT PASSING) ⚠️ ---\nHãy đọc kỹ tài liệu dưới đây để làm chất liệu cho nhiệm vụ của bạn:\n\n${contextData}`;
    }

    if (feedback) {
      userMessage += `\n\n--- PHẢN HỒI TỪ SOLOPRENEUR (YÊU CẦU SỬA) ---\n${feedback}`;
    }

    // Gọi Beeknoee API
    const response = await fetch(`${BEEKNOEE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        stream: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: `Agent Error: ${response.status}`, details: errorText }), { status: response.status });
    }

    // Stream output của Agent về client
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) { controller.close(); return; }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
              if (line.includes('[DONE]')) continue;
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.replace('data: ', ''));
                  const content = data.choices[0]?.delta?.content || '';
                  if (content) controller.enqueue(encoder.encode(content));
                } catch {}
              }
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Agent Execution Failed', details: error.message }), { status: 500 });
  }
}
