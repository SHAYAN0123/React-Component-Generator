import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge, getLabel } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// --- getLabel unit tests ---

test("getLabel: str_replace_editor create", () => {
  expect(getLabel("str_replace_editor", { command: "create", path: "src/App.jsx" })).toBe("Creating App.jsx");
});

test("getLabel: str_replace_editor str_replace", () => {
  expect(getLabel("str_replace_editor", { command: "str_replace", path: "src/components/Card.jsx" })).toBe("Editing Card.jsx");
});

test("getLabel: str_replace_editor insert", () => {
  expect(getLabel("str_replace_editor", { command: "insert", path: "src/App.jsx" })).toBe("Editing App.jsx");
});

test("getLabel: str_replace_editor view", () => {
  expect(getLabel("str_replace_editor", { command: "view", path: "src/utils.ts" })).toBe("Reading utils.ts");
});

test("getLabel: str_replace_editor undo_edit", () => {
  expect(getLabel("str_replace_editor", { command: "undo_edit", path: "src/App.jsx" })).toBe("Undoing edit in App.jsx");
});

test("getLabel: file_manager delete", () => {
  expect(getLabel("file_manager", { command: "delete", path: "src/old.jsx" })).toBe("Deleting old.jsx");
});

test("getLabel: file_manager rename", () => {
  expect(
    getLabel("file_manager", { command: "rename", path: "src/old.jsx", new_path: "src/new.jsx" })
  ).toBe("Renaming old.jsx to new.jsx");
});

test("getLabel: falls back to toolName when no path", () => {
  expect(getLabel("str_replace_editor", { command: "create" })).toBe("str_replace_editor");
});

test("getLabel: falls back to toolName for unknown tool", () => {
  expect(getLabel("some_other_tool", { command: "do_thing", path: "src/file.ts" })).toBe("some_other_tool");
});

test("getLabel: falls back to toolName when no command", () => {
  expect(getLabel("str_replace_editor", { path: "src/App.jsx" })).toBe("str_replace_editor");
});

// --- ToolCallBadge rendering tests ---

test("shows friendly label", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/App.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("shows spinner while in-progress", () => {
  const { container } = render(
    <ToolCallBadge toolName="str_replace_editor" args={{ command: "create", path: "src/App.jsx" }} state="call" />
  );
  expect(container.querySelector(".animate-spin")).toBeTruthy();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows green dot when done", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/App.jsx" }}
      state="result"
      result="OK"
    />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeTruthy();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when state is result but result is null", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "src/App.jsx" }}
      state="result"
      result={null}
    />
  );
  expect(container.querySelector(".animate-spin")).toBeTruthy();
});

test("renders file_manager rename label", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "rename", path: "src/old.jsx", new_path: "src/new.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Renaming old.jsx to new.jsx")).toBeDefined();
});

test("renders file_manager delete label", () => {
  render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "src/unused.jsx" }}
      state="call"
    />
  );
  expect(screen.getByText("Deleting unused.jsx")).toBeDefined();
});

test("falls back to toolName for unrecognized args", () => {
  render(
    <ToolCallBadge toolName="str_replace_editor" args={{}} state="call" />
  );
  expect(screen.getByText("str_replace_editor")).toBeDefined();
});
