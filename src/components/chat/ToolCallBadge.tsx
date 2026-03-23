"use client";

import { Loader2 } from "lucide-react";

interface ToolCallBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: string;
  result?: unknown;
}

export function getLabel(toolName: string, args: Record<string, unknown>): string {
  const filename =
    typeof args.path === "string" ? args.path.split("/").pop() ?? args.path : undefined;

  if (toolName === "str_replace_editor" && filename) {
    switch (args.command) {
      case "create":
        return `Creating ${filename}`;
      case "str_replace":
      case "insert":
        return `Editing ${filename}`;
      case "view":
        return `Reading ${filename}`;
      case "undo_edit":
        return `Undoing edit in ${filename}`;
    }
  }

  if (toolName === "file_manager" && filename) {
    switch (args.command) {
      case "delete":
        return `Deleting ${filename}`;
      case "rename": {
        const newFilename =
          typeof args.new_path === "string"
            ? args.new_path.split("/").pop() ?? args.new_path
            : String(args.new_path ?? "");
        return `Renaming ${filename} to ${newFilename}`;
      }
    }
  }

  return toolName;
}

export function ToolCallBadge({ toolName, args, state, result }: ToolCallBadgeProps) {
  const label = getLabel(toolName, args);
  const done = state === "result" && result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
