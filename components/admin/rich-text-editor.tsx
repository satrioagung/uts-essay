"use client";

import { useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { AlignCenter, AlignLeft, AlignRight, Bold, ImagePlus, Italic, List, ListOrdered, Redo2, RemoveFormatting, Subscript, Superscript, Underline, Undo2 } from "lucide-react";
import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/models/dom";
import "tinymce/themes/silver";
import "tinymce/plugins/advlist";
import "tinymce/plugins/autoresize";
import "tinymce/plugins/charmap";
import "tinymce/plugins/code";
import "tinymce/plugins/fullscreen";
import "tinymce/plugins/image";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/preview";
import "tinymce/plugins/searchreplace";
import "tinymce/plugins/table";
import "tinymce/plugins/visualblocks";
import "tinymce/plugins/wordcount";
import "tinymce/skins/ui/oxide/skin.css";

export function RichTextEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const editorRef = useRef<any>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const command = (name: string, value?: string) => {
    editorRef.current?.focus();
    editorRef.current?.execCommand(name, false, value);
  };

  const insertImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        editorRef.current?.insertContent(`<img src="${reader.result}" alt="Gambar soal" />`);
      }
    };
    reader.readAsDataURL(file);
  };

  return <div className="overflow-hidden rounded-lg border border-line bg-white">
    <div className="flex flex-wrap items-center gap-1 border-b border-line bg-[#fbfbff] p-2">
      <ToolbarButton label="Urungkan" onClick={() => command("Undo")}><Undo2 size={15} /></ToolbarButton>
      <ToolbarButton label="Ulangi" onClick={() => command("Redo")}><Redo2 size={15} /></ToolbarButton>
      <span className="mx-1 h-5 w-px bg-line" />
      <select aria-label="Format teks" defaultValue="p" onChange={event => command("FormatBlock", event.target.value)} className="h-8 rounded-md border border-line bg-white px-2 text-xs font-semibold text-ink outline-none focus:border-brand">
        <option value="p">Paragraf</option>
        <option value="h2">Judul 2</option>
        <option value="h3">Judul 3</option>
        <option value="blockquote">Kutipan</option>
      </select>
      <span className="mx-1 h-5 w-px bg-line" />
      <ToolbarButton label="Tebal" onClick={() => command("Bold")}><Bold size={15} /></ToolbarButton>
      <ToolbarButton label="Miring" onClick={() => command("Italic")}><Italic size={15} /></ToolbarButton>
      <ToolbarButton label="Garis bawah" onClick={() => command("Underline")}><Underline size={15} /></ToolbarButton>
      <ToolbarButton label="Pangkat atas" onClick={() => command("Superscript")}><Superscript size={15} /></ToolbarButton>
      <ToolbarButton label="Pangkat bawah" onClick={() => command("Subscript")}><Subscript size={15} /></ToolbarButton>
      <span className="mx-1 h-5 w-px bg-line" />
      <ToolbarButton label="Daftar berpoin" onClick={() => command("InsertUnorderedList")}><List size={15} /></ToolbarButton>
      <ToolbarButton label="Daftar bernomor" onClick={() => command("InsertOrderedList")}><ListOrdered size={15} /></ToolbarButton>
      <ToolbarButton label="Rata kiri" onClick={() => command("JustifyLeft")}><AlignLeft size={15} /></ToolbarButton>
      <ToolbarButton label="Rata tengah" onClick={() => command("JustifyCenter")}><AlignCenter size={15} /></ToolbarButton>
      <ToolbarButton label="Rata kanan" onClick={() => command("JustifyRight")}><AlignRight size={15} /></ToolbarButton>
      <ToolbarButton label="Sisipkan gambar" onClick={() => imageInputRef.current?.click()}><ImagePlus size={15} /></ToolbarButton>
      <ToolbarButton label="Hapus format" onClick={() => command("RemoveFormat")}><RemoveFormatting size={15} /></ToolbarButton>
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) insertImage(file); event.currentTarget.value = ""; }} />
    </div>
    <Editor
      value={value}
      onEditorChange={onChange}
      onInit={(_, editor) => { editorRef.current = editor; }}
      licenseKey="gpl"
      init={{
        height: 280,
        menubar: false,
        branding: false,
        statusbar: true,
        promotion: false,
        toolbar: false,
        plugins: "advlist autoresize charmap code fullscreen image link lists preview searchreplace table visualblocks wordcount",
        paste_data_images: true,
        automatic_uploads: false,
        image_title: true,
        image_caption: true,
        content_style: "body { font-family: Inter, Arial, sans-serif; font-size: 15px; line-height: 1.7; padding: 12px; } img { max-width: 100%; height: auto; }",
      }}
    />
  </div>;
}

function ToolbarButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" title={label} aria-label={label} onClick={onClick} className="grid h-8 w-8 place-items-center rounded-md text-muted transition hover:bg-brand-soft hover:text-brand">{children}</button>;
}
