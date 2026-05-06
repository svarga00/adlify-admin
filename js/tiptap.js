// js/tiptap.js — Lazy-loaded WYSIWYG editor
// Used by Blog and Cases editors

window.TipTap = {
  loaded: false,

  /**
   * Load TipTap from CDN (only once)
   */
  async load() {
    if (this.loaded) return;
    return new Promise((resolve, reject) => {
      // Use UMD bundle from esm.sh — single file
      const script = document.createElement('script');
      script.type = 'module';
      script.textContent = `
        import { Editor } from 'https://esm.sh/@tiptap/core@2';
        import StarterKit from 'https://esm.sh/@tiptap/starter-kit@2';
        import Link from 'https://esm.sh/@tiptap/extension-link@2';
        import Image from 'https://esm.sh/@tiptap/extension-image@2';
        import Placeholder from 'https://esm.sh/@tiptap/extension-placeholder@2';
        window.__TipTapModules = { Editor, StarterKit, Link, Image, Placeholder };
        window.dispatchEvent(new CustomEvent('tiptap-ready'));
      `;
      script.onerror = reject;
      window.addEventListener('tiptap-ready', () => {
        this.loaded = true;
        resolve();
      }, { once: true });
      document.head.appendChild(script);
      // Timeout safety
      setTimeout(() => {
        if (!this.loaded) reject(new Error('TipTap load timeout'));
      }, 8000);
    });
  },

  /**
   * Mount editor on element
   * @param {HTMLElement} el - editor container
   * @param {string} initialHtml
   * @param {object} opts - { placeholder, onChange }
   * @returns Editor instance with .getHTML() / .destroy()
   */
  async mount(el, initialHtml = '', opts = {}) {
    await this.load();
    const { Editor, StarterKit, Link, Image, Placeholder } = window.__TipTapModules;

    const editor = new Editor({
      element: el,
      extensions: [
        StarterKit,
        Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-brand-500 underline' } }),
        Image,
        Placeholder.configure({ placeholder: opts.placeholder || 'Začnite písať…' }),
      ],
      content: initialHtml,
      editorProps: {
        attributes: {
          class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-3',
        },
      },
      onUpdate: () => {
        if (opts.onChange) opts.onChange(editor.getHTML());
      },
    });

    return editor;
  },

  /**
   * Render toolbar HTML for given editor
   */
  toolbarHTML() {
    return `
      <div class="tiptap-toolbar flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button type="button" data-cmd="bold" title="Bold (Ctrl+B)" class="tt-btn">
          <strong>B</strong>
        </button>
        <button type="button" data-cmd="italic" title="Italic (Ctrl+I)" class="tt-btn italic">I</button>
        <button type="button" data-cmd="strike" title="Strikethrough" class="tt-btn line-through">S</button>
        <span class="w-px h-5 bg-gray-300 mx-1"></span>
        <button type="button" data-cmd="h2" title="Heading 2" class="tt-btn font-bold">H2</button>
        <button type="button" data-cmd="h3" title="Heading 3" class="tt-btn font-bold">H3</button>
        <button type="button" data-cmd="paragraph" title="Paragraph" class="tt-btn">P</button>
        <span class="w-px h-5 bg-gray-300 mx-1"></span>
        <button type="button" data-cmd="bulletList" title="Bullet list" class="tt-btn">•</button>
        <button type="button" data-cmd="orderedList" title="Numbered list" class="tt-btn">1.</button>
        <button type="button" data-cmd="blockquote" title="Quote" class="tt-btn">"</button>
        <span class="w-px h-5 bg-gray-300 mx-1"></span>
        <button type="button" data-cmd="link" title="Link" class="tt-btn">🔗</button>
        <button type="button" data-cmd="image" title="Image" class="tt-btn">🖼️</button>
        <button type="button" data-cmd="hr" title="Horizontal rule" class="tt-btn">—</button>
        <span class="w-px h-5 bg-gray-300 mx-1"></span>
        <button type="button" data-cmd="undo" title="Undo (Ctrl+Z)" class="tt-btn">↶</button>
        <button type="button" data-cmd="redo" title="Redo" class="tt-btn">↷</button>
      </div>
    `;
  },

  /**
   * Bind toolbar to editor
   */
  bindToolbar(toolbarEl, editor) {
    toolbarEl.querySelectorAll('button[data-cmd]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const cmd = btn.getAttribute('data-cmd');
        const chain = editor.chain().focus();

        switch (cmd) {
          case 'bold':       chain.toggleBold().run(); break;
          case 'italic':     chain.toggleItalic().run(); break;
          case 'strike':     chain.toggleStrike().run(); break;
          case 'h2':         chain.toggleHeading({ level: 2 }).run(); break;
          case 'h3':         chain.toggleHeading({ level: 3 }).run(); break;
          case 'paragraph':  chain.setParagraph().run(); break;
          case 'bulletList': chain.toggleBulletList().run(); break;
          case 'orderedList':chain.toggleOrderedList().run(); break;
          case 'blockquote': chain.toggleBlockquote().run(); break;
          case 'hr':         chain.setHorizontalRule().run(); break;
          case 'undo':       chain.undo().run(); break;
          case 'redo':       chain.redo().run(); break;
          case 'link': {
            const url = prompt('URL odkazu:', editor.getAttributes('link').href || 'https://');
            if (url === null) return;
            if (url === '') chain.unsetLink().run();
            else chain.setLink({ href: url }).run();
            break;
          }
          case 'image': {
            const url = prompt('URL obrázka:', 'https://');
            if (url) chain.setImage({ src: url }).run();
            break;
          }
        }

        // Update active state of buttons
        this.updateButtonStates(toolbarEl, editor);
      });
    });

    // Update button states on selection change
    editor.on('selectionUpdate', () => this.updateButtonStates(toolbarEl, editor));
    editor.on('update', () => this.updateButtonStates(toolbarEl, editor));
  },

  updateButtonStates(toolbarEl, editor) {
    const checks = {
      bold:       () => editor.isActive('bold'),
      italic:     () => editor.isActive('italic'),
      strike:     () => editor.isActive('strike'),
      h2:         () => editor.isActive('heading', { level: 2 }),
      h3:         () => editor.isActive('heading', { level: 3 }),
      bulletList: () => editor.isActive('bulletList'),
      orderedList:() => editor.isActive('orderedList'),
      blockquote: () => editor.isActive('blockquote'),
      link:       () => editor.isActive('link'),
    };
    toolbarEl.querySelectorAll('button[data-cmd]').forEach(btn => {
      const cmd = btn.getAttribute('data-cmd');
      if (checks[cmd]) {
        btn.classList.toggle('bg-gray-900', checks[cmd]());
        btn.classList.toggle('text-white', checks[cmd]());
      }
    });
  },
};

