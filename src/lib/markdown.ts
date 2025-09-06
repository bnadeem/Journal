import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import remarkBreaks from 'remark-breaks';

export const markdownOptions = {
  remarkPlugins: [remarkGfm, remarkBreaks],
  rehypePlugins: [rehypeHighlight],
};

// Helper function to preserve natural paragraph spacing
export function preprocessContent(content: string): string {
  // Convert multiple consecutive line breaks to markdown line breaks
  return content
    .split('\n')
    .map((line, index, lines) => {
      // If this line is empty and the next line is also empty, add an extra line break
      if (line.trim() === '' && lines[index + 1] && lines[index + 1].trim() === '') {
        return '\n&nbsp;\n';
      }
      return line;
    })
    .join('\n');
}

export { ReactMarkdown };