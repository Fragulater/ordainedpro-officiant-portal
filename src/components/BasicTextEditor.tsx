"use client"

import { useEffect, useMemo, useRef } from "react"
import { AlignCenter, AlignLeft, AlignRight, List, ListOrdered } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type BasicTextEditorProps = {
  value: string
  onChange: (value: string) => void
  minHeightClassName?: string
  maxCharacters?: number
}

export const SCRIPT_EDITOR_MAX_CHARACTERS = 50000

const colors = [
  "#000000",
  "#ff0000",
  "#0000ff",
  "#008000",
  "#800080",
  "#f59e0b",
  "#b91c1c",
  "#6b7280",
]

export function normalizeTextForEditor(content: string) {
  if (!content) return ""
  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(content)
  return hasHtml ? content : content.replace(/\n/g, "<br>")
}

export function stripEditorHtml(content: string) {
  if (!content) return ""

  const container = document.createElement("div")
  container.innerHTML = content

  container.querySelectorAll("br").forEach((br) => {
    br.replaceWith("\n")
  })

  container.querySelectorAll("p, div, li").forEach((block) => {
    if (block.textContent?.trim()) {
      block.append("\n")
    }
  })

  return container.textContent?.replace(/\n{3,}/g, "\n\n").trim() || ""
}

export function BasicTextEditor({
  value,
  onChange,
  minHeightClassName = "min-h-[420px]",
  maxCharacters = SCRIPT_EDITOR_MAX_CHARACTERS,
}: BasicTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  const stats = useMemo(() => {
    const plainText =
      typeof document === "undefined" ? value.replace(/<[^>]*>/g, " ") : stripEditorHtml(value)
    const words = plainText.split(/\s+/).filter(Boolean).length
    const characters = plainText.length
    const lines = Math.max(1, plainText.split(/\n/).length)

    return { words, characters, lines }
  }, [value])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || document.activeElement === editor) return

    if (editor.innerHTML !== value) {
      editor.innerHTML = value || ""
    }
  }, [value])

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, commandValue)
    onChange(editorRef.current?.innerHTML || "")
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b bg-gray-50 p-3">
        <Button size="sm" variant="outline" className="font-bold" onClick={() => runCommand("bold")} title="Bold">
          B
        </Button>
        <Button size="sm" variant="outline" className="italic" onClick={() => runCommand("italic")} title="Italic">
          I
        </Button>
        <Button size="sm" variant="outline" className="underline" onClick={() => runCommand("underline")} title="Underline">
          U
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <span className="text-xs text-gray-600">Colors:</span>
        <div className="flex items-center gap-1">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              className="h-6 w-6 rounded border border-gray-300 hover:ring-2 hover:ring-blue-200"
              style={{ backgroundColor: color }}
              onClick={() => runCommand("foreColor", color)}
              title={`Text color ${color}`}
            />
          ))}
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <select
          className="h-8 rounded-md border border-gray-300 bg-white px-3 text-sm"
          defaultValue="3"
          onChange={(event) => runCommand("fontSize", event.target.value)}
          title="Font size"
        >
          <option value="2">Small</option>
          <option value="3">Normal</option>
          <option value="4">Large</option>
          <option value="6">Extra Large</option>
        </select>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button size="sm" variant="outline" onClick={() => runCommand("justifyLeft")} title="Align left">
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => runCommand("justifyCenter")} title="Center">
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => runCommand("justifyRight")} title="Align right">
          <AlignRight className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button size="sm" variant="outline" onClick={() => runCommand("insertUnorderedList")} title="Bullet list">
          <List className="h-4 w-4" />
          List
        </Button>
        <Button size="sm" variant="outline" onClick={() => runCommand("insertOrderedList")} title="Numbered list">
          <ListOrdered className="h-4 w-4" />
          List
        </Button>
      </div>

      <div className="p-4">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className={`w-full rounded-lg border-2 border-gray-200 bg-white p-6 font-serif leading-loose outline-none focus:border-pink-500 ${minHeightClassName}`}
          onInput={(event) => onChange((event.currentTarget as HTMLDivElement).innerHTML)}
          dangerouslySetInnerHTML={{ __html: value || "" }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-gray-50 px-4 py-3 text-sm text-gray-600">
        <div>
          Words: {stats.words} | Characters: {stats.characters}/{maxCharacters} | Lines: {stats.lines}
        </div>
        <div>Font Size: 16px</div>
      </div>
    </div>
  )
}
