import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const config = window.SDFAS_BOARD_CONFIG;

if (!config?.supabaseUrl || !config?.supabaseAnonKey) {
  throw new Error("config.js에 Supabase 설정이 필요합니다.");
}

const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

const state = {
  posts: [],
  searchTerm: "",
  user: null,
  isAdmin: false,
};

const elements = {
  postForm: document.querySelector("#post-form"),
  authorInput: document.querySelector("#author-input"),
  titleInput: document.querySelector("#title-input"),
  contentInput: document.querySelector("#content-input"),
  submitButton: document.querySelector("#submit-button"),
  refreshButton: document.querySelector("#refresh-button"),
  formStatus: document.querySelector("#form-status"),
  listStatus: document.querySelector("#list-status"),
  authForm: document.querySelector("#auth-form"),
  emailInput: document.querySelector("#email-input"),
  loginButton: document.querySelector("#login-button"),
  logoutButton: document.querySelector("#logout-button"),
  authStatus: document.querySelector("#auth-status"),
  authBadge: document.querySelector("#auth-badge"),
  statCount: document.querySelector("#stat-count"),
  statRefresh: document.querySelector("#stat-refresh"),
  emptyState: document.querySelector("#empty-state"),
  postList: document.querySelector("#post-list"),
  searchInput: document.querySelector("#search-input"),
};

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isAdminEmail(email) {
  return (config.adminEmails ?? []).some(
    (candidate) => normalizeEmail(candidate) === normalizeEmail(email)
  );
}

function setStatus(target, message, tone = "default") {
  target.textContent = message;
  target.dataset.tone = tone;
}

function setPending(target, isPending, pendingText, idleText) {
  target.disabled = isPending;
  target.textContent = isPending ? pendingText : idleText;
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatRefreshDate() {
  elements.statRefresh.textContent = formatDate(new Date().toISOString());
}

function getReadableError(error) {
  const message = error?.message ?? "알 수 없는 오류가 발생했습니다.";
  const lower = message.toLowerCase();

  if (
    lower.includes("relation") ||
    lower.includes("schema cache") ||
    lower.includes(config.tableName.toLowerCase())
  ) {
    return "Supabase SQL Editor에서 `supabase/board-posts.sql`을 먼저 실행해 주세요.";
  }

  if (
    lower.includes("row-level security") ||
    lower.includes("not authenticated") ||
    lower.includes("permission denied") ||
    error?.status === 401 ||
    error?.status === 403
  ) {
    return "권한이 없거나 로그인이 필요합니다. 관리자 로그인과 RLS 정책을 확인해 주세요.";
  }

  return `연결 오류: ${message}`;
}

function buildPostCard(post) {
  const article = document.createElement("article");
  article.className = "board-post";

  const head = document.createElement("div");
  head.className = "board-post-head";

  const copy = document.createElement("div");
  const meta = document.createElement("div");
  meta.className = "post-meta";

  const author = document.createElement("span");
  author.className = "post-author";
  author.textContent = post.author;

  const time = document.createElement("span");
  time.textContent = formatDate(post.created_at);

  meta.append(author, time);

  const title = document.createElement("h3");
  title.className = "post-title";
  title.textContent = post.title;

  const body = document.createElement("p");
  body.className = "post-body";
  body.textContent = post.content;

  const controls = document.createElement("div");
  controls.className = "post-controls";

  if (state.isAdmin) {
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "삭제";
    deleteButton.addEventListener("click", async () => {
      const confirmed = window.confirm("이 게시글을 삭제할까요?");

      if (!confirmed) {
        return;
      }

      try {
        setStatus(elements.listStatus, "게시글을 삭제하는 중입니다.");
        const { error } = await supabase
          .from(config.tableName)
          .delete()
          .eq("id", post.id);

        if (error) {
          throw error;
        }

        setStatus(elements.listStatus, "게시글을 삭제했습니다.", "success");
        await loadPosts();
      } catch (error) {
        setStatus(elements.listStatus, getReadableError(error), "error");
      }
    });

    controls.append(deleteButton);
  }

  copy.append(meta, title, body);
  head.append(copy, controls);
  article.append(head);

  return article;
}

function renderPosts() {
  const keyword = state.searchTerm.trim().toLowerCase();
  const posts = keyword
    ? state.posts.filter((post) => {
        const haystack = [post.author, post.title, post.content]
          .join(" ")
          .toLowerCase();

        return haystack.includes(keyword);
      })
    : state.posts;

  elements.postList.replaceChildren();
  elements.statCount.textContent = String(state.posts.length);
  elements.emptyState.hidden = posts.length > 0;

  if (!posts.length) {
    return;
  }

  const fragment = document.createDocumentFragment();

  posts.forEach((post) => {
    fragment.append(buildPostCard(post));
  });

  elements.postList.append(fragment);
}

function syncAuthUi() {
  if (!state.user) {
    elements.authBadge.textContent = "로그아웃";
    elements.logoutButton.hidden = true;
    setStatus(
      elements.authStatus,
      "관리자 이메일로 로그인하면 삭제 버튼이 활성화됩니다."
    );
    renderPosts();
    return;
  }

  elements.logoutButton.hidden = false;
  elements.authBadge.textContent = state.isAdmin ? "관리자" : "일반 로그인";
  setStatus(
    elements.authStatus,
    state.isAdmin
      ? `${state.user.email} 계정으로 로그인했습니다. 삭제 권한이 활성화되었습니다.`
      : `${state.user.email} 계정으로 로그인했지만 관리자 이메일 목록에 없습니다.`,
    state.isAdmin ? "success" : "default"
  );
  renderPosts();
}

async function refreshAuthState() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    state.user = null;
    state.isAdmin = false;
    syncAuthUi();
    setStatus(elements.authStatus, getReadableError(error), "error");
    return;
  }

  state.user = user ?? null;
  state.isAdmin = isAdminEmail(user?.email);
  syncAuthUi();
}

