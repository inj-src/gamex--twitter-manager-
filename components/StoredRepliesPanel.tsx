import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
   getStoredReplies,
   setStoredReplies,
   deleteStoredReply,
} from "@/lib/storage";
import type { StoredReply } from "@/lib/types";
import {
   Copy,
   Trash2,
   Download,
   Upload,
   CheckCircle2,
   AlertCircle,
   MessageSquare,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function StoredRepliesPanel() {
   const [replies, setReplies] = useState<StoredReply[]>([]);
   const [importJson, setImportJson] = useState("");
   const [copySuccess, setCopySuccess] = useState(false);
   const [importError, setImportError] = useState<string | null>(null);
   const [importSuccess, setImportSuccess] = useState(false);
   const [copiedId, setCopiedId] = useState<string | null>(null);

   useEffect(() => {
      loadReplies();
   }, []);

   async function loadReplies() {
      const stored = await getStoredReplies();
      setReplies(stored);
   }

   async function handleCopyAll() {
      const json = JSON.stringify(replies, null, 2);
      await navigator.clipboard.writeText(json);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
   }

   function validateStoredReply(obj: any): obj is StoredReply {
      return (
         typeof obj === "object" &&
         obj !== null &&
         typeof obj.id === "string" &&
         typeof obj.timestamp === "number" &&
         typeof obj.originalTweet === "object" &&
         typeof obj.originalTweet?.authorHandle === "string" &&
         typeof obj.originalTweet?.text === "string" &&
         typeof obj.reply === "string" &&
         ["manual", "ai-unmodified", "ai-modified"].includes(obj.type)
      );
   }

   async function handleImport() {
      setImportError(null);
      setImportSuccess(false);

      if (!importJson.trim()) {
         setImportError("Please paste JSON data first");
         return;
      }

      try {
         const parsed = JSON.parse(importJson);

         if (!Array.isArray(parsed)) {
            setImportError("JSON must be an array of stored replies");
            return;
         }

         const invalidItems = parsed.filter((item) => !validateStoredReply(item));
         if (invalidItems.length > 0) {
            setImportError(
               `Invalid format: ${invalidItems.length} item(s) don't match the StoredReply structure`
            );
            return;
         }

         await setStoredReplies(parsed);
         await loadReplies();
         setImportJson("");
         setImportSuccess(true);
         setTimeout(() => setImportSuccess(false), 2000);
      } catch (e) {
         setImportError("Invalid JSON format. Please check your input.");
      }
   }

   async function handleCopyReply(reply: StoredReply) {
      await navigator.clipboard.writeText(reply.reply);
      setCopiedId(reply.id);
      setTimeout(() => setCopiedId(null), 2000);
   }

   async function handleDeleteReply(id: string) {
      await deleteStoredReply(id);
      await loadReplies();
   }

   function getTypeLabel(type: StoredReply["type"]) {
      switch (type) {
         case "manual":
            return "Manual";
         case "ai-unmodified":
            return "AI";
         case "ai-modified":
            return "AI (Edited)";
      }
   }

   function getTypeBadgeClass(type: StoredReply["type"]) {
      switch (type) {
         case "manual":
            return "bg-emerald-500/20 text-emerald-400";
         case "ai-unmodified":
            return "bg-blue-500/20 text-blue-400";
         case "ai-modified":
            return "bg-amber-500/20 text-amber-400";
      }
   }

   function formatDate(timestamp: number) {
      return new Date(timestamp).toLocaleDateString("en-US", {
         month: "short",
         day: "numeric",
         hour: "2-digit",
         minute: "2-digit",
      });
   }

   return (
      <div className="space-y-4">
         {/* Header */}
         <div className="space-y-3 bg-secondary/50 p-3 border border-border rounded-xl">
            <div className="flex items-center gap-2 px-1 pb-1">
               <MessageSquare className="w-4 h-4 text-muted-foreground" />
               <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                  Stored Replies ({replies.length})
               </h3>
            </div>

            <Tabs defaultValue="export" className="w-full">
               <TabsList className="grid w-full grid-cols-2 mb-2 bg-background/50">
                  <TabsTrigger value="export" className="text-xs h-7">
                     <Download className="w-3 h-3 mr-1.5" />
                     Export
                  </TabsTrigger>
                  <TabsTrigger value="import" className="text-xs h-7">
                     <Upload className="w-3 h-3 mr-1.5" />
                     Import
                  </TabsTrigger>
               </TabsList>

               <TabsContent value="export" className="space-y-2 mt-0">
                  <div className="pt-1">
                     <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs bg-background/50 hover:bg-background border-border/50 transition-colors"
                        onClick={handleCopyAll}
                        disabled={replies.length === 0}
                     >
                        {copySuccess ? (
                           <>
                              <CheckCircle2 className="mr-2 w-3.5 h-3.5 text-emerald-400" />
                              Copied!
                           </>
                        ) : (
                           <>
                              <Copy className="mr-2 w-3.5 h-3.5" />
                              Copy All as JSON
                           </>
                        )}
                     </Button>
                     <p className="text-[10px] text-muted-foreground/60 mt-2 px-1">
                        Download all stored replies as a JSON array for backup or transfer.
                     </p>
                  </div>
               </TabsContent>

               <TabsContent value="import" className="space-y-2 mt-0">
                  <div className="pt-1 space-y-2">
                     <textarea
                        className="bg-background p-2 border border-border rounded-md w-full min-h-[100px] text-xs resize-none placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                        placeholder="Paste JSON array here..."
                        value={importJson}
                        onChange={(e) => {
                           setImportJson(e.target.value);
                           setImportError(null);
                        }}
                     />
                     {importError && (
                        <div className="flex items-start gap-2 bg-destructive/10 p-2 rounded-md text-destructive text-xs">
                           <AlertCircle className="shrink-0 mt-0.5 w-3.5 h-3.5" />
                           <span>{importError}</span>
                        </div>
                     )}
                     <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs bg-background/50 hover:bg-background border-border/50 transition-colors"
                        onClick={handleImport}
                     >
                        {importSuccess ? (
                           <>
                              <CheckCircle2 className="mr-2 w-3.5 h-3.5 text-emerald-400" />
                              Imported!
                           </>
                        ) : (
                           <>
                              <Upload className="mr-2 w-3.5 h-3.5" />
                              Import from JSON
                           </>
                        )}
                     </Button>
                  </div>
               </TabsContent>
            </Tabs>
         </div>

         {/* Replies List */}
         <div className="px-1 ">
            <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
               Manage Replies
            </h3>
         </div>
         {replies.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-xs">
               No stored replies yet
            </div>
         ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
               {replies.map((reply) => (
                  <div
                     key={reply.id}
                     className="group bg-secondary/50 hover:bg-secondary/60 p-3 border border-border/50 hover:border-border rounded-lg transition-colors"
                  >
                     <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                           <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getTypeBadgeClass(
                                 reply.type
                              )}`}
                           >
                              {getTypeLabel(reply.type)}
                           </span>
                           <span className="text-[10px] text-muted-foreground truncate">
                              {reply.originalTweet.authorHandle}
                           </span>
                        </div>
                        <span className="shrink-0 text-[10px] text-muted-foreground/60">
                           {formatDate(reply.timestamp)}
                        </span>
                     </div>
                     <p className="mb-2 text-foreground/80 text-xs line-clamp-2">
                        {reply.reply}
                     </p>
                     <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                           variant="ghost"
                           size="sm"
                           className="px-2 h-6 text-[10px] cursor-pointer hover:bg-secondary"
                           onClick={() => handleCopyReply(reply)}
                        >
                           {copiedId === reply.id ? (
                              <>
                                 <CheckCircle2 className="mr-1 w-3 h-3 text-emerald-400" />
                                 Copied
                              </>
                           ) : (
                              <>
                                 <Copy className="mr-1 w-3 h-3" />
                                 Copy
                              </>
                           )}
                        </Button>
                        <Button
                           variant="ghost"
                           size="sm"
                           className="px-2 h-6 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/60 cursor-pointer"
                           onClick={() => handleDeleteReply(reply.id)}
                        >
                           <Trash2 className="mr-1 w-3 h-3" />
                           Delete
                        </Button>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
   );
}
