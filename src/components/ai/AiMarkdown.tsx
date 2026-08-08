import ReactMarkdown from 'react-markdown';

interface AiMarkdownProps {
  content: string;
  className?: string;
}

export const AiMarkdown = ({ content, className = '' }: AiMarkdownProps) => (
  <div className={`min-w-0 break-words ${className}`}>
    <ReactMarkdown
      skipHtml
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
        em: ({ children }) => <em className="italic text-slate-100">{children}</em>,
        h1: ({ children }) => <h1 className="mb-2 mt-3 text-base font-bold text-white first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="mb-2 mt-3 text-sm font-bold text-white first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-1.5 mt-2 text-sm font-semibold text-white first:mt-0">{children}</h3>,
        ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
        li: ({ children }) => <li className="pl-0.5">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="my-2 border-l-2 border-green-500/50 pl-3 text-slate-400">
            {children}
          </blockquote>
        ),
        pre: ({ children }) => (
          <pre className="my-2 max-w-full overflow-x-auto rounded-md bg-black/30 p-3 text-xs leading-relaxed">
            {children}
          </pre>
        ),
        code: ({ children, className: codeClassName }) => (
          <code className={`${codeClassName ?? ''} rounded bg-black/30 px-1 py-0.5 font-mono text-[0.9em] text-green-300`}>
            {children}
          </code>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="text-green-400 underline decoration-green-500/40 underline-offset-2 hover:text-green-300"
          >
            {children}
          </a>
        ),
        hr: () => <hr className="my-3 border-slate-700" />,
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);
