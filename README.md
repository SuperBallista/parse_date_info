# Date Parser

## 📌 소개
이 프로젝트는 한국어 날짜 및 시간을 파싱하여 JavaScript `Date` 객체로 변환하는 함수들을 포함하고 있습니다.  
"내일 오후 10:45", "다음 주 금요일", "2025년 3월 1일" 등의 입력을 처리할 수 있습니다.
주로 시제 표현은 미래 위주로 파싱 가능하고 관습적으로 생략된 정보는 가장 가까운 미래를 기준으로 출력합니다.

## 📦 기능
- 자연어 날짜 표현 (ex: "내일", "모레", "이번 주 금요일") 파싱
- 연월일 시분 정규식 기반 추출 및 변환
- 오전/오후(`PM`, `오후`, `저녁` 등) 감지 및 변환
- 특정 주의 요일 (ex: "첫째주 월요일") 자동 계산

## 🛠 사용 방법
```ts
import { findDateFromString } from "./formatDate";

// 날짜 변환 테스트
console.log(findDateFromString("내일 오후 10:45")); 
console.log(findDateFromString("다음 주 금요일"));
console.log(findDateFromString("첫째주 월요일"));
