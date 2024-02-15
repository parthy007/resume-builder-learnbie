import { useRef, useEffect, memo, useState } from 'react';
import 'jodit/build/jodit.min.css';
import { LinkPlugin } from './plugins/link';
import styles from './jodit.module.css';
import Typo from 'typo-js';

const dict = new Typo('en_US', false as any, false as any, { dictionaryPath: '/assets' });

interface IRichtext {
  label: string;

  onChange: (htmlOutput: string) => void;

  value: string;

  name: string;
}

export const RichtextEditor = memo(({ label, onChange, value }: IRichtext) => {
  const editorContainerRef = useRef<HTMLTextAreaElement | null>(null);

  const editorRef = useRef<any>(null);
  const [editorInstanceCreated, setEditorInstanceCreated] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [caretPosition, setCaretPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    if (editorContainerRef.current) {
      const initEditor = async () => {
        const { Jodit } = await import('jodit');

        const editor = Jodit.make(editorContainerRef.current as HTMLTextAreaElement, {
          showCharsCounter: false,
          showWordsCounter: false,
          showXPathInStatusbar: false,
          buttons: ['bold', 'italic', 'link', 'ul', 'ol', 'undo', 'redo'],
          disablePlugins:
            'add-new-line,print,preview,table,table-keyboard-navigation,select-cells,resize-cells,file,video,media,image,image-processor,image-properties,xpath,tab,stat,search,powered-by-jodit,mobile,justify,inline-popup,indent,iframe,fullsize',
          useSearch: false,
          askBeforePasteHTML: false,
          askBeforePasteFromWord: false,
          defaultActionOnPaste: 'insert_only_text',
          maxHeight: 200,
          link: LinkPlugin,
        });
        editor.value = value;
        editorRef.current = editor;
        setEditorInstanceCreated(true);
      };
      initEditor();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editorRef.current && editorInstanceCreated) {
      editorRef.current.value = value;
    }
  }, [value, editorInstanceCreated]);

  useEffect(() => {
    if (editorRef.current && editorInstanceCreated) {
      editorRef.current.events.on('change', () => {
        const newText = editorRef.current.value || '';
        const textWithoutTags = newText.replace(/<\/?[^>]+(>|$)/g, '');
        const words = textWithoutTags.split(/\s+/);
        const newWord = words[words.length - 1];
        setCurrentWord(newWord);
        if (newWord.length > 2) {
          const suggestions = dict.suggest(newWord);
          setSuggestions(suggestions);
        } else {
          setSuggestions([]);
        }
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (range.startContainer && range.startContainer.parentElement) {
            const rect = range.getClientRects()[0];
            const editorRect = editorRef.current.container.getBoundingClientRect();
            const caretPosition = {
              top: rect ? rect.top - editorRect.top : 0,
              left: rect ? rect.left - editorRect.left : 0,
            };
            setCaretPosition(caretPosition);
          }
        }
      });
    }
  }, [onChange, editorInstanceCreated]);

  const handleSuggestionClick = (suggestion: string) => {
    const newText = editorRef.current.value || '';
    const textWithoutTags = newText.replace(/<\/?[^>]+(>|$)/g, '');
    const words = textWithoutTags.split(/\s+/);
    words[words.length - 1] = suggestion;
    const updatedText = words.join(' ');
    editorRef.current.value = updatedText;
    setCurrentWord(suggestion);
    setSuggestions([]);
  };

  return (
    <div className={`${styles.editor_wrapper} mb-4`}>
      <div
        style={{
          padding: '8px 16px 0px',
        }}
        className="text-resume-800 text-xs mb-1"
      >
        <span>{label}</span>
      </div>

      <div style={{ position: 'relative', display: 'block' }}>
        <textarea
          ref={editorContainerRef}
          className={`min-h-[200px] min-w-full bg-[rgba(0,0,0,0.06)]`}
        ></textarea>

        {suggestions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: caretPosition.top / 10 + 30,
              left: caretPosition.left + 5,
              backgroundColor: 'rgb(236 207 225)',
              padding: '5px',
              borderRadius: '10px',
              zIndex: '99',
            }}
          >
            <ul>
              {suggestions.map((suggestion, index) => (
                <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
});

RichtextEditor.displayName = 'RichtextEditor';
