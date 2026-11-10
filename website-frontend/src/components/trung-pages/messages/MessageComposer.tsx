"use client";

import { useRef, useState } from "react";
import { Paperclip, SendHorizontal, X } from "lucide-react";
import styles from "./MessagesPage.module.css";

const MAX_LENGTH = 2000;
const MAX_HEIGHT = 140;

type Props = {
  disabled?: boolean;
  onSend: (text: string, attachments: string[]) => void;
};

export default function MessageComposer({ disabled, onSend }: Props) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const resize = () => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  };

  const canSend = !disabled && (text.trim() !== "" || files.length > 0);

  const submit = () => {
    if (!canSend) return;
    onSend(text.trim(), files);
    setText("");
    setFiles([]);
    requestAnimationFrame(resize);
    areaRef.current?.focus();
  };

  return (
    <form
      className={styles.composer}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {files.length > 0 && (
        <ul className={styles.fileChips} aria-label="Tệp đính kèm">
          {files.map((name, i) => (
            <li key={`${name}-${i}`} className={styles.fileChip}>
              <Paperclip size={13} aria-hidden="true" />
              <span>{name}</span>
              <button
                type="button"
                aria-label={`Bỏ ${name}`}
                onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.composerRow}>
        {/* Mock upload: only file names are kept until a storage service exists. */}
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            const names = Array.from(e.target.files ?? [], (f) => f.name);
            setFiles((prev) => [...prev, ...names].slice(0, 5));
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Đính kèm tệp"
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip size={20} />
        </button>
        <textarea
          ref={areaRef}
          className={styles.composerInput}
          rows={1}
          value={text}
          maxLength={MAX_LENGTH}
          disabled={disabled}
          placeholder="Nhập tin nhắn..."
          title="Enter để gửi, Shift+Enter để xuống dòng"
          aria-label="Nội dung tin nhắn"
          onChange={(e) => {
            setText(e.target.value);
            resize();
          }}
          onKeyDown={(e) => {
            // isComposing: Vietnamese IMEs (Telex/VNI) confirm with Enter.
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button type="submit" className={styles.sendBtn} aria-label="Gửi tin nhắn" disabled={!canSend}>
          <SendHorizontal size={20} />
        </button>
      </div>
    </form>
  );
}
