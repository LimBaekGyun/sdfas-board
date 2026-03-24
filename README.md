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
