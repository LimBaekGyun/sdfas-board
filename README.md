# SDFAS Board

Supabase를 데이터베이스로 사용하는 정적 게시판 프로젝트입니다.

## 포함 기능

- 게시글 작성
- 최신순 목록 조회
- 제목, 내용, 작성자 검색
- Supabase 이메일 로그인 기반 관리자 삭제

## 파일 구조

- `index.html`: 게시판 화면
- `styles.css`: UI 스타일
- `app.js`: Supabase 연동 로직
- `config.js`: 현재 프로젝트 설정
- `config.example.js`: 설정 예시
- `supabase/board-posts.sql`: 게시판 테이블과 RLS 정책

## Supabase 설정

1. Supabase 프로젝트의 SQL Editor에서 `supabase/board-posts.sql`을 실행합니다.
2. `config.js`의 `supabaseUrl`, `supabaseAnonKey`, `adminEmails`를 필요에 맞게 수정합니다.
3. Supabase Authentication에서 이메일 로그인과 매직 링크를 사용할 수 있게 설정합니다.
4. Redirect URL에 현재 사이트 주소를 등록합니다.

## 실행

정적 파일만으로 동작하므로 `index.html`을 브라우저에서 열거나, 간단한 로컬 서버로 실행하면 됩니다.

예시:

```powershell
cd C:\weasel\sdfas
python -m http.server 5500
```

또는 VS Code Live Server 같은 정적 서버를 사용해도 됩니다.

## Vercel 배포

이 프로젝트는 정적 사이트라서 Vercel에 바로 올릴 수 있습니다.

1. GitHub 저장소를 Vercel에 Import 합니다.
2. Framework Preset은 `Other` 또는 자동 감지 그대로 둡니다.
3. Build Command는 비워 두고, Output Directory도 비워 둡니다.
4. 배포 후 Supabase Authentication의 Redirect URL에 Vercel 배포 주소를 추가합니다.

관리자 매직 링크 로그인을 쓰려면 Supabase 쪽 Redirect URL 설정이 반드시 맞아야 합니다.
