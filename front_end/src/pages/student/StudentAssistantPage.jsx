import { useEffect, useRef, useState } from "react";
import { Bot, FileText, MessageSquarePlus, Paperclip, Send, Sparkles, Trash2, UserRound, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Skeleton } from "../../components/ui/index.js";
import { createConversation, createConversationWithFile, deleteConversation as deleteConversationRequest, getConversation, listConversations, sendMessage } from "../../api/ai.api.js";
import { explainWeakTopic } from "../../api/student.api.js";
import { notifyError, notifySuccess } from "../../utils/toast.js";

const maxFileSize = 10 * 1024 * 1024;
const acceptedExtensions = new Set([".pdf", ".docx", ".txt"]);

function StudentAssistantPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topicId = searchParams.get("topicId");
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTopicId, setActiveTopicId] = useState("");
  const [activeTopicName, setActiveTopicName] = useState("");
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conversationLoadError, setConversationLoadError] = useState("");
  const [conversationReloadKey, setConversationReloadKey] = useState(0);
  const [loadingTopicHelp, setLoadingTopicHelp] = useState(false);
  const [sending, setSending] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState(null);
  const [attachedFileTitle, setAttachedFileTitle] = useState("");
  const scrollContainer = useRef(null);
  const lastMessage = useRef(null);
  const fileInput = useRef(null);
  const textareaRef = useRef(null);
  const weakTopicRequest = useRef(null);

  useEffect(() => {
    let mounted = true;
    listConversations()
      .then((conversationRows) => {
        if (!mounted) return;
        setConversations(conversationRows);
        if (!topicId && conversationRows[0]) setActiveConversationId(conversationRows[0].id);
      })
      .catch(() => { if (mounted) setConversations([]); })
      .finally(() => { if (mounted) setLoadingSidebar(false); });
    return () => { mounted = false; };
  }, [topicId]);

  useEffect(() => {
    if (!activeConversationId) {
      if (!topicId) setMessages([]);
      return undefined;
    }
    let mounted = true;
    setLoadingMessages(true);
    setConversationLoadError("");
    setMessages([]);
    const conversation = conversations.find((item) => String(item.id) === String(activeConversationId));
    setAttachedFileTitle(conversation?.attachment_title ?? "");
    getConversation(activeConversationId)
      .then((data) => {
        if (!mounted) return;
        setMessages(data.messages);
        setAttachedFileTitle(data.attachment_title ?? "");
      })
      .catch((error) => {
        if (!mounted) return;
        setMessages([]);
        const message = error.response?.data?.message || "Could not load this conversation. Please try again.";
        setConversationLoadError(message);
        if (!error?.config) notifyError(message);
      })
      .finally(() => { if (mounted) setLoadingMessages(false); });
    return () => { mounted = false; };
  }, [activeConversationId, conversations, conversationReloadKey, topicId]);

  useEffect(() => {
    if (!topicId || loadingSidebar || weakTopicRequest.current === topicId) return undefined;
    weakTopicRequest.current = topicId;
    let mounted = true;
    setActiveConversationId(null);
    setActiveTopicId(topicId);
    setLoadingTopicHelp(true);
    setMessages([]);
    explainWeakTopic(topicId)
      .then(async (data) => {
        if (!mounted) return;
        setActiveTopicName(data.topic_name ?? "Your topic");
        const content = data.has_data ? data.answer : data.message;
        if (data.has_data && !content) throw new Error("The assistant returned an empty answer. Please try again.");
        setMessages([{ id: `weak-topic-${topicId}`, role: "assistant", content }]);
      })
      .catch((error) => {
        if (mounted) setMessages([{ id: `weak-topic-error-${topicId}`, role: "assistant", content: error.response?.data?.message || error.message || "The assistant could not respond right now." }]);
      })
      .finally(() => { if (mounted) setLoadingTopicHelp(false); });
    return () => { mounted = false; };
  }, [topicId, loadingSidebar]);

  useEffect(() => {
    if (!scrollContainer.current) return;
    scrollContainer.current.scrollTo({ top: scrollContainer.current.scrollHeight, behavior: "smooth" });
    lastMessage.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [draft]);

  const startNewChat = () => {
    weakTopicRequest.current = null;
    setActiveConversationId(null);
    setActiveTopicId("");
    setActiveTopicName("");
    setMessages([]);
    setDraft("");
    setSelectedFile(null);
    setUploadProgress(0);
    setAttachedFileTitle("");
    setConversationLoadError("");
    navigate("/student/assistant", { replace: true });
  };

  const openConversation = (conversation) => {
    setActiveTopicId("");
    setActiveTopicName("");
    setDraft("");
    setSelectedFile(null);
    setConversationLoadError("");
    weakTopicRequest.current = null;
    setActiveConversationId(conversation.id);
    setConversationReloadKey((value) => value + 1);
    navigate("/student/assistant", { replace: true });
  };

  const removeConversation = async (conversation) => {
    setDeletingConversationId(conversation.id);
    try {
      await deleteConversationRequest(conversation.id);
      const remaining = conversations.filter((item) => String(item.id) !== String(conversation.id));
      setConversations(remaining);
      if (String(activeConversationId) === String(conversation.id)) {
        setMessages([]);
        setDraft("");
        setAttachedFileTitle("");
        setActiveConversationId(remaining[0]?.id ?? null);
      }
      notifySuccess("Conversation deleted");
    } catch {
      // The API interceptor shows the request error.
    } finally {
      setDeletingConversationId(null);
    }
  };

  const chooseFile = (file) => {
    if (!file) return;
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!acceptedExtensions.has(extension)) {
      notifyError("Choose a PDF, DOCX, or TXT file.");
      return;
    }
    if (!file.size || file.size > maxFileSize) {
      notifyError("Choose a file between 1 byte and 10 MB.");
      return;
    }
    setSelectedFile(file);
    setUploadProgress(0);
  };

  const submitMessage = async (event) => {
    event.preventDefault();
    const question = draft.trim();
    if (!question || question.length > 1000 || sending) return;

    const optimisticId = `pending-${Date.now()}`;
    const fileToUpload = selectedFile;
    setDraft("");
    setSending(true);
    setMessages((current) => [...current, { id: optimisticId, role: "user", content: question }]);
    let conversation = conversations.find((item) => String(item.id) === String(activeConversationId));
    let createdConversation = false;

    try {
      if (fileToUpload) {
        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("title", activeTopicName || question.slice(0, 120));
        if (activeTopicId || topicId) formData.append("topic_id", activeTopicId || topicId);
        conversation = await createConversationWithFile(formData, (progressEvent) => {
          if (progressEvent.total) setUploadProgress(Math.round(progressEvent.loaded * 100 / progressEvent.total));
        });
        createdConversation = true;
        setSelectedFile(null);
      } else if (!conversation) {
        conversation = await createConversation({
          title: activeTopicName || question.slice(0, 100),
          topic_id: activeTopicId || topicId || undefined,
        });
        createdConversation = true;
      }

      const response = await sendMessage(conversation.id, question);
      setMessages((current) => [...current.filter((message) => message.id !== optimisticId), ...response.messages]);
      setActiveConversationId(conversation.id);
      setConversations((current) => [conversation, ...current.filter((item) => String(item.id) !== String(conversation.id))]);
      setAttachedFileTitle(conversation.attachment_title || (fileToUpload ? fileToUpload.name : ""));
      setActiveTopicId("");
      setActiveTopicName("");
      weakTopicRequest.current = null;
      if (topicId) navigate("/student/assistant", { replace: true });
    } catch (error) {
      if (!error?.config) notifyError(error?.message || "The assistant could not answer. Please try again.");
      setMessages((current) => current.filter((message) => message.id !== optimisticId));
      setDraft(question);
      if (conversation && createdConversation) {
        setActiveConversationId(conversation.id);
        setConversations((current) => [conversation, ...current.filter((item) => String(item.id) !== String(conversation.id))]);
        setAttachedFileTitle(conversation.attachment_title || (fileToUpload ? fileToUpload.name : ""));
        setActiveTopicId("");
        setActiveTopicName("");
      }
    } finally {
      setSending(false);
      setUploadProgress(0);
    }
  };

  const activeConversation = conversations.find((item) => String(item.id) === String(activeConversationId));
  const currentAttachment = activeConversation ? attachedFileTitle : selectedFile?.name;

  return (
    <div className="grid min-h-[calc(100vh-9rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="flex max-h-64 flex-col border-b border-slate-200 bg-slate-50/80 lg:max-h-none lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4"><div><h2 className="text-sm font-bold text-slate-900">Conversations</h2><p className="mt-1 text-xs text-slate-500">Your study history</p></div><button type="button" onClick={startNewChat} disabled={sending} aria-label="New conversation" className="rounded-xl bg-indigo-600 p-2 text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"><MessageSquarePlus size={17} /></button></div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {loadingSidebar ? <div className="space-y-2 p-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : conversations.length ? conversations.map((conversation) => (
            <div key={conversation.id} className={`flex items-start gap-1 rounded-xl transition ${String(activeConversationId) === String(conversation.id) ? "bg-indigo-100" : "hover:bg-white"}`}>
              <button type="button" disabled={sending || Boolean(deletingConversationId)} onClick={() => openConversation(conversation)} className={`min-w-0 flex-1 rounded-xl px-3 py-3 text-left disabled:cursor-not-allowed disabled:opacity-50 ${String(activeConversationId) === String(conversation.id) ? "text-indigo-900" : "text-slate-600 hover:text-slate-900"}`}>
                <span className="block truncate text-sm font-semibold">{conversation.title}</span>
                <span className="mt-1 block text-[11px] text-slate-500">{new Date(conversation.created_at).toLocaleDateString()}</span>
                {conversation.attachment_title && <span className="mt-1 flex items-center gap-1 truncate text-[11px] text-indigo-600"><Paperclip size={11} />{conversation.attachment_title}</span>}
              </button>
              <button type="button" onClick={() => removeConversation(conversation)} disabled={sending || Boolean(deletingConversationId)} aria-label={`Delete conversation ${conversation.title}`} title="Delete conversation" className="m-1 rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50">
                {String(deletingConversationId) === String(conversation.id) ? <span className="block size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-label="Deleting conversation" /> : <Trash2 size={16} />}
              </button>
            </div>
          )) : <div className="px-2 py-4 text-center text-xs leading-5 text-slate-500">No conversations yet. Start a chat or attach a file.</div>}
        </div>
        <div className="hidden border-t border-slate-200 p-4 text-xs leading-5 text-slate-500 lg:block">Study questions are limited to 30 per day.</div>
      </aside>

      <section className="flex min-h-[620px] min-w-0 flex-col">
        <header className="flex min-h-[66px] items-center justify-between gap-3 border-b border-slate-100 px-4 sm:px-6"><div className="flex min-w-0 items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Bot size={19} /></span><div className="min-w-0"><h1 className="truncate text-sm font-bold text-slate-900">{activeConversation?.title || (activeTopicName ? `Help with ${activeTopicName}` : "Study assistant")}</h1><p className="truncate text-xs text-slate-500">{currentAttachment ? `Using ${currentAttachment}` : activeTopicName ? "Personalized from your recent answers" : "Ask questions about your uploaded file"}</p></div></div>{currentAttachment && !selectedFile && <span className="hidden max-w-48 items-center gap-1.5 truncate rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 sm:inline-flex"><Paperclip size={13} /> {currentAttachment}</span>}</header>

        <div ref={scrollContainer} className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6">
          {conversationLoadError && !loadingMessages ? <div className="mx-auto flex min-h-[360px] max-w-xl flex-col items-center justify-center text-center"><p className="text-sm text-rose-600">{conversationLoadError}</p><button type="button" onClick={() => setConversationReloadKey((value) => value + 1)} className="mt-3 rounded-lg px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Retry loading</button></div> : loadingMessages || loadingTopicHelp ? <div className="space-y-3"><Skeleton className="h-16 w-3/4" /><Skeleton className="ml-auto h-12 w-2/3" /><Skeleton className="h-24 w-4/5" /></div> : messages.length === 0 ? (
            <div className="mx-auto flex min-h-[360px] max-w-xl flex-col items-center justify-center text-center"><span className="flex size-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Sparkles size={22} /></span><h2 className="mt-4 text-lg font-bold text-slate-900">What are you studying today?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Attach a PDF, DOCX, or text file, then ask a question about its contents.</p><div className="mt-6 flex flex-wrap justify-center gap-2">{["Summarize this file", "Explain the key concepts", "Give me examples"].map((prompt) => <button key={prompt} type="button" onClick={() => setDraft(prompt)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">{prompt}</button>)}</div></div>
          ) : messages.map((message, index) => <ChatBubble key={message.id ?? `${message.role}-${index}`} message={message} last={index === messages.length - 1} lastRef={lastMessage} />)}
          {sending && <div className="flex items-start gap-2"><span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Bot size={16} /></span><div className="rounded-xl rounded-tl-sm bg-slate-100 px-4 py-3"><span className="typing-dots" aria-label="Assistant is typing"><i /><i /><i /></span></div></div>}
        </div>

        <form onSubmit={submitMessage} className="border-t border-slate-100 bg-white p-3 sm:p-5">
          <input ref={fileInput} type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" className="sr-only" onChange={(event) => { chooseFile(event.target.files?.[0]); event.target.value = ""; }} aria-label="Choose a file to attach" />
          {sending && selectedFile && <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-indigo-600 transition-[width]" style={{ width: `${uploadProgress}%` }} /></div>}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm transition focus-within:border-indigo-400">
            {selectedFile && <div className="mx-3 mt-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-2 text-xs font-medium text-indigo-800"><FileText size={15} className="shrink-0" /><span className="max-w-64 truncate">{selectedFile.name}</span><span className="shrink-0 text-indigo-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span><button type="button" onClick={() => { setSelectedFile(null); setUploadProgress(0); }} disabled={sending} className="rounded-md p-0.5 text-indigo-700 hover:bg-indigo-100" aria-label="Remove attached file"><X size={14} /></button></div>}
            <textarea ref={textareaRef} rows={1} maxLength={1000} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={selectedFile ? "Ask a question about this file..." : "Ask a study question or attach a file..."} disabled={sending} className="block min-h-11 max-h-40 w-full min-w-0 resize-none overflow-y-auto rounded-t-xl border-0 bg-transparent px-4 py-3 text-sm leading-5 text-slate-800 outline-none placeholder:text-slate-400 focus:outline-none focus-visible:outline-none focus-visible:ring-0 disabled:opacity-60" aria-label="Your message" />
            <div className="flex items-center justify-between px-3 pb-3 pt-1"><div className="flex items-center gap-2"><button type="button" onClick={() => fileInput.current?.click()} disabled={sending} aria-label="Attach a file" title="Attach a PDF, DOCX, or TXT file (max 10 MB)" className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-indigo-700 disabled:opacity-50"><Paperclip size={17} /></button><span className={`text-xs tabular-nums ${draft.length > 950 ? "text-amber-600" : "text-slate-400"}`}>{draft.length}/1000</span></div><Button type="submit" className="min-h-9 px-3 text-xs" disabled={sending || !draft.trim() || draft.length > 1000} loading={sending}><Send size={14} /> Send</Button></div>
          </div>
          <p className="mt-2 text-center text-[11px] text-slate-400">PDF, DOCX, or TXT - max 10 MB</p>
        </form>
      </section>
    </div>
  );
}

function ChatBubble({ message, last, lastRef }) {
  const fromUser = message.role === "user";
  return <div ref={last ? lastRef : undefined} className={`flex items-start gap-2.5 ${fromUser ? "justify-end" : "justify-start"}`}><span className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${fromUser ? "order-2 bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>{fromUser ? <UserRound size={16} /> : <Bot size={16} />}</span><div className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-3 text-sm leading-6 ${fromUser ? "order-1 rounded-tr-sm bg-indigo-600 text-white" : "rounded-tl-sm bg-slate-100 text-slate-700"}`}>{message.content}</div></div>;
}

export default StudentAssistantPage;
