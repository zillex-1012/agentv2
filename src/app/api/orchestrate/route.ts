import { agentConfigs } from '@/lib/agents/roles';
import { AgentRole } from '@/lib/types';

// EDGE RUNTIME: Cho phép streaming
export const runtime = 'edge';

const BEEKNOEE_BASE_URL = 'https://platform-api.beeknoee.com/v1';

export async function POST(req: Request) {
  try {
    const { command } = await req.json();
    const apiKey = process.env.BEE_API_KEY;
    const model = process.env.BEE_MODEL || 'deepseek/deepseek-v3.2';

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing API Key' }), { status: 400 });
    }

    // Gọi Chief of Staff để LẬP KẾ HOẠCH
    const response = await fetch(`${BEEKNOEE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { 
            role: 'system', 
            content: agentConfigs.chiefOfStaff.systemPrompt
          },
          {
            role: 'user',
            content: `--- YÊU CẦU TỪ SOLOPRENEUR ---\n${command}`
          }
        ],
        temperature: 0.1,
        stream: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: `API Error: ${response.status}`, details: errorText }), { status: response.status });
    }

    // Stream dữ liệu về client
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
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), { status: 500 });
  }
}
