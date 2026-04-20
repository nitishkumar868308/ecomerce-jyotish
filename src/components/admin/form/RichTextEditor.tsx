"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Undo2,
  Redo2,
  RemoveFormatting,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  label?: string;
  hint?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
  className?: string;
}

const COLORS = [
  { name: "Default", value: "inherit" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Green", value: "#22C55E" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Gray", value: "#6B7280" },
];

/**
 * Thin admin-styled wrapper around TipTap. Saves HTML so the storefront can
 * dangerouslySetInnerHTML the long description as the admin wrote it — bold,
 * italic, coloured spans, lists, links.
 */
export function RichTextEditor({
  label,
  hint,
  value,
  onChange,
  placeholder = "Write...",
  disabled,
  minHeight = 180,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
    ],
    content: value || "",
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // TipTap emits `<p></p>` for empty — normalise to empty string so parent
      // can tell "no content" from "one empty paragraph".
      onChange(html === "<p></p>" ? "" : html);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none text-[var(--text-primary)]",
        "data-placeholder": placeholder,
      },
    },
    immediatelyRender: false,
  });

  // Sync external value changes (edit flow).
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = value || "";
    if (current === incoming) return;
    editor.commands.setContent(incoming, { emitUpdate: false });
  }, [value, editor]);

  if (!editor) return null;

  const promptLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setMark("link", { href: url })
      .run();
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <div className="flex items-baseline justify-between">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            {label}
          </label>
          {hint && (
            <span className="text-xs text-[var(--text-muted)]">{hint}</span>
          )}
        </div>
      )}

      <div
        className={cn(
          "overflow-hidden rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] transition-colors focus-within:border-[var(--accent-primary)] focus-within:ring-2 focus-within:ring-[var(--accent-primary)]/20",
          disabled && "opacity-60",
        )}
      >
        <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--border-primary)] bg-[var(--bg-card)] p-1">
          <ToolButton
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            label="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            label="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            label="Strikethrough"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </ToolButton>

          <Divider />

          <ToolButton
            active={editor.isActive("heading", { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            label="Heading 2"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton
            active={editor.isActive("heading", { level: 3 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            label="Heading 3"
          >
            <Heading3 className="h-3.5 w-3.5" />
          </ToolButton>

          <Divider />

          <ToolButton
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            label="Bullet list"
          >
            <List className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            label="Numbered list"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            label="Blockquote"
          >
            <Quote className="h-3.5 w-3.5" />
          </ToolButton>

          <Divider />

          <ToolButton onClick={promptLink} label="Link / URL">
            <LinkIcon className="h-3.5 w-3.5" />
          </ToolButton>

          <ColorSwatches editor={editor} />

          <Divider />

          <ToolButton
            onClick={() =>
              editor.chain().focus().unsetAllMarks().clearNodes().run()
            }
            label="Clear formatting"
          >
            <RemoveFormatting className="h-3.5 w-3.5" />
          </ToolButton>

          <div className="ml-auto flex items-center gap-0.5">
            <ToolButton
              onClick={() => editor.chain().focus().undo().run()}
              label="Undo"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </ToolButton>
            <ToolButton
              onClick={() => editor.chain().focus().redo().run()}
              label="Redo"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </ToolButton>
          </div>
        </div>

        <div
          className="bg-[var(--bg-secondary)] px-3 py-2.5 text-sm"
          style={{ minHeight }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

function ToolButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
        active
          ? "bg-[var(--accent-primary)] text-white"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-[var(--border-primary)]" />;
}

interface ColorSwatchesProps {
  editor: NonNullable<ReturnType<typeof useEditor>>;
}

function ColorSwatches({ editor }: ColorSwatchesProps) {
  return (
    <div className="flex items-center gap-0.5 px-1">
      {COLORS.map((c) => (
        <button
          key={c.name}
          type="button"
          title={c.name}
          aria-label={`Color ${c.name}`}
          onClick={() => {
            if (c.value === "inherit") {
              editor.chain().focus().unsetColor().run();
            } else {
              editor.chain().focus().setColor(c.value).run();
            }
          }}
          className="h-4 w-4 rounded-full border border-[var(--border-primary)] transition-transform hover:scale-110"
          style={{
            background:
              c.value === "inherit"
                ? "linear-gradient(135deg, transparent 45%, var(--accent-danger) 45% 55%, transparent 55%)"
                : c.value,
          }}
        />
      ))}
    </div>
  );
}
