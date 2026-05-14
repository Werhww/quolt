import type { QuoltEditor } from './QuoltEditor.js';
import type { MountedFormat } from './types.js';

/**
 * Maps a Quill scroll root element (quill.root) to its owning QuoltEditor.
 * Custom blots resolve their editor via this map inside their constructor,
 * where the scroll is reachable but no instance reference would otherwise exist.
 */
const editors = new WeakMap<HTMLElement, QuoltEditor>();

export function registerEditor(root: HTMLElement, editor: QuoltEditor): void {
  editors.set(root, editor);
}

export function unregisterEditor(root: HTMLElement): void {
  editors.delete(root);
}

export function lookupEditor(root: HTMLElement | null | undefined): QuoltEditor | undefined {
  return root ? editors.get(root) : undefined;
}

/**
 * Renderer handles keyed by the host blot's container element. The blot's
 * lifecycle hooks call into this map so the Parchment class itself stays a
 * plain generated class — no closure over instance state.
 */
const handles = new WeakMap<HTMLElement, MountedFormat<unknown>>();

export function setRendererHandle(node: HTMLElement, handle: MountedFormat<unknown>): void {
  handles.set(node, handle);
}

export function getRendererHandle(node: HTMLElement): MountedFormat<unknown> | undefined {
  return handles.get(node);
}

export function clearRendererHandle(node: HTMLElement): void {
  handles.delete(node);
}
