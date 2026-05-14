import { beforeEach, describe, expect, it } from 'vitest';

import { QuoltEditor, defineEmbed } from '../src/index.js';

describe('QuoltEditor', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('constructs and exposes Quill via escape hatch', () => {
    const editor = new QuoltEditor(container);
    expect(editor.quill).toBeDefined();
    // Empty Quill document always has the trailing newline.
    expect(editor.content.getText()).toBe('\n');
    expect(editor.content.isEmpty()).toBe(true);
  });

  it('format.bold toggles bold on the current selection', () => {
    const editor = new QuoltEditor(container);
    editor.content.setHTML('<p>hello world</p>');
    editor.selection.set(0, 5);
    editor.format.bold();
    expect(editor.format.has('bold')).toBe(true);

    editor.format.bold();
    expect(editor.format.has('bold')).toBe(false);
  });

  it('content.setHTML round-trips simple HTML', () => {
    const editor = new QuoltEditor(container);
    editor.content.setHTML('<p><strong>bold</strong></p>');
    expect(editor.content.getHTML()).toContain('<strong>bold</strong>');
  });

  it('insert.text writes at the cursor and advances selection', () => {
    const editor = new QuoltEditor(container);
    editor.insert.text('hi');
    expect(editor.content.getText().startsWith('hi')).toBe(true);
    expect(editor.selection.get()?.index).toBe(2);
  });

  it('defineEmbed registers a declarative block embed', () => {
    const divider = defineEmbed<true>({
      name: 'divider',
      inline: false,
      toDOM: () => ({ html: '<hr />' }),
    });
    const editor = new QuoltEditor(container, { formats: [divider] });
    // Note: Quill treats `null` embed values as no-op. Use a truthy sentinel
    // (true, {}, etc.) for value-less embeds.
    editor.insert.embed('divider', true);
    expect(editor.content.getHTML()).toMatch(/<hr/);
  });

  it('on/off attaches and detaches change handlers', () => {
    const editor = new QuoltEditor(container);
    let count = 0;
    const handler = (): void => {
      count += 1;
    };
    editor.on('change', handler);
    editor.insert.text('hi');
    expect(count).toBeGreaterThan(0);

    const before = count;
    editor.off('change', handler);
    editor.insert.text(' there');
    expect(count).toBe(before);
  });

  it('destroy cleans up and is idempotent', () => {
    const editor = new QuoltEditor(container);
    editor.destroy();
    expect(container.innerHTML).toBe('');
    // Calling again should not throw.
    expect(() => editor.destroy()).not.toThrow();
  });
});
