import { beforeEach, describe, expect, it } from 'vitest';

import { QuoltEditor } from '../src/index.js';
import { sanitizeUrl } from '../src/builtin/marks/link.js';

describe('Built-in marks', () => {
  let container: HTMLElement;
  let editor: QuoltEditor;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    editor = new QuoltEditor(container);
    editor.content.setHTML('<p>hello world</p>');
    editor.selection.set(0, 5);
  });

  describe('bold', () => {
    it('wraps the selection in <strong>', () => {
      editor.format.bold();
      expect(editor.content.getHTML()).toMatch(/<strong>hello<\/strong>/);
      expect(editor.format.has('bold')).toBe(true);
    });

    it('accepts <b> from HTML input', () => {
      editor.content.setHTML('<p><b>hi</b></p>');
      editor.selection.set(0, 2);
      expect(editor.format.has('bold')).toBe(true);
    });
  });

  describe('italic', () => {
    it('wraps the selection in <em>', () => {
      editor.format.italic();
      expect(editor.content.getHTML()).toMatch(/<em>hello<\/em>/);
      expect(editor.format.has('italic')).toBe(true);
    });

    it('accepts <i> from HTML input', () => {
      editor.content.setHTML('<p><i>hi</i></p>');
      editor.selection.set(0, 2);
      expect(editor.format.has('italic')).toBe(true);
    });
  });

  describe('underline', () => {
    it('wraps the selection in <u>', () => {
      editor.format.underline();
      expect(editor.content.getHTML()).toMatch(/<u>hello<\/u>/);
      expect(editor.format.has('underline')).toBe(true);
    });
  });

  describe('strike', () => {
    it('wraps the selection in <s>', () => {
      editor.format.strike();
      expect(editor.content.getHTML()).toMatch(/<s>hello<\/s>/);
      expect(editor.format.has('strike')).toBe(true);
    });
  });

  describe('link', () => {
    it('wraps the selection in <a> with href + rel + target', () => {
      editor.format.set('link', 'https://quolt.dev');
      const html = editor.content.getHTML();
      expect(html).toMatch(/<a[^>]*href="https:\/\/quolt\.dev"/);
      expect(html).toMatch(/rel="noopener noreferrer"/);
      expect(html).toMatch(/target="_blank"/);
    });

    it('sanitizes javascript: URLs to about:blank', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('about:blank');
      expect(sanitizeUrl('data:text/html,<script>')).toBe('about:blank');
    });

    it('allows http, https, mailto, tel, anchors, and relative paths', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
      expect(sanitizeUrl('mailto:foo@bar.com')).toBe('mailto:foo@bar.com');
      expect(sanitizeUrl('tel:+12025550100')).toBe('tel:+12025550100');
      expect(sanitizeUrl('/relative')).toBe('/relative');
      expect(sanitizeUrl('#anchor')).toBe('#anchor');
    });
  });

  describe('color', () => {
    it('wraps the selection in <span style="color: ...">', () => {
      editor.format.set('color', 'rgb(255, 0, 0)');
      expect(editor.content.getHTML()).toMatch(/style="[^"]*color:\s*rgb\(255,\s*0,\s*0\)/);
    });
  });

  describe('background', () => {
    it('wraps the selection in <span style="background-color: ...">', () => {
      editor.format.set('background', 'rgb(255, 255, 0)');
      expect(editor.content.getHTML()).toMatch(
        /style="[^"]*background-color:\s*rgb\(255,\s*255,\s*0\)/,
      );
    });
  });

  it('built-ins do not collide between editor instances', () => {
    const c2 = document.createElement('div');
    document.body.appendChild(c2);
    const editor2 = new QuoltEditor(c2);
    editor2.content.setHTML('<p><strong>two</strong></p>');
    expect(editor2.content.getHTML()).toMatch(/<strong>two<\/strong>/);
  });
});