// CSS for toolbar buttons
const ttStyle = document.createElement('style');
ttStyle.textContent = `
  .tt-btn {
    min-width: 30px;
    height: 30px;
    padding: 0 8px;
    border-radius: 6px;
    color: #4B5563;
    font-size: 13px;
    transition: background 0.15s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .tt-btn:hover { background: #E5E7EB; color: #111827; }
  .ProseMirror p.is-editor-empty:first-child::before {
    color: #9CA3AF;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
  .ProseMirror { outline: none; }
  .ProseMirror h2 { font-size: 1.5em; font-weight: 700; margin-top: 1em; margin-bottom: 0.5em; }
  .ProseMirror h3 { font-size: 1.25em; font-weight: 700; margin-top: 1em; margin-bottom: 0.5em; }
  .ProseMirror p { margin-bottom: 0.75em; }
  .ProseMirror ul, .ProseMirror ol { margin-left: 1.5em; margin-bottom: 0.75em; }
  .ProseMirror ul { list-style-type: disc; }
  .ProseMirror ol { list-style-type: decimal; }
  .ProseMirror blockquote { border-left: 3px solid #E5E7EB; padding-left: 1em; color: #6B7280; }
  .ProseMirror img { max-width: 100%; border-radius: 8px; margin: 0.5em 0; }
  .ProseMirror a { color: #F16434; text-decoration: underline; }
  .ProseMirror hr { border: none; border-top: 1px solid #E5E7EB; margin: 1.5em 0; }
`;
document.head.appendChild(ttStyle);
