# Retrograde

원형 궤도를 도는 플레이어가 방향 전환만으로 운석을 피하는 웹 게임. 작은 웹 게임을 여러 개 만들 계획이라 공통 코드(engine)와 게임 고유 코드(game)를 분리한다.

## 기술 스택

- Vite + TypeScript(strict) + Canvas 2D. 프레임워크 없음.
- 패키지 매니저 pnpm(`packageManager` 필드), Node 버전은 `.node-version`(fnm). 둘 다 유지할 것.
- 런타임 의존성 금지. 개발 의존성은 템플릿 기본(typescript, vite)만.

## 명령

- `pnpm dev` — 개발 서버
- `pnpm build` — `tsc`(타입 체크) + `vite build`
- `pnpm preview` — 빌드 결과 확인

## 폴더 구조와 분리 원칙

```
src/main.ts      부팅: 캔버스·입력·씬 매니저·루프 연결
src/engine/      게임에 종속되지 않는 코드
  loop.ts        고정 timestep 루프 + 렌더 alpha
  interp.ts      렌더 보간용 Interp (prev/cur)
  input.ts       pointer/Space → "primary" 액션
  scene.ts       Scene 인터페이스, SceneManager
  canvas.ts      리사이즈, DPR, 원점을 화면 중앙으로 두는 beginFrame
  storage.ts     localStorage 래퍼 (실패 시 무시)
  math.ts        수학 유틸, 원-원 충돌
src/game/        이 게임 고유 코드
  config.ts      모든 조정 수치 (밸런스는 여기서만 수정)
  difficulty.ts  스테이지 → D, D → 게임 요소 (2층 구조)
  orbit.ts       궤도 반지름 비율(현재/목표)과 지수 감속
  trajectory.ts  직선 궤적 계산 (운석·아이템 공용)
  spawner.ts     Spawner 인터페이스 + RandomSpawner (교체 가능)
  debug.ts       URL 디버그 파라미터 파싱
  asteroid.ts / player.ts / pickup.ts / collision.ts
  renderer.ts    모든 그리기 코드 (여기만 바꾸면 SVG/이미지로 교체 가능)
  scenes/        title, play, gameover
```

- **engine은 game을 import하지 않는다.** game → engine 방향만 허용.
- **게임 로직은 renderer를 import하지 않는다.** 씬이 데이터를 renderer 함수에 넘기는 단방향. (renderer가 개체 타입과 `orbitPoint`를 읽는 것은 허용.)
- 범용 엔진을 미리 설계하지 말고, 이 게임이 실제로 쓰는 것만 engine에 둔다.
- 입력은 장치가 아니라 액션 단위. 씬이 액션의 의미를 정한다(플레이 중 = 방향 전환, 타이틀 시작·일시정지 재개 = 소비만, 방향 전환 없음).

## 규칙과 주의점

- 모든 수치는 `config.ts`. 길이 단위는 대부분 기준 반지름 `baseR` 비율(`baseR = min(w, h) * orbit.baseRadiusRatio`, 화면 크기로만 결정).
- **난이도 2층 구조** (`difficulty.ts`, 서로 독립적으로 조정 가능)
  1. 스테이지 → D: `D(n) = A·ln(1+(n/T)^k)`. 스테이지 = `floor(총점/100)`(아이템 점수 포함). 난이도는 스테이지가 바뀔 때만 갱신된다.
  2. D → 요소: 상한 없는 요소(운석 생성 빈도 = base + slope·D)와, 공통 포화 함수 `start+(max-start)(1-e^(-D/scale))`를 쓰는 상한 있는 요소(속도 배율, 위협 비율, 작은 운석 비중, 목표 궤도 비율).
  - 운석은 생성 시점의 값으로 만들어지고 이후 바뀌지 않는다. 생성기는 D가 아니라 요소 값(`SpawnContext.stats`)만 받는다.
- **궤도 축소:** 목표 비율이 스테이지마다 바뀌고 현재 비율이 지수적으로 접근(`orbit.easeSec`). 현재 반지름은 궤도 그리기·플레이어 위치·충돌에, 목표 반지름은 운석·아이템 궤적의 d 범위에 쓴다. 운석·아이템·플레이어의 크기와 속도는 **반드시 `baseR` 기준**이어야 한다(현재 반지름 기준이면 축소가 난이도에 영향을 못 줌).
- **플레이어 이동은 선속도 기준:** 기준 선속도 = `player.angularSpeed × baseR`, 실제 선속도 = 기준 × 플레이어 속도 배율(D→요소의 상한 있는 요소, 스테이지 변경 시 즉시 적용). 매 step 각속도 = 선속도 / 현재 반지름이라 궤도가 줄면 더 빨리 돈다. 한 바퀴 최소 시간(`player.minLapSec`)으로 각속도를 clamp. 이렇게 해야 궤도가 줄어도 운석 대비 회피 능력이 급락하지 않고, 후반 탈락은 생성 빈도가 담당한다.
- 아이템은 운석과 같은 궤적 코드로 화면 밖에서 와서 느리게 직선 이동하며, 화면을 나가면 제거된다.
- 고정 timestep(`tickHz`)으로 update, render는 `alpha`로 이전/현재 상태 사이를 보간한다. 보간할 값은 `Interp`로 들고 update마다 `push`, 순간이동은 `reset`. 플레이어 각도는 wrap하지 않는다.
- 운석 궤적: 직선의 최근접점 `C = d(cosφ, sinφ)`, 진행 방향은 C에 수직, 스폰 위치는 화면 밖 진입점. 빗나가는 운석은 d 상한을 화면 크기로 제한해 항상 화면을 지난다. `asteroid.travelLeft`로 퇴장 판정.
- 좌표계: 화면 중앙이 원점.
- tsconfig는 `strict` + `erasableSyntaxOnly`: 클래스 parameter property, enum 사용 불가.

## 디버그 URL 파라미터

- `?stage=N` — 총점 N×100, 해당 스테이지의 목표 궤도 반지름으로 바로 시작. 이렇게 시작한 판은 최고 점수를 저장하지 않는다.
- `?debug=1` — 좌하단에 스테이지, D, 생성 빈도, 운석 속도 배율, 플레이어 속도 배율, 한 바퀴 시간, 위협 비율, 작은 운석 비중, 현재/목표 반지름 표시. 최고 점수는 정상 저장.
- 둘은 함께 쓸 수 있다: `?stage=25&debug=1`
