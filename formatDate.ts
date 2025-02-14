

// 날짜 포맷 변환 함수
  export const formatDate = (date: Date) => {
        return new Date(date).toLocaleString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      };
  
      export function formatDateString(date: Date, style: string): string {
        let year = String(date.getFullYear());
        let halfyear = year.slice(2, 4); // "2025" → "25"
        let month = String(date.getMonth() + 1).padStart(2, "0"); // "2" → "02"
        let dateNumber = String(date.getDate()).padStart(2, "0");
        let hour = String(date.getHours()).padStart(2, "0");
        let minute = String(date.getMinutes()).padStart(2, "0");
    
        return style
            .replace("YYYY", year)
            .replace("YY", halfyear)
            .replace("MM", month)
            .replace("DD", dateNumber)
            .replace("HH", hour)
            .replace("mm", minute);
    }
    

    // 공백 제거 및 시간 추출 함수

    function preprocessText(text: string) {
        const trimText = text.replace(/\s+/g, ""); // 공백 제거
        const now = new Date();
        const nowKST = new Date(now.getTime() + 9 * 60 * 60 * 1000); // KST 변환
        return { trimText, nowKST };
    }

    // 날짜시간 정보 패턴 추출 함수

    function extractDatePatterns(trimText: string) {
        return {
            isTomorrow: /내일/.test(trimText),
            isTheDayAfter: /모레/.test(trimText),
            dayMatch: trimText.match(/(월|화|수|목|금|토|일)요일/),
            findFullDate: trimText.match(/(\d{4})[.-\/](\d{1,2})[.-\/](\d{1,2})/),
            findYear: trimText.match(/(\d{4})년/),
            findMonthDate: trimText.match(/(\d{1,2})[.-\/](\d{1,2})/),
            findMonth: trimText.match(/(\d{1,2})월/),
            findDate: trimText.match(/(\d{1,2})일/),
            findTime: trimText.match(/(\d{1,2}):(\d{2})/),
            findHour: trimText.match(/(\d{1,2})시/),
            findHalfMinute: trimText.match(/(\d{1,2})시반/),
            findMinute: !!trimText.match(/(\d{1,2})시반/) ? "30분" : trimText.match(/(\d{1,2})분/),
            findAMPM: trimText.match(/(PM|오후|저녁|AM|오전|아침|새벽)/i),
        };
    }
    
    // 반복 표현 패턴 추출

    function extractRecurringPatterns(trimText: string) {
        return {
            isDaily: /매일/.test(trimText),
            isWeekly: /매주/.test(trimText),
            isMonthly: /매달|매월/.test(trimText),
            isYearly: /매년|매해/.test(trimText)
        };
    }
    

    // 요일 정보 추출

    function extractWeekNumber(trimText: string) {
        const weekMatch = trimText.match(/(첫째|둘째|셋째|넷째)주/);
        const weekMap: Record<string, number> = { "첫째": 1, "둘째": 2, "셋째": 3, "넷째": 4, "다섯째":5 };
        return weekMatch ? weekMap[weekMatch[1]] : null;
    }


    
    function adjustRelativeDate(
        date: number | null, 
        month: number | null, 
        year: number | null, 
        hour: number | null, 
        minute: number | null, 
        nowKST: Date, 
        usedAmpmPattern: boolean | null, 
        nextDayReference: string | null
    ) {
        let adjustedDate = date || nowKST.getDate();
        let adjustedMonth = month || nowKST.getMonth() + 1;
        let adjustedYear = year || nowKST.getFullYear();
        let adjustHour = hour ?? null;
        let adjustMinute = minute ?? 0;

        // 현재 한국 시간
        const nowYear = nowKST.getFullYear();
        const nowMonth = nowKST.getMonth() + 1;
        const nowDate = nowKST.getDate();
        const nowHour = nowKST.getHours();
        const nowMinute = nowKST.getMinutes();
    
        const TodayFullDate = new Date(Date.UTC(nowYear, nowMonth - 1, nowDate));
        const TodayFullDateTime = new Date(Date.UTC(nowYear, nowMonth - 1, nowDate, nowHour - 9, nowMinute));
        const TargetFullDate = new Date(Date.UTC(adjustedYear, adjustedMonth - 1, adjustedDate));
        const TargetFullDateTime = new Date(Date.UTC(adjustedYear, adjustedMonth - 1, adjustedDate, adjustHour !== null ? adjustHour - 9 : 0, adjustMinute));
    
        // 📌 오후 변환 (PM 감지 시 12시간 추가)
        if (usedAmpmPattern && adjustHour !== null && adjustHour < 12) {
            adjustHour += 12;
        }
    
        // 📌 관습적 날짜 보정
        if (TodayFullDate > TargetFullDate && adjustHour === null && adjustMinute === 0) {
            if (!date) adjustedDate += 1;
            else if (!month) adjustedMonth += 1;
            else if (!year) adjustedYear += 1;
        } else if (TodayFullDateTime > TargetFullDateTime) {
            if (adjustHour !== null) {  
                if ((!usedAmpmPattern && adjustHour <= 7) || (usedAmpmPattern && adjustHour < 12)) {
                    adjustHour += 12;
                }
            } else {
                if (!date) adjustedDate += 1;
                else if (!month) adjustedMonth += 1;
                else if (!year) adjustedYear += 1;
            }
        }
    
        // 📌 시간 정리
        const checkedDate = checkDate(adjustedYear, adjustedMonth, adjustedDate, adjustHour ?? 0, adjustMinute);
    
        return {
            adjustedYear: checkedDate.year,
            adjustedMonth: checkedDate.month,
            adjustedDate: checkedDate.date,
            adjustHour: adjustHour !== null ? checkedDate.hour : null,
            adjustMinute: checkedDate.minute
        };
    }
    
    function checkDate(year: number, month: number, date: number, hour: number, minute: number) {
        // 분 정리 (0~59 범위로 조정)
        while (minute >= 60) {
            minute -= 60;
            hour += 1;
        }
        while (minute < 0) {
            minute += 60;
            hour -= 1;
        }
    
        // 시간 정리 (0~23 범위로 조정)
        while (hour >= 24) {
            hour -= 24;
            date += 1;
        }
        while (hour < 0) {
            hour += 24;
            date -= 1;
        }
    
        // 각 월의 마지막 날짜 정보 (윤년 고려)
        function getLastDate(y: number, m: number): number {
            return new Date(y, m, 0).getDate();
        }
    
        // 날짜 정리
        while (date > getLastDate(year, month)) {
            date -= getLastDate(year, month);
            month += 1;
            if (month > 12) {
                month = 1;
                year += 1;
            }
        }
    
        while (date < 1) {
            month -= 1;
            if (month < 1) {
                month = 12;
                year -= 1;
            }
            date += getLastDate(year, month);
        }
    
        return { year, month, date, hour, minute };
    }
    

    // 요일별 번호 정의하기
    const daysOfWeek: Record<string, number> = {
        "일": 0, "월": 1, "화": 2, "수": 3, "목": 4, "금": 5, "토": 6
    };


    
