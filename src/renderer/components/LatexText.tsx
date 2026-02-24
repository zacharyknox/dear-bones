import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexTextProps {
  text: string;
  className?: string;
}

interface TextSegment {
  type: 'text' | 'inline-math' | 'display-math';
  content: string;
}

function parseLatexDelimiters(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let remaining = text;

  // Regex patterns for LaTeX delimiters
  // Order matters: check display math ($$) before inline ($) to avoid partial matches
  const patterns = [
    { regex: /^\$\$([\s\S]*?)\$\$/, type: 'display-math' as const },
    { regex: /^\\\[([\s\S]*?)\\\]/, type: 'display-math' as const },
    { regex: /^\$([^\$\n]+?)\$/, type: 'inline-math' as const },
    { regex: /^\\\(([^\)]*?)\\\)/, type: 'inline-math' as const },
  ];

  while (remaining.length > 0) {
    let matched = false;

    for (const pattern of patterns) {
      const match = remaining.match(pattern.regex);
      if (match) {
        segments.push({
          type: pattern.type,
          content: match[1],
        });
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Find the next potential LaTeX delimiter
      const nextDelimiter = findNextDelimiter(remaining);
      
      if (nextDelimiter === -1) {
        // No more delimiters, add rest as text
        if (remaining.length > 0) {
          segments.push({ type: 'text', content: remaining });
        }
        break;
      } else {
        // Add text before delimiter
        if (nextDelimiter > 0) {
          segments.push({ type: 'text', content: remaining.slice(0, nextDelimiter) });
        }
        remaining = remaining.slice(nextDelimiter);
      }
    }
  }

  return segments;
}

function findNextDelimiter(text: string): number {
  const delimiters = ['$$', '$', '\\[', '\\('];
  let minIndex = -1;

  for (const delimiter of delimiters) {
    const index = text.indexOf(delimiter);
    if (index !== -1 && (minIndex === -1 || index < minIndex)) {
      minIndex = index;
    }
  }

  return minIndex;
}

function renderKatex(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      errorColor: '#cc0000',
      strict: false,
      trust: true,
    });
  } catch (error) {
    console.error('KaTeX rendering error:', error);
    return `<span style="color: #cc0000;">${latex}</span>`;
  }
}

export function LatexText({ text, className = '' }: LatexTextProps) {
  const renderedContent = useMemo(() => {
    if (!text) return null;

    const segments = parseLatexDelimiters(text);

    return segments.map((segment, index) => {
      if (segment.type === 'text') {
        return <span key={index}>{segment.content}</span>;
      }

      const isDisplay = segment.type === 'display-math';
      const html = renderKatex(segment.content, isDisplay);

      if (isDisplay) {
        return (
          <div
            key={index}
            className="my-2"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }

      return (
        <span
          key={index}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    });
  }, [text]);

  return <span className={className}>{renderedContent}</span>;
}
