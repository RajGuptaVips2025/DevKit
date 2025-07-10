import { Step, StepType } from '../types';

function decodeEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractCDATA(str: string): string {
  const cdataMatch = str.match(/<!\[CDATA\[(.*?)\]\]>/s);
  return cdataMatch ? cdataMatch[1].trim() : str.trim();
}

export function parseXml(response: string): Step[] {
  const xmlMatch = response.match(/<boltArtifact[^>]*>([\s\S]*?)<\/boltArtifact>/);

  if (!xmlMatch) return [];

  const xmlContent = xmlMatch[1];
  const steps: Step[] = [];
  let stepId = 1;

  const titleMatch = response.match(/title="([^"]*)"/);
  const artifactTitle = titleMatch ? decodeEntities(titleMatch[1]) : 'Project Files';

  steps.push({
    id: stepId++,
    title: artifactTitle,
    description: '',
    type: StepType.CreateFolder,
    status: 'pending',
  });

  const actionRegex = /<boltAction\s+type="([^"]*)"(?:\s+filePath="([^"]*)")?>([\s\S]*?)<\/boltAction>/g;

  let match;
  while ((match = actionRegex.exec(xmlContent)) !== null) {
    const [, type, filePath, rawContent] = match;

    // Extract CDATA if present
    const cdataContent = extractCDATA(rawContent);

    // Remove backticks and decode
    const cleanContent = decodeEntities(
      cdataContent.replace(/```(?:\w+)?/g, '').trim()
    );

    if (type === 'file') {
      steps.push({
        id: stepId++,
        title: `Create ${filePath || 'file'}`,
        description: '',
        type: StepType.CreateFile,
        status: 'pending',
        code: cleanContent,
        path: filePath,
      });
    } else if (type === 'shell') {
      steps.push({
        id: stepId++,
        title: 'Run command',
        description: '',
        type: StepType.RunScript,
        status: 'pending',
        code: cleanContent,
      });
    }
  }

  return steps;
}