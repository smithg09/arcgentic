import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ArticleViewerProps {
  content: string;
}

export function ArticleViewer({ content }: ArticleViewerProps) {
  return (
    <div className="max-w-[68ch] ml-12 prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