async function loadPosts() {
  try {
    setStatus(elements.listStatus, "게시글 목록을 불러오는 중입니다.");
    const { data, error } = await supabase
      .from(config.tableName)
      .select("id, author, title, content, created_at")
      .order("created_at", { ascending: false })
      .limit(config.postsLimit ?? 100);

    if (error) {
      throw error;
    }

    state.posts = data ?? [];
    formatRefreshDate();
    renderPosts();
    setStatus(elements.listStatus, `최신 게시글 ${state.posts.length}개를 불러왔습니다.`, "success");
  } catch (error) {
    state.posts = [];
    renderPosts();
    setStatus(elements.listStatus, getReadableError(error), "error");
  }
}

async function handleCreatePost(event) {
  event.preventDefault();

  const payload = {
    author: elements.authorInput.value.trim(),
    title: elements.titleInput.value.trim(),
    content: elements.contentInput.value.trim(),
  };

  if (!payload.author || !payload.title || !payload.content) {
    setStatus(elements.formStatus, "작성자, 제목, 내용은 모두 입력해야 합니다.", "error");
    return;
  }

  try {
    setPending(elements.submitButton, true, "등록 중...", "게시글 올리기");
    setStatus(elements.formStatus, "게시글을 저장하는 중입니다.");

    const { error } = await supabase.from(config.tableName).insert(payload);

    if (error) {
      throw error;
    }

    elements.postForm.reset();
    setStatus(elements.formStatus, "게시글이 등록되었습니다.", "success");
    await loadPosts();
  } catch (error) {
    setStatus(elements.formStatus, getReadableError(error), "error");
  } finally {
    setPending(elements.submitButton, false, "등록 중...", "게시글 올리기");
  }
}

async function handleLogin(event) {
  event.preventDefault();

  const email = elements.emailInput.value.trim();

  if (!email) {
    setStatus(elements.authStatus, "이메일을 입력해 주세요.", "error");
    return;
  }

  try {
    setPending(elements.loginButton, true, "전송 중...", "매직 링크 보내기");
    setStatus(elements.authStatus, "매직 링크를 보내는 중입니다.");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
      },
    });

    if (error) {
      throw error;
    }

    setStatus(elements.authStatus, "이메일로 매직 링크를 보냈습니다.", "success");
  } catch (error) {
    setStatus(elements.authStatus, getReadableError(error), "error");
  } finally {
    setPending(elements.loginButton, false, "전송 중...", "매직 링크 보내기");
  }
}

async function handleLogout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    setStatus(elements.authStatus, getReadableError(error), "error");
    return;
  }

  state.user = null;
  state.isAdmin = false;
  syncAuthUi();
  setStatus(elements.authStatus, "로그아웃했습니다.", "success");
}

function bindEvents() {
  elements.postForm.addEventListener("submit", handleCreatePost);
  elements.authForm.addEventListener("submit", handleLogin);
  elements.logoutButton.addEventListener("click", handleLogout);
  elements.refreshButton.addEventListener("click", loadPosts);
  elements.searchInput.addEventListener("input", (event) => {
    state.searchTerm = event.target.value;
    renderPosts();
  });

  supabase.auth.onAuthStateChange(async () => {
    await refreshAuthState();
  });
}

async function init() {
  bindEvents();
  await Promise.all([refreshAuthState(), loadPosts()]);
}

init().catch((error) => {
  setStatus(elements.formStatus, getReadableError(error), "error");
  setStatus(elements.listStatus, getReadableError(error), "error");
});
