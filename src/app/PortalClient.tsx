// "use client"

// import { useState } from "react"
// import { CommunicationPortal } from "@/components/CommunicationPortal"
// import { ScriptEditorDialog } from "@/components/ScriptEditorDialog"

// export default function PortalClient({ user }: { user: any }) {
//     const [showScriptEditor, setShowScriptEditor] = useState(false)
//     const [scriptContent, setScriptContent] = useState("")
//     const [scriptFileName, setScriptFileName] = useState("")
//     const [scriptId, setScriptId] = useState("")

//     const handleScriptUploaded = (content: string, fileName: string) => {
//         setScriptContent(content)
//         setScriptFileName(fileName)
//         setScriptId("") // new script
//         setShowScriptEditor(true)
//     }

//     const handleScriptSaved = (content: string) => {
//         console.log("✅ Script saved successfully")
//         setScriptContent(content)
//     }

//     return (
//         <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
//             <CommunicationPortal onScriptUploaded={handleScriptUploaded} />

//             <ScriptEditorDialog
//                 open={showScriptEditor}
//                 onOpenChange={setShowScriptEditor}
//                 initialContent={scriptContent}
//                 initialFileName={scriptFileName}
//                 scriptId={scriptId}
//                 ceremonyId="default-ceremony"
//                 scriptTitle={scriptFileName}
//                 onSaved={handleScriptSaved}
//             />
//         </div>
//     )
// }
"use client"

import { useEffect, useState } from "react"
import { CommunicationPortal } from "@/components/CommunicationPortal"
import { ScriptEditorDialog } from "@/components/ScriptEditorDialog"

type PortalClientProps = {
  user: {
    id: string
    email: string
  }
}

export default function PortalClient({ user }: PortalClientProps) {
  const [mounted, setMounted] = useState(false)
  const [showScriptEditor, setShowScriptEditor] = useState(false)
  const [scriptContent, setScriptContent] = useState("")
  const [scriptFileName, setScriptFileName] = useState("")
  const [scriptId, setScriptId] = useState("")

  // ✅ Prevent hydration mismatch by rendering only after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleScriptUploaded = (content: string, fileName: string) => {
    setScriptContent(content)
    setScriptFileName(fileName)
    setScriptId("") // new script
    setShowScriptEditor(true)
  }

  const handleScriptSaved = (content: string) => {
    console.log("✅ Script saved successfully")
    setScriptContent(content)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Communication Portal */}
      <CommunicationPortal onScriptUploaded={handleScriptUploaded} />

      {/* Script Editor */}
      <ScriptEditorDialog
        open={showScriptEditor}
        onOpenChange={setShowScriptEditor}
        initialContent={scriptContent}
        initialFileName={scriptFileName}
        scriptId={scriptId}
        ceremonyId="default-ceremony"
        scriptTitle={scriptFileName}
        onSaved={handleScriptSaved}
      />
    </div>
  )
}
