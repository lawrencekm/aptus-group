import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// react-markdown does not render raw HTML by default, so admin-supplied markdown cannot inject scripts.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-ag">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow">
              {children}
            </a>
          ),
          img: () => null, // keep pages lightweight and avoid hot-linked third-party images
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
