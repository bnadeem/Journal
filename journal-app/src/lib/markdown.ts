import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

export const markdownOptions = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [rehypeHighlight],
};

export { ReactMarkdown };