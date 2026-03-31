"use client";

import { useState, useRef, useEffect } from "react";
import mammoth from "mammoth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  X,
  Upload,
  Download,
  FileText,
  Save,
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  Minus,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/supabase/utils/client";
interface ScriptEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialContent?: string;
  initialFileName?: string;
  scriptId?: string;
  ceremonyId?: string;
  scriptTitle?: string;
  onSaved?: (content: string) => void;
}

export function ScriptEditorDialog({
  open,
  onOpenChange,
  initialContent,
  initialFileName,
  scriptId,
  ceremonyId,
  scriptTitle,
  onSaved,
}: ScriptEditorDialogProps) {
  const [scriptContent, setScriptContent] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Find & Replace state
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  // Formatting state
  const [fontSize, setFontSize] = useState("16");
  const [textColor, setTextColor] = useState("#000000");

  const editorRef = useRef<HTMLDivElement>(null);
  console.log("Editor Ref:", editorRef);
 
  useEffect(() => {
    if (!open) return;

    let retries = 0;
    const maxRetries = 10;

    const tryInitializeEditor = () => {
      const editorElement = editorRef.current;

      if (!editorElement) {
        if (retries < maxRetries) {
          retries++;
          console.warn(`Editor not yet mounted (attempt ${retries})`);
          setTimeout(tryInitializeEditor, 100); // retry after 100 ms
        } else {
          console.error("Editor element not found after multiple retries");
        }
        return;
      }

      // ✅ At this point the editor exists
      if (initialContent) {
        setScriptContent(initialContent);
        const isHtml = /<[^>]+>/.test(initialContent);
        if (isHtml) {
          editorElement.innerHTML = initialContent;
        } else {
          editorElement.innerText = initialContent;
        }

        if (initialFileName) {
          setUploadedFileName(initialFileName);
        }
      } else if (editorElement.innerText === "") {
        editorElement.innerText = "Start typing your ceremony script here...";
      }
    };

    // Start trying
    tryInitializeEditor();

    // Cleanup if dialog closes
    return () => {
      retries = maxRetries;
    };
  }, [open, initialContent, initialFileName]);

  // Helper function to escape regex special characters
  const escapeRegex = (str: string) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) console.error("Failed to fetch user:", error);
      else setUser(user);
      console.log("Fetched user:", user);
    };
    fetchUser();
  }, []);
  // Formatting functions
  const applyFormat = (command: string, value?: string) => {
    const editorElement = editorRef.current;
    if (!editorElement) return;

    // Focus the editor first
    editorElement.focus();

    try {
      // Execute the formatting command
      document.execCommand(command, false, value);

      // Update the content state
      if (editorElement.innerHTML) {
        setScriptContent(editorElement.innerHTML);
      }
    } catch (error) {
      console.error("Error applying format:", error);
    }
  };

  const handleBold = () => {
    applyFormat("bold");
  };

  const handleItalic = () => {
    applyFormat("italic");
  };

  const handleUnderline = () => {
    applyFormat("underline");
  };

  const handleFontSize = (size: string) => {
    setFontSize(size);
    const editorElement = editorRef.current;
    if (!editorElement) return;

    editorElement.focus();

    // Get the current selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      if (!range.collapsed) {
        // Wrap selected text in a span with font size
        const span = document.createElement("span");
        span.style.fontSize = `${size}px`;

        try {
          range.surroundContents(span);
          setScriptContent(editorElement.innerHTML);
        } catch (error) {
          // If surroundContents fails, use execCommand as fallback
          document.execCommand("fontSize", false, "7");
          const fontElements = editorElement.querySelectorAll('font[size="7"]');
          fontElements.forEach((el) => {
            const span = document.createElement("span");
            span.style.fontSize = `${size}px`;
            span.innerHTML = el.innerHTML;
            el.parentNode?.replaceChild(span, el);
          });
          setScriptContent(editorElement.innerHTML);
        }
      }
    }
  };

  const handleTextColor = (color: string) => {
    setTextColor(color);
    applyFormat("foreColor", color);
  };

  const handleInsertPageBreak = () => {
    const editorElement = editorRef.current;
    if (!editorElement) return;

    editorElement.focus();

    // Insert a horizontal rule as a page break
    const hr = document.createElement("hr");
    hr.style.borderTop = "2px dashed #ccc";
    hr.style.margin = "20px 0";

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.insertNode(hr);

      // Move cursor after the hr
      range.setStartAfter(hr);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);

      setScriptContent(editorElement.innerHTML);
    }
  };

  const handleInsertLink = () => {
    const editorElement = editorRef.current;
    if (!editorElement) return;

    const url = prompt("Enter the URL:");
    if (!url) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      applyFormat("createLink", url);
    } else {
      // If no text is selected, prompt for link text
      const linkText = prompt("Enter the link text:");
      if (!linkText) return;

      editorElement.focus();
      const a = document.createElement("a");
      a.href = url;
      a.textContent = linkText;
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      const range = selection?.getRangeAt(0);
      if (range) {
        range.insertNode(a);
        range.setStartAfter(a);
        range.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }

      setScriptContent(editorElement.innerHTML);
    }
  };

  // Find function
  const handleFind = () => {
    if (!findText) return;

    const editorElement = editorRef.current;
    if (!editorElement) return;

    const content = editorElement.innerText || editorElement.textContent || "";
    const flags = caseSensitive ? "g" : "gi";
    const regex = new RegExp(escapeRegex(findText), flags);
    const matches = content.match(regex);
    setTotalMatches(matches ? matches.length : 0);

    if (matches && matches.length > 0) {
      setCurrentMatchIndex(1);
      highlightMatches();
    } else {
      alert("No matches found");
    }
  };

  // Highlight all matches
  const highlightMatches = () => {
    if (!findText) return;

    const editorElement = editorRef.current;
    if (!editorElement) return;

    // Get the plain text content
    const textContent = editorElement.innerText || "";

    // Remove existing highlights by getting clean text
    editorElement.innerText = textContent;

    // Now add highlights
    let html = editorElement.innerHTML;
    const flags = caseSensitive ? "g" : "gi";
    const escapedFind = escapeRegex(findText);
    const regex = new RegExp("(" + escapedFind + ")", flags);
    html = html.replace(
      regex,
      '<span class="find-highlight" style="background-color: yellow; font-weight: bold;">$1</span>'
    );
    editorElement.innerHTML = html;

    // Update the state with clean text
    setScriptContent(textContent);
  };

  // Replace one occurrence
  const handleReplaceOne = () => {
    if (!findText) return;

    const editorElement = editorRef.current;
    if (!editorElement) return;

    // Get clean text without HTML
    let text = editorElement.innerText || "";
    const flags = caseSensitive ? "" : "i";
    const regex = new RegExp(escapeRegex(findText), flags);

    // Replace first occurrence
    text = text.replace(regex, replaceText);
    editorElement.innerText = text;
    setScriptContent(text);

    // Re-run find to highlight remaining matches
    setTimeout(() => handleFind(), 100);
  };

  // Replace all occurrences
  const handleReplaceAll = () => {
    if (!findText) return;

    const editorElement = editorRef.current;
    if (!editorElement) return;

    // Get clean text without HTML
    let text = editorElement.innerText || "";
    const flags = caseSensitive ? "g" : "gi";
    const regex = new RegExp(escapeRegex(findText), flags);

    // Count matches before replacing
    const matches = text.match(regex);
    const matchCount = matches ? matches.length : 0;

    // Replace all occurrences
    text = text.replace(regex, replaceText);
    editorElement.innerText = text;
    setScriptContent(text);
    setTotalMatches(0);
    setCurrentMatchIndex(0);

    if (matchCount > 0) {
      alert(
        `Replaced ${matchCount} occurrence${
          matchCount > 1 ? "s" : ""
        } of "${findText}" with "${replaceText}"`
      );
    } else {
      alert(`No matches found for "${findText}"`);
    }
  };

  // Clear find/replace
  const handleClear = () => {
    setFindText("");
    setReplaceText("");
    setCurrentMatchIndex(0);
    setTotalMatches(0);

    const editorElement = editorRef.current;
    if (editorElement) {
      // Remove highlights by resetting to plain text
      const text = editorElement.innerText || "";
      editorElement.innerText = text;
    }
  };

  
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      let content = "";

      if (file.name.endsWith(".docx")) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value.trim();
      } else if (file.name.endsWith(".txt")) {
        content = (await file.text()).trim();
      } else {
        alert("⚠️ Please upload a .txt or .docx file only.");
        event.target.value = "";
        return;
      }

      // ✅ Update state and editor content
      setUploadedFileName(file.name);
      setScriptContent(content);

      if (editorRef.current) editorRef.current.innerText = content;

      // Allow reupload of same file
      event.target.value = "";
    } catch (error) {
      console.error("❌ Error reading file:", error);
      alert("Error reading file. Please try again.");
      event.target.value = "";
    }
  };
  // Handle editor input
  const handleEditorInput = () => {
    if (editorRef.current) {
      // Capture HTML content to preserve formatting
      const htmlContent = editorRef.current.innerHTML || "";
      setScriptContent(htmlContent);
    }
  };

  // Download script
  const handleDownload = () => {
    // Get plain text from HTML content
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = scriptContent;
    const plainText = tempDiv.innerText || tempDiv.textContent || scriptContent;

    const blob = new Blob([plainText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = uploadedFileName || "ceremony-script.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    if (!scriptContent.trim()) {
      alert("Cannot save empty script");
      return;
    }

    setIsSaving(true);
    try {
      if (!user?.id) throw new Error("User not authenticated");

      // 1️⃣ Save HTML file to Supabase Storage
      const fileName = `script_${Date.now()}.html`;
      const filePath = `${user.id}/${fileName}`;
      const fileBlob = new Blob([scriptContent], { type: "text/html" });

      const { error: uploadError } = await supabase.storage
        .from("user-documents")
        .upload(filePath, fileBlob, { upsert: true });

      if (uploadError)
        throw new Error("Storage upload failed: " + uploadError.message);

      // 2️⃣ Get public URL from the correct bucket
      const { data: urlData } = supabase.storage
        .from("user-documents")
        .getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // 3️⃣ Prepare file metadata for DB
      const fileSize = fileBlob.size; // in bytes
      const fileType = fileBlob.type || "text/html";

      // 4️⃣ Insert metadata into Supabase
      const { data, error } = await supabase
        .from("user_files")
        .insert({
          user_id: user.id,
          name: scriptTitle || uploadedFileName || "Untitled Script",
          type: fileType,
          size: fileSize,
          url: publicUrl,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw new Error("DB insert failed: " + error.message);

      alert("✅ Script saved successfully!");
      console.log("Saved script:", data);
      setIsSaving(false);
      onOpenChange(false);
    } catch (err) {
      console.error("❌ Error saving script:", err);
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <FileText className="w-6 h-6 mr-2 text-blue-600" />
            Script Editor with Find & Replace
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Formatting Toolbar */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-3">
              <div className="flex items-center flex-wrap gap-2">
                {/* Text Formatting */}
                <div className="flex items-center space-x-1 border-r pr-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBold}
                    title="Bold"
                    className="h-8 w-8 p-0 hover:bg-blue-100"
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleItalic}
                    title="Italic"
                    className="h-8 w-8 p-0 hover:bg-blue-100"
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleUnderline}
                    title="Underline"
                    className="h-8 w-8 p-0 hover:bg-blue-100"
                  >
                    <Underline className="w-4 h-4" />
                  </Button>
                </div>

                {/* Font Size */}
                <div className="flex items-center space-x-2 border-r pr-2">
                  <Label className="text-xs text-gray-600">Size:</Label>
                  <Select value={fontSize} onValueChange={handleFontSize}>
                    <SelectTrigger className="h-8 w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12</SelectItem>
                      <SelectItem value="14">14</SelectItem>
                      <SelectItem value="16">16</SelectItem>
                      <SelectItem value="18">18</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Text Color */}
                <div className="flex items-center space-x-2 border-r pr-2">
                  <Label className="text-xs text-gray-600">Color:</Label>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleTextColor("#000000")}
                      className="w-6 h-6 rounded border-2 border-gray-300 hover:border-blue-500"
                      style={{ backgroundColor: "#000000" }}
                      title="Black"
                    />
                    <button
                      onClick={() => handleTextColor("#FF0000")}
                      className="w-6 h-6 rounded border-2 border-gray-300 hover:border-blue-500"
                      style={{ backgroundColor: "#FF0000" }}
                      title="Red"
                    />
                    <button
                      onClick={() => handleTextColor("#0000FF")}
                      className="w-6 h-6 rounded border-2 border-gray-300 hover:border-blue-500"
                      style={{ backgroundColor: "#0000FF" }}
                      title="Blue"
                    />
                    <button
                      onClick={() => handleTextColor("#008000")}
                      className="w-6 h-6 rounded border-2 border-gray-300 hover:border-blue-500"
                      style={{ backgroundColor: "#008000" }}
                      title="Green"
                    />
                    <button
                      onClick={() => handleTextColor("#800080")}
                      className="w-6 h-6 rounded border-2 border-gray-300 hover:border-blue-500"
                      style={{ backgroundColor: "#800080" }}
                      title="Purple"
                    />
                  </div>
                </div>

                {/* Insert Options */}
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleInsertPageBreak}
                    title="Insert Page Break"
                    className="h-8 px-3 hover:bg-blue-100"
                  >
                    <Minus className="w-4 h-4 mr-1" />
                    <span className="text-xs">Break</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleInsertLink}
                    title="Insert Link"
                    className="h-8 px-3 hover:bg-blue-100"
                  >
                    <LinkIcon className="w-4 h-4 mr-1" />
                    <span className="text-xs">Link</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Find & Replace Toolbar */}
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-3">
              <div className="flex items-center flex-wrap gap-2">
                {/* Find Input */}
                <Input
                  id="findText"
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  placeholder="Find..."
                  className="h-8 w-32"
                />

                {/* Replace Input */}
                <Input
                  id="replaceText"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder="Replace..."
                  className="h-8 w-32"
                />

                {/* Case Sensitive Checkbox */}
                <div className="flex items-center space-x-1 border-r pr-2">
                  <Checkbox
                    id="caseSensitive"
                    checked={caseSensitive}
                    onCheckedChange={(checked) =>
                      setCaseSensitive(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="caseSensitive"
                    className="text-xs cursor-pointer"
                  >
                    Case
                  </Label>
                </div>

                {/* Action Buttons */}
                <Button
                  onClick={handleFind}
                  size="sm"
                  variant="outline"
                  className="h-8 border-purple-300"
                >
                  <Search className="w-3 h-3 mr-1" />
                  <span className="text-xs">Find</span>
                </Button>
                <Button
                  onClick={handleReplaceOne}
                  size="sm"
                  variant="outline"
                  className="h-8 border-purple-300"
                >
                  <span className="text-xs">Replace</span>
                </Button>
                <Button
                  onClick={handleReplaceAll}
                  size="sm"
                  variant="outline"
                  className="h-8 border-purple-300"
                >
                  <span className="text-xs">All</span>
                </Button>
                <Button
                  onClick={handleClear}
                  size="sm"
                  variant="outline"
                  className="h-8"
                >
                  <X className="w-3 h-3" />
                </Button>

                {/* Match Counter */}
                {totalMatches > 0 && (
                  <Badge className="bg-purple-100 text-purple-800 ml-auto">
                    {currentMatchIndex}/{totalMatches}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* File Upload Section */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-900 text-lg">
                Upload Script
              </CardTitle>
              <CardDescription>
                Upload an existing .txt or .docx file to edit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  id="script-upload"
                  accept=".txt,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="script-upload">
                  <Button variant="outline" asChild className="cursor-pointer">
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </span>
                  </Button>
                </label>
                {uploadedFileName && (
                  <Badge className="bg-green-600 text-white">
                    <FileText className="w-3 h-3 mr-1" />
                    {uploadedFileName}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Script Editor */}
          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-900 text-lg">
                Script Content
              </CardTitle>
              <CardDescription>
                Type or paste your ceremony script here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                className="min-h-[300px] max-h-[400px] overflow-y-auto p-4 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                style={{ whiteSpace: "pre-wrap" }}
                suppressContentEditableWarning
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Script"}
            </Button>
            <Button
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
