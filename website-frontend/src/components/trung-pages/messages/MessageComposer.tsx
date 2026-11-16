"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import styles from "./MessagesPage.module.css";
// communication-service accepts up to 5000 characters; attachments are not
// accepted yet (no upload/verification on the backend), so there is no picker.
const MAX_LENGTH = 2000;
const MAX_HEIGHT = 140;
type Props = {
  disabled?: boolean;
  onSend: (text: string) => void;
};
export default function MessageComposer({
  disabled,
  onSend
}: Props) {
  const tr = useTranslations("misc");
  const [text, setText] = useState("");
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const resize = () => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  };
  const canSend = !disabled && text.trim() !== "";
  const submit = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
    requestAnimationFrame(resize);
    areaRef.current?.focus();
  };
  return <form className={styles.composer} onSubmit={e => {
    e.preventDefault();
    submit();
  }}>
      <div className={styles.composerRow}>
        <textarea ref={areaRef} className={styles.composerInput} rows={1} value={text} maxLength={MAX_LENGTH} disabled={disabled} placeholder={tr("m1249")} title={tr("m1250")} aria-label={tr("m1251")} onChange={e => {
        setText(e.target.value);
        resize();
      }} onKeyDown={e => {
        // isComposing: Vietnamese IMEs (Telex/VNI) confirm with Enter.
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
          e.preventDefault();
          submit();
        }
      }} />
        <button type="submit" className={styles.sendBtn} aria-label={tr("m1252")} disabled={!canSend}>
          <SendHorizontal size={20} />
        </button>
      </div>
    </form>;
}