// 요일에서 정확한 날짜를 추출하기
function getNthWeekdayOfMonth(year: number, month: number, targetDay: string, nthWeek: number | null, nowKST: Date): { year: number, month: number, date: number } | null {

    function findNthWeekDate(y: number, m: number): number | null {
        const firstDay = new Date(y, m - 1, 1).getDay(); // 해당 달 1일의 요일
        let firstTargetDate = 1 + (daysOfWeek[targetDay] - firstDay + 7) % 7; // 첫 번째 해당 요일 날짜

        if (nthWeek === null) {
            // 오늘을 기준으로 가장 가까운 다음 요일 찾기
            const today = nowKST.getDate();
            const currentDay = nowKST.getDay(); // 현재 요일 (0: 일요일, 1: 월요일, ...)
            let dayDifference = daysOfWeek[targetDay] - currentDay;

            if (dayDifference <= 0) {
                dayDifference += 7; // 다음 주의 같은 요일로 이동
            }

            firstTargetDate = today + dayDifference;
        } else if (nthWeek > 1) {
            firstTargetDate += (nthWeek - 1) * 7; // N번째 요일 찾기
        }

        // 해당 월의 마지막 날짜 확인
        const lastDate = new Date(y, m, 0).getDate();

        // 유효한 날짜인지 확인 (범위를 초과하면 null 반환)
        return firstTargetDate <= lastDate ? firstTargetDate : null;
    }

    let targetDate = findNthWeekDate(year, month);

    // 현재 날짜보다 과거라면 다음 달로 이동
    if (targetDate) {
        const targetFullDate = new Date(year, month - 1, targetDate);
        if (targetFullDate < nowKST) {
            month += 1;
            if (month > 12) {
                month = 1;
                year += 1;
            }
            targetDate = findNthWeekDate(year, month);
        }
    }

    return targetDate ? { year, month, date: targetDate } : null;
}



    export function findDateFromString(text: string) {
        const { trimText, nowKST } = preprocessText(text); // 데이터 추출
        const datePatterns = extractDatePatterns(trimText); // 패턴 추출
        const recurringPatterns = extractRecurringPatterns(trimText); // 계속성 정보 추출
        const weekNumber = datePatterns.dayMatch ? extractWeekNumber(trimText) : null; //

        const nextDayReference = datePatterns.isTheDayAfter ? "모레"
                                : datePatterns.isTomorrow ? "내일"
                                : null
    
        const year = datePatterns.findFullDate ? Number(datePatterns.findFullDate[1]) 
                 : datePatterns.findYear ? Number(datePatterns.findYear[1]) 
                 : null;
    
        const month = datePatterns.findFullDate ? Number(datePatterns.findFullDate[2]) 
                  : datePatterns.findMonthDate ? Number(datePatterns.findMonthDate[1]) 
                  : datePatterns.findMonth ? Number(datePatterns.findMonth[1]) 
                  : null;
    
        const date = datePatterns.findFullDate ? Number(datePatterns.findFullDate[3]) 
                 : datePatterns.findMonthDate ? Number(datePatterns.findMonthDate[2]) 
                 : datePatterns.findDate ? Number(datePatterns.findDate[1])
                 : nextDayReference === "모레" ? (new Date()).getDate() + 2
                 : nextDayReference === "내일" ? (new Date()).getDate() + 1
                 : null;
    
        const hour = datePatterns.findTime ? Number(datePatterns.findTime[1]) 
                 : datePatterns.findHour ? Number(datePatterns.findHour[1]) 
                 : null;
    
        const minute = datePatterns.findMinute === "30분" ? 30 :
                    datePatterns.findTime ? Number(datePatterns.findTime[2]) 
                   : datePatterns.findMinute ? Number(datePatterns.findMinute[1]) 
                   : null;
        let pm = ["PM","pm","pM","Pm","오후","저녁"]    
        let ampm = datePatterns.findAMPM === null ? null : pm.includes(datePatterns.findAMPM[0]);

    
        let { adjustedYear, adjustedMonth, adjustedDate, adjustHour, adjustMinute } = adjustRelativeDate(
            date, month, year, hour, minute, nowKST, 
            ampm, nextDayReference);
    
        let yearForNthWeek = year || nowKST.getFullYear();
        let monthForNthWeek = month || nowKST.getMonth() + 1;
    
        // 매달 표현이 있으면 다음 달을 기본으로 설정
        if (recurringPatterns.isMonthly) {
            monthForNthWeek += 1;
            if (monthForNthWeek > 12) {
                monthForNthWeek = 1;
                yearForNthWeek += 1;
            }
        }
    
        // 특정 주의 요일을 찾기
        let nthWeekDate = (datePatterns.dayMatch) ? 
            getNthWeekdayOfMonth(yearForNthWeek, monthForNthWeek, datePatterns.dayMatch[1], weekNumber, nowKST) : null;
    
        if (!year && !month && !date && nthWeekDate) {
            adjustedDate = nthWeekDate.date;
            adjustedMonth = nthWeekDate.month;
            adjustedYear = nthWeekDate.year;
        }
    
        // KST 적용 후 최종 변환된 Date 객체 반환
        const finalDate = new Date(Date.UTC(adjustedYear, adjustedMonth - 1, adjustedDate, adjustHour - 9, adjustMinute));
    
        return {
            resultDate: finalDate,
            year: year,
            month: month,
            date: date,
            day: datePatterns.dayMatch ? daysOfWeek[datePatterns.dayMatch[1]] : null,
            hour: hour,
            minute,
            ampm,
            weekNumber, 
            recurring: recurringPatterns.isDaily ? "매일" : recurringPatterns.isWeekly ? "매주" : recurringPatterns.isMonthly ? "매달" : recurringPatterns.isYearly ? "매년" : null
        };
    }
    
    

