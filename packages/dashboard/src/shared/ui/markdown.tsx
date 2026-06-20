import type React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MARKDOWN_COMPONENTS = {
  h1: ({ children }: Readonly<{ children?: React.ReactNode }>) => (
    <h1 className="mt-0 mb-3 text-2xl leading-tight font-normal tracking-[-0.045em] text-onbrand-charcoal">
      {children}
    </h1>
  ),
  h2: ({ children }: Readonly<{ children?: React.ReactNode }>) => (
    <h2 className="mt-5 mb-2.5 text-xl leading-tight font-normal tracking-[-0.04em] text-onbrand-charcoal first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }: Readonly<{ children?: React.ReactNode }>) => (
    <h3 className="mt-4 mb-2 text-base leading-tight font-normal tracking-[-0.035em] text-onbrand-charcoal first:mt-0">
      {children}
    </h3>
  ),
  p: ({ children }: Readonly<{ children?: React.ReactNode }>) => (
    <p className="my-2 leading-6 text-onbrand-charcoal/72">{children}</p>
  ),
  ul: ({ children }: Readonly<{ children?: React.ReactNode }>) => (
    <ul className="my-2 list-disc space-y-1 pl-5 text-onbrand-charcoal/72">{children}</ul>
  ),
  ol: ({ children }: Readonly<{ children?: React.ReactNode }>) => (
    <ol className="my-2 list-decimal space-y-1 pl-5 text-onbrand-charcoal/72">{children}</ol>
  ),
  li: ({ children }: Readonly<{ children?: React.ReactNode }>) => (
    <li className="pl-1 leading-6 marker:text-onbrand-charcoal/35">{children}</li>
  ),
  strong: ({ children }: Readonly<{ children?: React.ReactNode }>) => (
    <strong className="font-normal text-onbrand-charcoal">{children}</strong>
  ),
  em: ({ children }: Readonly<{ children?: React.ReactNode }>) => (
    <em className="text-onbrand-charcoal/80 italic">{children}</em>
  ),
  blockquote: ({ children }: Readonly<{ children?: React.ReactNode }>) => (
    <blockquote className="my-3 border-l border-onbrand-charcoal/15 pl-3 text-onbrand-charcoal/65">
      {children}
    </blockquote>
  ),
  code: ({ children }: Readonly<{ children?: React.ReactNode }>) => (
    <code className="rounded-sm bg-onbrand-blue-50 px-1 py-0.5 font-mono text-[0.85em] text-onbrand-charcoal">
      {children}
    </code>
  ),
  pre: ({ children }: Readonly<{ children?: React.ReactNode }>) => (
    <pre className="my-3 overflow-auto rounded-md border border-onbrand-charcoal/8 bg-onbrand-charcoal/[0.03] p-3 text-xs leading-5 text-onbrand-charcoal">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-4 border-onbrand-charcoal/10" />,
  a: ({ children, href }: Readonly<{ children?: React.ReactNode; href?: string }>) => (
    <a className="text-onbrand-blue-600 underline-offset-3 hover:underline" href={href}>
      {children}
    </a>
  ),
  table: ({ children }: Readonly<{ children?: React.ReactNode }>) => (
    <div className="my-3 overflow-auto rounded-md border border-onbrand-charcoal/8">
      <table className="w-full border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  th: ({ children }: Readonly<{ children?: React.ReactNode }>) => (
    <th className="border-b border-onbrand-charcoal/8 px-3 py-2 font-normal text-onbrand-charcoal">
      {children}
    </th>
  ),
  td: ({ children }: Readonly<{ children?: React.ReactNode }>) => (
    <td className="border-b border-onbrand-charcoal/6 px-3 py-2 text-onbrand-charcoal/70">
      {children}
    </td>
  ),
};

export const Markdown = ({ children }: Readonly<{ children: string }>) => (
  <div className="max-w-4xl text-sm">
    <ReactMarkdown components={MARKDOWN_COMPONENTS} remarkPlugins={[remarkGfm]}>
      {children}
    </ReactMarkdown>
  </div>
);
