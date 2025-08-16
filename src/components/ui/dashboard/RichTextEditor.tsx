"use client";

import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Strike from "@tiptap/extension-strike";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";

type RichTextEditorProps = {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
};

interface HeadingAttributes {
  level: number;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Write something...",
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: ({ level }: HeadingAttributes) => {
              if (level === 1)
                return "text-3xl border-b-2 border-gray-300 dark:border-gray-600 pb-2 mb-4 font-bold";
              if (level === 2)
                return "text-2xl border-b border-gray-200 dark:border-gray-700 pb-1 mb-3 font-bold";
              if (level === 3) return "text-xl mb-2 font-bold";
              return "font-bold";
            },
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: "list-disc pl-5",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal pl-5",
          },
        },
      }),
      Highlight.configure({
        multicolor: false,
        HTMLAttributes: {
          class: "bg-yellow-200 dark:bg-yellow-800 rounded px-1",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
      }),
      Underline,
      Strike,
      Link.configure({
        HTMLAttributes: {
          class:
            "text-blue-600 dark:text-blue-400 cursor-pointer underline hover:text-blue-800 dark:hover:text-blue-300",
        },
        openOnClick: false,
      }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-sm sm:prose-base max-w-none min-h-[150px] p-2 focus:outline-none",
      },
    },
    immediatelyRender: false,
  });

  if (!mounted || !editor) {
    return (
      <div className="prose dark:prose-invert prose-sm sm:prose-base max-w-none min-h-[150px] p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-400">
        {placeholder}
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const isHeadingActive = (level: number) => {
    return editor.isActive("heading", { level });
  };

  const isTextAlignActive = (align: string) => {
    return editor.isActive({ textAlign: align });
  };

  const toolbarButtons = [
    // Headings
    {
      label: "H1",
      active: isHeadingActive(1),
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: "H2",
      active: isHeadingActive(2),
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "H3",
      active: isHeadingActive(3),
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: "P",
      active: editor.isActive("paragraph"),
      action: () => editor.chain().focus().setParagraph().run(),
    },
    // Text formatting
    {
      label: "B",
      active: editor.isActive("bold"),
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: "I",
      active: editor.isActive("italic"),
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: "U",
      active: editor.isActive("underline"),
      action: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      label: "S",
      active: editor.isActive("strike"),
      action: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      label: "Highlight",
      active: editor.isActive("highlight"),
      action: () => editor.chain().focus().toggleHighlight().run(),
    },
    // Lists
    {
      label: "• List",
      active: editor.isActive("bulletList"),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "1. List",
      active: editor.isActive("orderedList"),
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
    // Alignment
    {
      label: "Left",
      active: isTextAlignActive("left"),
      action: () => editor.chain().focus().setTextAlign("left").run(),
    },
    {
      label: "Center",
      active: isTextAlignActive("center"),
      action: () => editor.chain().focus().setTextAlign("center").run(),
    },
    {
      label: "Right",
      active: isTextAlignActive("right"),
      action: () => editor.chain().focus().setTextAlign("right").run(),
    },
    {
      label: "Justify",
      active: isTextAlignActive("justify"),
      action: () => editor.chain().focus().setTextAlign("justify").run(),
    },
    // Link
    {
      label: "Link",
      active: editor.isActive("link"),
      action: setLink,
    },
  ];

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus-within:ring-1 focus-within:ring-gray-300 dark:focus-within:ring-gray-500 transition-all duration-200">
      <EditorContent editor={editor} placeholder={placeholder} />

      <div className="flex flex-wrap items-center gap-4 p-2 pl-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
        {toolbarButtons.map((btn, index) => (
          <button
            key={index}
            type="button"
            onClick={btn.action}
            className={`p-1 rounded text-gray-600 dark:text-white cursor-pointer transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 ${
              btn.active ? "bg-gray-200 dark:bg-gray-700" : ""
            }`}
            title={btn.label}
          >
            <span
              className={`${
                btn.label === "B"
                  ? "font-bold"
                  : btn.label === "I"
                  ? "italic"
                  : btn.label === "U"
                  ? "underline"
                  : btn.label === "S"
                  ? "line-through"
                  : ""
              }`}
            >
              {btn.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
