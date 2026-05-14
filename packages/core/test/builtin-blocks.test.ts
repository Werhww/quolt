import { beforeEach, describe, expect, it } from 'vitest';

import { QuoltEditor } from '../src/index.js';

describe('Built-in blocks', () => {
  let container: HTMLElement;
  let editor: QuoltEditor;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new QuoltEditor(container);
    editor.content.setHTML('<p>hello world</p>');
    editor.selection.set(0, 5);
  });

  describe('header', () => {
    it('wraps the line in <h1> with quolt-h1 class', () => {
      editor.format.set('header', 1);
      const html = editor.content.getHTML();
      expect(html).toMatch(/<h1[^>]*class="[^"]*quolt-h1/);
      expect(editor.format.has('header')).toBe(true);
      expect(editor.format.current()['header']).toBe(1);
    });

    it('cleans up the previous variant class when switching levels', () => {
      editor.format.set('header', 1);
      editor.format.set('header', 2);
      const html = editor.content.getHTML();
      expect(html).toMatch(/<h2[^>]*class="[^"]*quolt-h2/);
      expect(html).not.toMatch(/quolt-h1/);
    });

    it('clears back to <p> when set false', () => {
      editor.format.set('header', 1);
      editor.format.set('header', false);
      const html = editor.content.getHTML();
      expect(html).toMatch(/<p>/);
      expect(html).not.toMatch(/<h1/);
    });

    it('parses incoming <h2> as header:2', () => {
      editor.content.setHTML('<h2>title</h2>');
      editor.selection.set(0, 5);
      expect(editor.format.current()['header']).toBe(2);
    });

    it('sugar: format.heading(3) sets H3', () => {
      editor.format.heading(3);
      expect(editor.content.getHTML()).toMatch(/<h3[^>]*class="[^"]*quolt-h3/);
      expect(editor.format.current()['header']).toBe(3);
    });

    it('sugar: format.heading(N) on the same level clears it', () => {
      editor.format.heading(2);
      editor.format.heading(2);
      const html = editor.content.getHTML();
      expect(html).toMatch(/<p>/);
      expect(html).not.toMatch(/<h2/);
    });
  });

  describe('blockquote', () => {
    it('wraps the line in <blockquote> with quolt-blockquote class', () => {
      editor.format.set('blockquote', true);
      const html = editor.content.getHTML();
      expect(html).toMatch(/<blockquote[^>]*class="[^"]*quolt-blockquote/);
      expect(editor.format.has('blockquote')).toBe(true);
    });

    it('sugar: format.blockquote() toggles', () => {
      editor.format.blockquote();
      expect(editor.format.has('blockquote')).toBe(true);
      editor.format.blockquote();
      expect(editor.format.has('blockquote')).toBe(false);
    });

    it('parses incoming <blockquote> back to the format', () => {
      editor.content.setHTML('<blockquote>quote</blockquote>');
      editor.selection.set(0, 5);
      expect(editor.format.has('blockquote')).toBe(true);
    });
  });

  describe('code-block', () => {
    it('wraps the line in <pre> with quolt-code-block class', () => {
      editor.format.set('code-block', true);
      const html = editor.content.getHTML();
      expect(html).toMatch(/<pre[^>]*class="[^"]*quolt-code-block/);
      expect(editor.format.has('code-block')).toBe(true);
    });

    it('sugar: format.codeBlock() toggles', () => {
      editor.format.codeBlock();
      expect(editor.format.has('code-block')).toBe(true);
      editor.format.codeBlock();
      expect(editor.format.has('code-block')).toBe(false);
    });
  });

  it('built-in blocks survive across editor instances (no class collision)', () => {
    const c2 = document.createElement('div');
    document.body.appendChild(c2);
    const editor2 = new QuoltEditor(c2);
    editor2.content.setHTML('<h1>title</h1>');
    expect(editor2.content.getHTML()).toMatch(/<h1[^>]*class="[^"]*quolt-h1/);
  });
});
