// src/pages/Forum/index.jsx
// Student Forum + Teacher Forum — course-scoped discussion boards
import { useState, useEffect, useRef } from "react";
import { T } from "../../assets/styles/theme";
import {
  Btn, Card, Badge, Avatar, Input, Select,
  PageHeader, Modal, Tabs,
} from "../../components/UI";
import {
  getStudentForumCourses, getStudentForumPosts,
  createStudentForumPost, replyStudentForumPost, deleteStudentForumPost,
  getTeacherForumCourses, getTeacherForumPosts, getTeacherForumMembers,
  createTeacherForumPost, replyTeacherForumPost,
  deleteTeacherForumPost, deleteTeacherForumReply,
} from "../../api/auth";

// ── Time helper ───────────────────────────────────────────────────────────────
const timeAgo = (dt) => {
  if (!dt) return "";
  const diff = Math.floor((Date.now() - new Date(dt)) / 1000);
  if (diff < 60)      return "just now";
  if (diff < 3600)    return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)   return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const typeColor  = { QUESTION: T.accentY, DISCUSSION: T.accent, ANNOUNCEMENT: T.accentR };
const typeIcon   = { QUESTION: "❓", DISCUSSION: "💬", ANNOUNCEMENT: "📢" };

// ─── STUDENT FORUM ────────────────────────────────────────────────────────────
export const StudentForum = () => {
  const [courses, setCourses]     = useState([]);
  const [selected, setSelected]   = useState(null);    // selected course obj
  const [posts, setPosts]         = useState([]);
  const [openPost, setOpenPost]   = useState(null);    // post being read
  const [loading, setLoading]     = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newModal, setNewModal]   = useState(false);
  const [replyBox, setReplyBox]   = useState(null);    // postId being replied to
  const [replyText, setReplyText] = useState("");
  const [form, setForm]           = useState({ title: "", content: "", type: "QUESTION" });
  const [saving, setSaving]       = useState(false);
  const [tab, setTab]             = useState("All");
  const bottomRef                 = useRef(null);

  // Load courses on mount
  useEffect(() => {
    getStudentForumCourses()
      .then(d => { const c = Array.isArray(d) ? d : []; setCourses(c); if (c.length > 0) setSelected(c[0]); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  // Load posts when course changes
  useEffect(() => {
    if (!selected) return;
    setPostsLoading(true);
    getStudentForumPosts(selected.courseId)
      .then(d => setPosts(Array.isArray(d) ? d : []))
      .catch(console.error).finally(() => setPostsLoading(false));
  }, [selected]);

  const filteredPosts = tab === "All" ? posts
    : posts.filter(p => p.type === tab.toUpperCase());

  const handleNewPost = async () => {
    if (!form.title.trim() || !form.content.trim()) { alert("Title and content required."); return; }
    try {
      setSaving(true);
      const created = await createStudentForumPost(selected.courseId, form);
      setPosts(p => [created, ...p]);
      setNewModal(false);
      setForm({ title: "", content: "", type: "QUESTION" });
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const handleReply = async (postId) => {
    if (!replyText.trim()) { alert("Write a reply first."); return; }
    try {
      setSaving(true);
      const reply = await replyStudentForumPost(postId, { content: replyText });
      // Update the post in list
      setPosts(p => p.map(x => x.id === postId
        ? { ...x, replies: [...(x.replies || []), reply] } : x));
      if (openPost?.id === postId) setOpenPost(prev => ({ ...prev, replies: [...(prev.replies || []), reply] }));
      setReplyBox(null); setReplyText("");
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    await deleteStudentForumPost(postId).catch(e => { alert(e.message); return; });
    setPosts(p => p.filter(x => x.id !== postId));
    if (openPost?.id === postId) setOpenPost(null);
  };

  if (loading) return <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading forums…</div>;

  if (courses.length === 0) return (
    <div className="fade-up">
      <PageHeader title="Course Forums" />
      <Card><div style={{ padding: 32, textAlign: "center", color: T.muted }}>
        No courses enrolled yet. Forums appear when you're added to a batch with a course.
      </div></Card>
    </div>
  );

  return (
    <div className="fade-up">
      <PageHeader title="Course Forums"
        subtitle="Discuss, ask questions, and collaborate with classmates and teachers"
        actions={selected && [<Btn variant="primary" onClick={() => setNewModal(true)}>✍ New Post</Btn>]} />

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, minHeight: 600 }}>
        {/* ── Left: Course list ─── */}
        <div>
          {courses.map(c => (
            <div key={c.courseId} onClick={() => { setSelected(c); setOpenPost(null); }}
              style={{
                padding: "14px 16px", borderRadius: 12, cursor: "pointer", marginBottom: 8,
                background: selected?.courseId === c.courseId ? `${T.primary}18` : T.bg3,
                border: `1.5px solid ${selected?.courseId === c.courseId ? T.primary : T.border}`,
                transition: "all .2s",
              }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{c.courseTitle}</div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>
                👨‍🏫 {c.teacherName} · 🏢 {c.department || "—"}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 10, background: `${T.accent}18`, color: T.accent, borderRadius: 50, padding: "2px 8px", fontWeight: 700 }}>
                  👥 {c.memberCount} members
                </span>
                <span style={{ fontSize: 10, background: `${T.primaryL}18`, color: T.primaryL, borderRadius: 50, padding: "2px 8px", fontWeight: 700 }}>
                  💬 {c.postCount} posts
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Right: Posts or Post Detail ─── */}
        <div>
          {!openPost ? (
            // Post list view
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, background: T.bg3 }}>
                <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 16 }}>{selected?.courseTitle}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                  👥 {selected?.memberCount} members · 💬 {selected?.postCount} posts
                </div>
              </div>
              <div style={{ padding: "12px 20px 0" }}>
                <Tabs tabs={["All", "Question", "Discussion", "Announcement"]} active={tab} onChange={setTab} />
              </div>
              <div style={{ padding: "0 20px 20px" }}>
                {postsLoading ? (
                  <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading posts…</div>
                ) : filteredPosts.length === 0 ? (
                  <div style={{ padding: 32, textAlign: "center", color: T.muted }}>
                    No {tab === "All" ? "" : tab.toLowerCase()} posts yet.
                    <div style={{ marginTop: 12 }}>
                      <Btn variant="primary" size="sm" onClick={() => setNewModal(true)}>✍ Be the first to post</Btn>
                    </div>
                  </div>
                ) : filteredPosts.map(p => (
                  <div key={p.id} style={{ padding: "16px 0", borderBottom: `1px solid rgba(45,33,96,.3)`, cursor: "pointer" }}
                    onClick={() => setOpenPost(p)}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <Avatar name={p.authorName || "U"} size={38}
                        color={p.authorRole === "TEACHER" ? T.accentG : T.accent} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 10, background: `${typeColor[p.type]}18`, color: typeColor[p.type], borderRadius: 50, padding: "2px 8px", fontWeight: 700 }}>
                            {typeIcon[p.type]} {p.type}
                          </span>
                          {p.authorRole === "TEACHER" && (
                            <span style={{ fontSize: 10, background: `${T.accentG}18`, color: T.accentG, borderRadius: 50, padding: "2px 8px", fontWeight: 700 }}>✓ Teacher</span>
                          )}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{p.title}</div>
                        <div style={{ fontSize: 13, color: T.muted, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.content}</div>
                        <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: T.muted }}>
                          <span>By {p.authorName}</span>
                          <span>💬 {p.replies?.length || 0} replies</span>
                          <span>🕐 {timeAgo(p.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            // Post detail view
            <Card style={{ padding: 0, overflow: "hidden" }}>
              {/* Back header */}
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, background: T.bg3, display: "flex", gap: 12, alignItems: "center" }}>
                <Btn size="xs" variant="ghost" onClick={() => setOpenPost(null)}>← Back</Btn>
                <div style={{ flex: 1, fontFamily: "Syne", fontWeight: 700 }}>{openPost.title}</div>
                {openPost.postedByStudent && (
                  <Btn size="xs" variant="danger" onClick={() => handleDelete(openPost.id)}>🗑 Delete</Btn>
                )}
              </div>

              <div style={{ padding: 20 }}>
                {/* Original post */}
                <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
                  <Avatar name={openPost.authorName || "U"} size={44}
                    color={openPost.authorRole === "TEACHER" ? T.accentG : T.accent} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{openPost.authorName}</span>
                      {openPost.authorRole === "TEACHER" && (
                        <Badge type="success">✓ Teacher</Badge>
                      )}
                      <span style={{ fontSize: 11, color: T.muted }}>{timeAgo(openPost.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.7, color: T.text, whiteSpace: "pre-wrap" }}>{openPost.content}</div>
                  </div>
                </div>

                {/* Replies */}
                {openPost.replies?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
                      {openPost.replies.length} {openPost.replies.length === 1 ? "Reply" : "Replies"}
                    </div>
                    {openPost.replies.map(r => (
                      <div key={r.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderTop: `1px solid rgba(45,33,96,.3)` }}>
                        <Avatar name={r.authorName || "U"} size={34}
                          color={r.authorRole === "TEACHER" ? T.accentG : T.primaryL} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: 13 }}>{r.authorName}</span>
                            {r.authorRole === "TEACHER" && <Badge type="success">✓ Teacher</Badge>}
                            <span style={{ fontSize: 11, color: T.muted }}>{timeAgo(r.createdAt)}</span>
                          </div>
                          <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{r.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply input */}
                <div style={{ borderTop: `1px solid rgba(45,33,96,.4)`, paddingTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Write a Reply</div>
                  <textarea rows={3} value={replyText} onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your reply…"
                    style={{ width: "100%", background: T.bg3, border: `1.5px solid ${T.border}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text, outline: "none", resize: "vertical", fontFamily: "DM Sans", marginBottom: 10 }}
                    onFocus={e => e.target.style.borderColor = T.primary}
                    onBlur={e => e.target.style.borderColor = T.border}
                  />
                  <Btn variant="primary" onClick={() => handleReply(openPost.id)} disabled={saving}>
                    {saving ? "Posting…" : "Post Reply →"}
                  </Btn>
                </div>
              </div>
              <div ref={bottomRef} />
            </Card>
          )}
        </div>
      </div>

      {/* New Post Modal */}
      <Modal open={newModal} onClose={() => setNewModal(false)} title={`New Post — ${selected?.courseTitle}`}>
        <p style={{ fontSize: 13, color: T.muted, marginBottom: 14 }}>
          Your post will be visible to all {selected?.memberCount} members of this course.
        </p>
        <Select label="Post Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
          options={[{ value: "QUESTION", label: "❓ Question" }, { value: "DISCUSSION", label: "💬 Discussion" }]} />
        <Input label="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="What's your question or topic?" />
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Content *</label>
          <textarea rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Describe your question or start a discussion…"
            style={{ width: "100%", background: T.bg3, border: `1.5px solid ${T.border}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text, outline: "none", resize: "vertical", fontFamily: "DM Sans" }}
            onFocus={e => e.target.style.borderColor = T.primary}
            onBlur={e => e.target.style.borderColor = T.border}
          />
        </div>
        <Btn variant="primary" full size="lg" onClick={handleNewPost} disabled={saving}>
          {saving ? "Posting…" : "Post to Forum →"}
        </Btn>
      </Modal>
    </div>
  );
};

// ─── TEACHER FORUM ────────────────────────────────────────────────────────────
export const TeacherForum = () => {
  const [courses, setCourses]       = useState([]);
  const [selected, setSelected]     = useState(null);
  const [posts, setPosts]           = useState([]);
  const [openPost, setOpenPost]     = useState(null);
  const [members, setMembers]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newModal, setNewModal]     = useState(false);
  const [membersModal, setMembersModal] = useState(false);
  const [replyText, setReplyText]   = useState("");
  const [form, setForm]             = useState({ title: "", content: "", type: "DISCUSSION" });
  const [saving, setSaving]         = useState(false);
  const [tab, setTab]               = useState("All");

  useEffect(() => {
    getTeacherForumCourses()
      .then(d => { const c = Array.isArray(d) ? d : []; setCourses(c); if (c.length > 0) setSelected(c[0]); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setPostsLoading(true);
    getTeacherForumPosts(selected.courseId)
      .then(d => setPosts(Array.isArray(d) ? d : []))
      .catch(console.error).finally(() => setPostsLoading(false));
  }, [selected]);

  const filteredPosts = tab === "All" ? posts
    : posts.filter(p => p.type === tab.toUpperCase());

  const handleNewPost = async () => {
    if (!form.title.trim() || !form.content.trim()) { alert("Title and content required."); return; }
    try {
      setSaving(true);
      const created = await createTeacherForumPost(selected.courseId, form);
      setPosts(p => [created, ...p]);
      setNewModal(false);
      setForm({ title: "", content: "", type: "DISCUSSION" });
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const handleReply = async (postId) => {
    if (!replyText.trim()) { alert("Write a reply first."); return; }
    try {
      setSaving(true);
      const reply = await replyTeacherForumPost(postId, { content: replyText });
      setPosts(p => p.map(x => x.id === postId ? { ...x, replies: [...(x.replies || []), reply] } : x));
      if (openPost?.id === postId) setOpenPost(prev => ({ ...prev, replies: [...(prev.replies || []), reply] }));
      setReplyText("");
    } catch (err) { alert("Error: " + err.message); }
    finally { setSaving(false); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post and all its replies?")) return;
    await deleteTeacherForumPost(postId).catch(e => { alert(e.message); return; });
    setPosts(p => p.filter(x => x.id !== postId));
    if (openPost?.id === postId) setOpenPost(null);
  };

  const handleDeleteReply = async (replyId, postId) => {
    if (!window.confirm("Delete this reply?")) return;
    await deleteTeacherForumReply(replyId).catch(e => { alert(e.message); return; });
    setPosts(p => p.map(x => x.id === postId ? { ...x, replies: (x.replies || []).filter(r => r.id !== replyId) } : x));
    if (openPost?.id === postId) setOpenPost(prev => ({ ...prev, replies: (prev.replies || []).filter(r => r.id !== replyId) }));
  };

  const loadMembers = async () => {
    try {
      const m = await getTeacherForumMembers(selected.courseId);
      setMembers(m); setMembersModal(true);
    } catch (err) { alert("Error: " + err.message); }
  };

  if (loading) return <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>;

  if (courses.length === 0) return (
    <div className="fade-up">
      <PageHeader title="Course Forums" />
      <Card><div style={{ padding: 32, textAlign: "center", color: T.muted }}>
        No courses assigned yet. Contact admin to assign courses to you.
      </div></Card>
    </div>
  );

  return (
    <div className="fade-up">
      <PageHeader title="Course Forums"
        subtitle="Manage and moderate discussions for your courses"
        actions={selected && [
          <Btn variant="dark" onClick={loadMembers}>👥 Members</Btn>,
          <Btn variant="primary" onClick={() => setNewModal(true)}>📢 New Post</Btn>
        ]} />

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, minHeight: 600 }}>
        {/* Course list */}
        <div>
          {courses.map(c => (
            <div key={c.courseId} onClick={() => { setSelected(c); setOpenPost(null); }}
              style={{
                padding: "14px 16px", borderRadius: 12, cursor: "pointer", marginBottom: 8,
                background: selected?.courseId === c.courseId ? `${T.accentG}18` : T.bg3,
                border: `1.5px solid ${selected?.courseId === c.courseId ? T.accentG : T.border}`,
                transition: "all .2s",
              }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>📚 {c.courseTitle}</div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>🏢 {c.department || "—"}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 10, background: `${T.accentG}18`, color: T.accentG, borderRadius: 50, padding: "2px 8px", fontWeight: 700 }}>👥 {c.memberCount}</span>
                <span style={{ fontSize: 10, background: `${T.primaryL}18`, color: T.primaryL, borderRadius: 50, padding: "2px 8px", fontWeight: 700 }}>💬 {c.postCount}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Posts */}
        <div>
          {!openPost ? (
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, background: T.bg3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 16 }}>{selected?.courseTitle}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{selected?.memberCount} members · {selected?.postCount} posts</div>
                </div>
              </div>
              <div style={{ padding: "12px 20px 0" }}>
                <Tabs tabs={["All", "Question", "Discussion", "Announcement"]} active={tab} onChange={setTab} />
              </div>
              <div style={{ padding: "0 20px 20px" }}>
                {postsLoading
                  ? <div style={{ padding: 32, textAlign: "center", color: T.muted }}>Loading…</div>
                  : filteredPosts.length === 0
                    ? <div style={{ padding: 32, textAlign: "center", color: T.muted }}>No posts yet.</div>
                    : filteredPosts.map(p => (
                      <div key={p.id} style={{ padding: "16px 0", borderBottom: `1px solid rgba(45,33,96,.3)` }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <div style={{ cursor: "pointer", flex: 1 }} onClick={() => setOpenPost(p)}>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                              <Avatar name={p.authorName || "U"} size={34}
                                color={p.authorRole === "TEACHER" ? T.accentG : T.accent} />
                              <div>
                                <span style={{ fontWeight: 700, fontSize: 13 }}>{p.authorName}</span>
                                {p.authorRole === "TEACHER" && <Badge type="success" style={{ marginLeft: 6 }}>✓ You</Badge>}
                              </div>
                              <span style={{ fontSize: 10, background: `${typeColor[p.type]}18`, color: typeColor[p.type], borderRadius: 50, padding: "2px 8px", fontWeight: 700 }}>
                                {typeIcon[p.type]} {p.type}
                              </span>
                              <span style={{ fontSize: 11, color: T.muted, marginLeft: "auto" }}>{timeAgo(p.createdAt)}</span>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, paddingLeft: 46 }}>{p.title}</div>
                            <div style={{ fontSize: 13, color: T.muted, paddingLeft: 46, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.content}</div>
                            <div style={{ fontSize: 11, color: T.muted, paddingLeft: 46, marginTop: 6 }}>💬 {p.replies?.length || 0} replies</div>
                          </div>
                          <Btn size="xs" variant="danger" onClick={() => handleDeletePost(p.id)}>🗑</Btn>
                        </div>
                      </div>
                    ))
                }
              </div>
            </Card>
          ) : (
            // Post detail
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, background: T.bg3, display: "flex", gap: 12, alignItems: "center" }}>
                <Btn size="xs" variant="ghost" onClick={() => setOpenPost(null)}>← Back</Btn>
                <div style={{ flex: 1, fontFamily: "Syne", fontWeight: 700 }}>{openPost.title}</div>
                <Btn size="xs" variant="danger" onClick={() => handleDeletePost(openPost.id)}>🗑 Delete Post</Btn>
              </div>
              <div style={{ padding: 20 }}>
                {/* Original post */}
                <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
                  <Avatar name={openPost.authorName || "U"} size={44}
                    color={openPost.authorRole === "TEACHER" ? T.accentG : T.accent} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{openPost.authorName}</span>
                      {openPost.authorRole === "TEACHER" && <Badge type="success">✓ Teacher</Badge>}
                      <span style={{ fontSize: 11, color: T.muted }}>{timeAgo(openPost.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{openPost.content}</div>
                  </div>
                </div>

                {/* Replies */}
                {openPost.replies?.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
                      {openPost.replies.length} Replies
                    </div>
                    {openPost.replies.map(r => (
                      <div key={r.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderTop: `1px solid rgba(45,33,96,.3)`, alignItems: "flex-start" }}>
                        <Avatar name={r.authorName || "U"} size={34}
                          color={r.authorRole === "TEACHER" ? T.accentG : T.primaryL} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: 13 }}>{r.authorName}</span>
                            {r.authorRole === "TEACHER" && <Badge type="success">✓ Teacher</Badge>}
                            <span style={{ fontSize: 11, color: T.muted }}>{timeAgo(r.createdAt)}</span>
                          </div>
                          <div style={{ fontSize: 13, lineHeight: 1.6 }}>{r.content}</div>
                        </div>
                        <Btn size="xs" variant="danger" onClick={() => handleDeleteReply(r.id, openPost.id)}>✕</Btn>
                      </div>
                    ))}
                  </div>
                )}

                {/* Teacher reply */}
                <div style={{ borderTop: `1px solid rgba(45,33,96,.4)`, paddingTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.accentG, marginBottom: 10 }}>✓ Reply as Teacher</div>
                  <textarea rows={3} value={replyText} onChange={e => setReplyText(e.target.value)}
                    placeholder="Write your response…"
                    style={{ width: "100%", background: T.bg3, border: `1.5px solid ${T.accentG}40`, borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text, outline: "none", resize: "vertical", fontFamily: "DM Sans", marginBottom: 10 }}
                    onFocus={e => e.target.style.borderColor = T.accentG}
                    onBlur={e => e.target.style.borderColor = `${T.accentG}40`}
                  />
                  <Btn variant="success" onClick={() => handleReply(openPost.id)} disabled={saving}>
                    {saving ? "Posting…" : "Post Reply →"}
                  </Btn>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* New Post Modal */}
      <Modal open={newModal} onClose={() => setNewModal(false)} title={`Post to ${selected?.courseTitle}`}>
        <Select label="Post Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
          options={[
            { value: "ANNOUNCEMENT", label: "📢 Announcement" },
            { value: "DISCUSSION",   label: "💬 Discussion" },
            { value: "QUESTION",     label: "❓ Question" },
          ]} />
        <Input label="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="Post title" />
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Content *</label>
          <textarea rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Write your message to students…"
            style={{ width: "100%", background: T.bg3, border: `1.5px solid ${T.border}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, color: T.text, outline: "none", resize: "vertical", fontFamily: "DM Sans" }}
            onFocus={e => e.target.style.borderColor = T.accentG}
            onBlur={e => e.target.style.borderColor = T.border}
          />
        </div>
        <Btn variant="success" full size="lg" onClick={handleNewPost} disabled={saving}>
          {saving ? "Posting…" : "Post to All Students →"}
        </Btn>
      </Modal>

      {/* Members Modal */}
      <Modal open={membersModal} onClose={() => setMembersModal(false)} title={`Members — ${selected?.courseTitle}`}>
        {members && (
          <>
            <div style={{ background: `${T.accentG}15`, border: `1px solid ${T.accentG}30`, borderRadius: 9, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>
              👥 <strong>{members.total}</strong> members in this forum
              ({members.students?.length || 0} students + 1 teacher)
            </div>
            {/* Teacher */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Teacher</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0" }}>
                <Avatar name={members.teacher?.name || "T"} size={34} color={T.accentG} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{members.teacher?.name}</div>
                  <Badge type="success">✓ Teacher</Badge>
                </div>
              </div>
            </div>
            {/* Students */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                Students ({members.students?.length || 0})
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto", border: `1px solid ${T.border}`, borderRadius: 9 }}>
                {(members.students || []).map(s => (
                  <div key={s.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 14px", borderBottom: `1px solid rgba(45,33,96,.3)` }}>
                    <Avatar name={s.name} size={30} color={T.accent} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{s.userId} · {s.department || "—"}</div>
                    </div>
                    <Badge type={s.active ? "success" : "warning"}>{s.active ? "Active" : "Inactive"}</Badge>
                  </div>
                ))}
                {(!members.students || members.students.length === 0) && (
                  <div style={{ padding: 16, textAlign: "center", color: T.muted, fontSize: 13 }}>
                    No students enrolled yet. Add students to a batch linked to this course.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default StudentForum;
