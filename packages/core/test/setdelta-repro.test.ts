import { beforeEach, describe, expect, it } from 'vitest';

import { Delta, QuoltEditor } from '../src/index.js';

describe('setDelta reproductions', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('setDelta with header attribute on newline', () => {
    const editor = new QuoltEditor(container);
    const delta = new Delta().insert('title').insert('\n', { header: 1 });
    expect(() => editor.content.setDelta(delta)).not.toThrow();
    expect(editor.content.getHTML()).toMatch(/<h1/);
  });

  it('setDelta with link attribute on inline text', () => {
    const editor = new QuoltEditor(container);
    const delta = new Delta()
      .insert('click ')
      .insert('here', { link: 'https://example.com' })
      .insert('\n');
    expect(() => editor.content.setDelta(delta)).not.toThrow();
    expect(editor.content.getHTML()).toMatch(/<a[^>]*href="https:\/\/example\.com"/);
  });

  it('setDelta with header + paragraph + link (playground seed shape)', () => {
    const editor = new QuoltEditor(container);
    const delta = new Delta()
      .insert('Designing in the open')
      .insert('\n', { header: 1 })
      .insert('Click ')
      .insert('this link', { link: 'https://quolt.dev' })
      .insert(' to see it.')
      .insert('\n');
    expect(() => editor.content.setDelta(delta)).not.toThrow();
  });

  it('initialContent: Delta passed to QuoltEditor constructor', () => {
    const delta = new Delta()
      .insert('title')
      .insert('\n', { header: 1 })
      .insert('body\n');
    expect(
      () => new QuoltEditor(container, { initialContent: delta }),
    ).not.toThrow();
  });
});
