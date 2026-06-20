import {
  BoldItalicUnderlineToggles,
  headingsPlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorMethods,
  quotePlugin,
  thematicBreakPlugin,
  Separator,
  toolbarPlugin,
  UndoRedo,
  ListsToggle,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { useRef } from "react";

const toolbarContents = () => (
  <>
    <UndoRedo />
    <Separator />
    <BoldItalicUnderlineToggles />
    <Separator />
    <ListsToggle />
  </>
);

const plugins = [
  headingsPlugin({ allowedHeadingLevels: [1, 2, 3] }),
  listsPlugin(),
  quotePlugin(),
  thematicBreakPlugin(),
  codeBlockPlugin({ defaultCodeBlockLanguage: "css" }),
  codeMirrorPlugin({
    codeBlockLanguages: {
      css: "CSS",
      html: "HTML",
      javascript: "JavaScript",
      json: "JSON",
      markdown: "Markdown",
    },
  }),
  markdownShortcutPlugin(),
  toolbarPlugin({ toolbarContents }),
];

export const MarkdownDesignPromptEditor = ({
  markdown,
  onMarkdownChange,
}: Readonly<{
  markdown: string;
  onMarkdownChange: (markdown: string) => void;
}>) => {
  const editorRef = useRef<MDXEditorMethods>(null);

  return (
    <MDXEditor
      ref={editorRef}
      markdown={markdown}
      onChange={onMarkdownChange}
      plugins={plugins}
      className="onbrand-markdown-editor"
      contentEditableClassName="onbrand-markdown-editor-content prose prose-sm max-w-none prose-headings:text-onbrand-charcoal prose-headings:tracking-[-0.04em] prose-h1:text-3xl prose-h1:font-semibold prose-h2:text-xl prose-h2:font-semibold prose-h3:text-base prose-h3:font-semibold prose-p:text-onbrand-charcoal/70 prose-li:text-onbrand-charcoal/70 prose-strong:text-onbrand-charcoal prose-code:rounded prose-code:bg-onbrand-charcoal/6 prose-code:px-1 prose-code:py-0.5 prose-code:text-onbrand-charcoal prose-code:before:content-none prose-code:after:content-none prose-hr:border-onbrand-charcoal/12 prose-blockquote:border-onbrand-charcoal/20 prose-blockquote:text-onbrand-charcoal/58"
      placeholder="Plain language presentation guidance…"
    />
  );
};
