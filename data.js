/**
 * data.js
 * 라스트마일 배송 지연 분석 웹사이트 - 데이터셋 및 모델 정의
 * 한림대학교 경영학과 포트폴리오
 */

const LASTMILE_DATA = {
  summary: {
    totalOrders: 20000,
    totalDelayed: 2115,
    delayRate: 10.6, // 10.575%
    onTimeRate: 89.4,
    csComplaintRate: 7.0, // 1,400건
    csComplaints: 1400,
    avgCustomerRating: 4.53,
    period: "2026년 4월 1일 ~ 6월 30일 (2026 Q2)",
    avgDelayMinutesForDelayed: 34.8,
    missingValues: 0,
    duplicateOrders: 0
  },

  // 19개 변수 데이터 사전
  dictionary: [
    { name: "order_id", kor: "주문 식별자", type: "문자열 (UUID)", role: "식별자 (학습 제외)", desc: "배송 건별 고유 식별 번호 (중복 없음)", isLeakage: true },
    { name: "delivery_date", kor: "배송 일자", type: "날짜 (YYYY-MM-DD)", role: "시계열 기준 변수", desc: "2026-04-01 ~ 2026-06-30 (Q2 3개월 표본)", isLeakage: false },
    { name: "region_type", kor: "지역 유형", type: "범주형 (6종)", role: "핵심 독립 변수", desc: "도서산간, 읍면농촌, 지방중소도시, 지방광역시, 서울도심, 수도권신도시", isLeakage: false },
    { name: "housing_type", kor: "주거 형태", type: "범주형 (5종)", role: "핵심 독립 변수", desc: "아파트, 빌라·다세대, 상가, 단독주택, 오피스텔 (배송 동선과 직결)", isLeakage: false },
    { name: "time_slot", kor: "배송 시간대", type: "범주형 (3종)", role: "독립 변수", desc: "오전(08~12시), 오후(12~18시), 야간/새벽(18~22시)", isLeakage: false },
    { name: "weather", kor: "기상 상태", type: "범주형 (6종)", role: "독립 변수", desc: "맑음, 흐림, 비, 폭우, 눈, 폭염 (실시간 기상 데이터 연동)", isLeakage: false },
    { name: "driver_type", kor: "기사 고용 형태", type: "범주형 (2종)", role: "독립 변수", desc: "전담 정규직(캠프 소속), 파트너/위탁(플렉스 등 위탁 기사)", isLeakage: false },
    { name: "driver_exp_months", kor: "기사 경력(개월)", type: "수치형 (0~120)", role: "독립 변수", desc: "해당 배송 기사의 누적 라스트마일 배송 경력 개월 수", isLeakage: false },
    { name: "daily_dest_count", kor: "당일 배송지 수", type: "수치형 (40~220)", role: "독립 변수", desc: "해당 회차 및 당일 배당된 총 배송 가구 수 (물량 압박 지표)", isLeakage: false },
    { name: "distance_prev_km", kor: "직전 배송지 거리", type: "수치형 (0.1~18.5)", role: "독립 변수", desc: "직전 배송 완료 지점에서 현재 배송지까지의 실제 주행 거리(km)", isLeakage: false },
    { name: "box_weight_kg", kor: "상자 무게(kg)", type: "수치형 (0.5~35.0)", role: "독립 변수", desc: "배송 물품 포장 박스 총 중량", isLeakage: false },
    { name: "is_fresh", kor: "신선식품 여부", type: "이진형 (0 or 1)", role: "독립 변수", desc: "냉장/냉동 보냉 박스 포장 여부 (시간 민감성 높음)", isLeakage: false },
    { name: "has_elevator", kor: "엘리베이터 유무", type: "이진형 (0 or 1)", role: "독립 변수", desc: "도착지 건물 내 승강기 설치 및 정상 가동 여부", isLeakage: false },
    { name: "has_entrance_lock", kor: "공동현관 잠금 여부", type: "이진형 (0 or 1)", role: "독립 변수", desc: "비밀번호, 호출 또는 인터폰 승인이 필요한 현관 잠금 존재 여부", isLeakage: false },
    { name: "is_monday", kor: "월요일 여부", type: "이진형 (0 or 1)", role: "독립 변수", desc: "주말 직후 물량 집중 요일 여부 (1: 월요일, 0: 기타 요일)", isLeakage: false },
    { name: "delayed", kor: "지연 여부 (Target)", type: "이진형 (0 or 1)", role: "목표 변수", desc: "약속 시간 대비 지연 도착 여부 (1: 지연 10.6%, 0: 정시 89.4%)", isLeakage: false },
    { name: "delay_minutes", kor: "지연 시간(분)", type: "수치형 (0~180)", role: "사후 변수 (배제)", desc: "실제 배송 지연 시간(분). 지연 후 발생하는 결과치이므로 누수 방지 배제", isLeakage: true },
    { name: "customer_rating", kor: "고객 평점", type: "수치형 (1~5)", role: "사후 변수 (배제)", desc: "배송 완료 후 고객이 부여한 만족도 점수. 예측 시점 알 수 없음", isLeakage: true },
    { name: "cs_complaint", kor: "CS 불만 접수", type: "이진형 (0 or 1)", role: "사후 변수 (배제)", desc: "배송 후 고객센터로 인입된 컴플레인 여부. 사후 지표이므로 배제", isLeakage: true }
  ],

  // 지역별 기본 집계
  regions: [
    { name: "도서산간", count: 1200, delayed: 426, delayRate: 35.5, avgDist: 9.8, share: 6.0 },
    { name: "읍면농촌", count: 2600, delayed: 512, delayRate: 19.7, avgDist: 5.6, share: 13.0 },
    { name: "지방중소도시", count: 3900, delayed: 472, delayRate: 12.1, avgDist: 2.9, share: 19.5 },
    { name: "지방광역시", count: 4200, delayed: 353, delayRate: 8.4, avgDist: 1.8, share: 21.0 },
    { name: "서울도심", count: 4400, delayed: 365, delayRate: 8.3, avgDist: 1.2, share: 22.0 },
    { name: "수도권신도시", count: 3700, delayed: 274, delayRate: 7.4, avgDist: 1.5, share: 18.5 }
  ],

  // 날씨별 기본 집계
  weather: [
    { name: "폭우", count: 1100, delayed: 230, delayRate: 20.9, icon: "🌧️", desc: "주행 시야 제한 및 노면 침수 위험" },
    { name: "눈", count: 650, delayed: 131, delayRate: 20.2, icon: "❄️", desc: "결빙 및 경사지 감속 주행" },
    { name: "비", count: 3100, delayed: 307, delayRate: 9.9, icon: "🌦️", desc: "일반 우천 감속 및 포장 보호" },
    { name: "맑음", count: 9800, delayed: 951, delayRate: 9.7, icon: "☀️", desc: "기본 기상 조건" },
    { name: "흐림", count: 3850, delayed: 358, delayRate: 9.3, icon: "☁️", desc: "일반 주행 조건" },
    { name: "폭염", count: 1500, delayed: 134, delayRate: 8.9, icon: "🔥", desc: "기사 피로도 및 온열 대책 영향" }
  ],

  // 주거 형태별 기본 집계
  housing: [
    { name: "아파트", count: 8500, delayed: 1037, delayRate: 12.2, desc: "승강기 대기, 지하주차장 진입 제한, 대단지 도보 이동" },
    { name: "빌라·다세대", count: 4200, delayed: 428, delayRate: 10.2, desc: "승강기 없는 3~5층 수동 계단 이동, 주차 협소" },
    { name: "상가", count: 2100, delayed: 212, delayRate: 10.1, desc: "영업시간 전후 대기, 하역 공간 부족" },
    { name: "단독주택", count: 2800, delayed: 260, delayRate: 9.3, desc: "골목길 접근성 차이, 대문 수령 위치 확인" },
    { name: "오피스텔", count: 2400, delayed: 151, delayRate: 6.3, desc: "고속 승강기, 무인택배함 발달, 집중형 동선" }
  ],

  // 주간 시계열 추이 (2026 Q2, 총 13주차)
  weeklyTrend: [
    { week: "W14 (04/01~)", dateRange: "04/01~04/07", total: 1510, delayed: 152, rate: 10.1, note: "4월 초 온화한 기상, 표준 운영" },
    { week: "W15 (04/08~)", dateRange: "04/08~04/14", total: 1540, delayed: 148, rate: 9.6, note: "안정적 정시 배송 유지" },
    { week: "W16 (04/15~)", dateRange: "04/15~04/21", total: 1500, delayed: 185, rate: 12.3, note: "봄철 국지성 강풍 및 강우 발생" },
    { week: "W17 (04/22~)", dateRange: "04/22~04/28", total: 1580, delayed: 159, rate: 10.1, note: "월말 물량 증가 구간" },
    { week: "W18 (04/29~)", dateRange: "04/29~05/05", total: 1650, delayed: 224, rate: 13.6, note: "5월 연휴 시즌 특수 물량 급증" },
    { week: "W19 (05/06~)", dateRange: "05/06~05/12", total: 1520, delayed: 155, rate: 10.2, note: "연휴 후 평시 물량 회귀" },
    { week: "W20 (05/13~)", dateRange: "05/13~05/19", total: 1530, delayed: 147, rate: 9.6, note: "양호한 날씨 조건" },
    { week: "W21 (05/20~)", dateRange: "05/20~05/26", total: 1510, delayed: 142, rate: 9.4, note: "분기 최저 지연율 달성" },
    { week: "W22 (05/27~)", dateRange: "05/27~06/02", total: 1560, delayed: 161, rate: 10.3, note: "초여름 기온 상승 시작" },
    { week: "W23 (06/03~)", dateRange: "06/03~06/09", total: 1490, delayed: 145, rate: 9.7, note: "정상 운영" },
    { week: "W24 (06/10~)", dateRange: "06/10~06/16", total: 1520, delayed: 158, rate: 10.4, note: "이른 폭염주의보 발령 구간" },
    { week: "W25 (06/17~)", dateRange: "06/17~06/23", total: 1550, delayed: 202, rate: 13.0, note: "장마 전선 접근 및 집중 호우" },
    { week: "W26 (06/24~)", dateRange: "06/24~06/30", total: 1540, delayed: 237, rate: 15.4, note: "본격 장마철 시작, 도서·외곽 지연 급증" }
  ],

  // 모델 비교 결과 (2026.04~05 학습 13,400건 / 2026.06 검증 6,600건 시간 기준 분할)
  modelBenchmarks: [
    {
      name: "기준선 모델 (Baseline)",
      type: "단순 최빈 클래스 (All On-Time)",
      rocAuc: 0.500,
      prAuc: 0.106,
      precision: 0.000,
      recall: 0.000,
      f1Score: 0.000,
      accuracy: 0.894,
      desc: "모든 배송을 '정시'로 예측하는 단순 기준선. 불균형 데이터에서 정확도 89.4%를 보이나 지연 예측 능력은 0임."
    },
    {
      name: "로지스틱 회귀 (Logistic Regression)",
      type: "L2 정규화 선형 분류기",
      rocAuc: 0.812,
      prAuc: 0.524,
      precision: 0.468,
      recall: 0.615,
      f1Score: 0.531,
      accuracy: 0.887,
      desc: "계수 해석이 명확하고 브라우저 실시간 경량 추론에 최적화됨. 주요 위험 요인의 선형적 기여도를 산출."
    },
    {
      name: "랜덤 포레스트 (Random Forest)",
      type: "앙상블 배깅 트리 (100 Trees)",
      rocAuc: 0.835,
      prAuc: 0.589,
      precision: 0.512,
      recall: 0.648,
      f1Score: 0.572,
      accuracy: 0.899,
      desc: "비선형 상호작용(예: 엘리베이터 없음 × 고층)을 포착하나 모델 크기가 커 정적 브라우저 배포에 무거움."
    },
    {
      name: "LightGBM / XGBoost",
      type: "그레이디언트 부스팅 트리 (최종 선정 모델)",
      rocAuc: 0.842,
      prAuc: 0.618,
      precision: 0.534,
      recall: 0.682,
      f1Score: 0.599,
      accuracy: 0.906,
      desc: "최고의 판별력(ROC-AUC 0.842) 및 희소 범주 패턴 포착. SHAP 분석의 기준 모델로 채택."
    }
  ],

  // 확률 임계값(Threshold)에 따른 혼동 행렬 및 성능 변화표 (6,600건 Test Set 기준, 지연 실제 700건)
  thresholdCurve: [
    { threshold: 0.10, tp: 637, fp: 1475, fn: 63, tn: 4425, precision: 0.302, recall: 0.910, f1: 0.453, action: "선제 집중 관리 (오경보 감수)" },
    { threshold: 0.15, tp: 588, fp: 944, fn: 112, tn: 4956, precision: 0.384, recall: 0.840, f1: 0.527, action: "물류 버퍼 확보 권장" },
    { threshold: 0.20, tp: 525, fp: 614, fn: 175, tn: 5286, precision: 0.461, recall: 0.750, f1: 0.571, action: "정밀도-재현율 최적 균형점" },
    { threshold: 0.25, tp: 477, fp: 416, fn: 223, tn: 5484, precision: 0.534, recall: 0.681, f1: 0.599, action: "F1 최대화 구간 (기본 임계값)" },
    { threshold: 0.30, tp: 413, fp: 287, fn: 287, tn: 5613, precision: 0.590, recall: 0.590, f1: 0.590, action: "오경보 억제 모드" },
    { threshold: 0.40, tp: 280, fp: 133, fn: 420, tn: 5767, precision: 0.678, recall: 0.400, f1: 0.503, action: "고확신 건만 경보 (비용 절약)" },
    { threshold: 0.50, tp: 161, fp: 54, fn: 539, tn: 5846, precision: 0.749, recall: 0.230, f1: 0.352, action: "극단적 보수 운영 (미탐 다수)" }
  ],

  // SHAP Feature Importance (글로벌 영향도)
  shapFactors: [
    { feature: "지역: 도서산간 / 읍면농촌", meanShap: 0.412, direction: "위험 증가 (+)", rank: 1, desc: "장거리 주행 및 비포장/협소 도로에 따른 물리적 이동 지연" },
    { feature: "기상: 폭우 / 폭설", meanShap: 0.358, direction: "위험 증가 (+)", rank: 2, desc: "노면 마찰력 저하, 시야 제한 및 안전 속도 준수에 따른 감속" },
    { feature: "직전 배송지 거리 (km)", meanShap: 0.295, direction: "위험 증가 (+)", rank: 3, desc: "거리가 3km 이상 벌어질수록 동선 낭비 및 누적 시간 증가" },
    { feature: "공동현관 출입 제한 (비밀번호 미제공 등)", meanShap: 0.264, direction: "위험 증가 (+)", rank: 4, desc: "호출 대기, 경비실 확인, 고객 부재 시 회당 3~7분 대기 발생" },
    { feature: "당일 배송지 수 (140건 초과)", meanShap: 0.241, direction: "위험 증가 (+)", rank: 5, desc: "과밀 물량으로 인한 심리적·체력적 피로 및 후반 배송 지연 연쇄" },
    { feature: "주거 형태: 아파트 (승강기/단지동선)", meanShap: 0.208, direction: "위험 증가 (+)", rank: 6, desc: "대단지 주차-도보-승강기 대기로 세대당 체류 시간 길어짐" },
    { feature: "엘리베이터 없음 (빌라 고층)", meanShap: 0.187, direction: "위험 증가 (+)", rank: 7, desc: "계단 이동 체력 소모 및 중량물 운반 속도 저하" },
    { feature: "기사 경력 (개월 수)", meanShap: 0.174, direction: "위험 감소 (-)", rank: 8, desc: "관내 지리 숙련도와 우회로 파악으로 지연 확률 유의미하게 억제" },
    { feature: "신선식품 (냉장/냉동)", meanShap: 0.132, direction: "위험 증가 (+)", rank: 9, desc: "녹음/변질 방지를 위한 취급 조심성 및 포장 부피 영향" },
    { feature: "월요일 물량 집중 (is_monday)", meanShap: 0.095, direction: "위험 증가 (+)", rank: 10, desc: "주말 주문 누적에 따른 터미널 출차 지연 연계" }
  ],

  // 실시간 다차원 필터링용 코호트 집계 데이터
  // (지역 x 주거 x 날씨 x 시간대 x 기사유형 x 신선식품)의 통계적 코호트
  cohorts: [
    // 도서산간
    { region: "도서산간", housing: "단독주택", weather: "폭우", timeSlot: "오전", driver: "전담 정규직", fresh: true, count: 68, delayed: 34, delayMins: 48, cs: 9 },
    { region: "도서산간", housing: "단독주택", weather: "눈", timeSlot: "오후", driver: "파트너/위탁", fresh: false, count: 52, delayed: 28, delayMins: 52, cs: 8 },
    { region: "도서산간", housing: "단독주택", weather: "맑음", timeSlot: "오후", driver: "전담 정규직", fresh: false, count: 340, delayed: 98, delayMins: 36, cs: 18 },
    { region: "도서산간", housing: "빌라·다세대", weather: "맑음", timeSlot: "오전", driver: "파트너/위탁", fresh: true, count: 180, delayed: 62, delayMins: 38, cs: 14 },
    { region: "도서산간", housing: "상가", weather: "비", timeSlot: "오후", driver: "전담 정규직", fresh: false, count: 210, delayed: 76, delayMins: 41, cs: 16 },
    { region: "도서산간", housing: "아파트", weather: "흐림", timeSlot: "야간/새벽", driver: "파트너/위탁", fresh: true, count: 150, delayed: 58, delayMins: 45, cs: 15 },
    { region: "도서산간", housing: "오피스텔", weather: "폭염", timeSlot: "오후", driver: "전담 정규직", fresh: false, count: 200, delayed: 70, delayMins: 39, cs: 13 },

    // 읍면농촌
    { region: "읍면농촌", housing: "단독주택", weather: "맑음", timeSlot: "오전", driver: "전담 정규직", fresh: false, count: 620, delayed: 105, delayMins: 32, cs: 22 },
    { region: "읍면농촌", housing: "단독주택", weather: "폭우", timeSlot: "오후", driver: "파트너/위탁", fresh: true, count: 190, delayed: 57, delayMins: 44, cs: 16 },
    { region: "읍면농촌", housing: "단독주택", weather: "눈", timeSlot: "오전", driver: "파트너/위탁", fresh: false, count: 110, delayed: 31, delayMins: 46, cs: 9 },
    { region: "읍면농촌", housing: "빌라·다세대", weather: "비", timeSlot: "오후", driver: "전담 정규직", fresh: true, count: 480, delayed: 96, delayMins: 35, cs: 21 },
    { region: "읍면농촌", housing: "아파트", weather: "맑음", timeSlot: "오후", driver: "전담 정규직", fresh: false, count: 580, delayed: 104, delayMins: 31, cs: 24 },
    { region: "읍면농촌", housing: "상가", weather: "흐림", timeSlot: "오전", driver: "파트너/위탁", fresh: false, count: 320, delayed: 61, delayMins: 33, cs: 14 },
    { region: "읍면농촌", housing: "오피스텔", weather: "폭염", timeSlot: "야간/새벽", driver: "전담 정규직", fresh: true, count: 300, delayed: 58, delayMins: 34, cs: 12 },

    // 지방중소도시
    { region: "지방중소도시", housing: "아파트", weather: "맑음", timeSlot: "오전", driver: "전담 정규직", fresh: false, count: 1100, delayed: 121, delayMins: 26, cs: 33 },
    { region: "지방중소도시", housing: "아파트", weather: "폭우", timeSlot: "오후", driver: "파트너/위탁", fresh: true, count: 280, delayed: 62, delayMins: 38, cs: 19 },
    { region: "지방중소도시", housing: "빌라·다세대", weather: "맑음", timeSlot: "오후", driver: "파트너/위탁", fresh: false, count: 850, delayed: 102, delayMins: 29, cs: 26 },
    { region: "지방중소도시", housing: "단독주택", weather: "비", timeSlot: "오전", driver: "전담 정규직", fresh: false, count: 620, delayed: 74, delayMins: 28, cs: 18 },
    { region: "지방중소도시", housing: "상가", weather: "흐림", timeSlot: "오후", driver: "전담 정규직", fresh: true, count: 550, delayed: 66, delayMins: 30, cs: 16 },
    { region: "지방중소도시", housing: "오피스텔", weather: "눈", timeSlot: "야간/새벽", driver: "파트너/위탁", fresh: false, count: 500, delayed: 47, delayMins: 31, cs: 12 },

    // 지방광역시
    { region: "지방광역시", housing: "아파트", weather: "맑음", timeSlot: "오전", driver: "전담 정규직", fresh: true, count: 1500, delayed: 120, delayMins: 24, cs: 32 },
    { region: "지방광역시", housing: "아파트", weather: "비", timeSlot: "오후", driver: "파트너/위탁", fresh: false, count: 750, delayed: 75, delayMins: 29, cs: 23 },
    { region: "지방광역시", housing: "빌라·다세대", weather: "맑음", timeSlot: "오전", driver: "파트너/위탁", fresh: false, count: 800, delayed: 64, delayMins: 26, cs: 20 },
    { region: "지방광역시", housing: "오피스텔", weather: "흐림", timeSlot: "야간/새벽", driver: "전담 정규직", fresh: false, count: 450, delayed: 27, delayMins: 22, cs: 8 },
    { region: "지방광역시", housing: "상가", weather: "폭우", timeSlot: "오후", driver: "전담 정규직", fresh: true, count: 350, delayed: 42, delayMins: 34, cs: 14 },
    { region: "지방광역시", housing: "단독주택", weather: "폭염", timeSlot: "오후", driver: "전담 정규직", fresh: false, count: 350, delayed: 25, delayMins: 25, cs: 9 },

    // 서울도심
    { region: "서울도심", housing: "아파트", weather: "맑음", timeSlot: "오전", driver: "전담 정규직", fresh: true, count: 1600, delayed: 128, delayMins: 23, cs: 31 },
    { region: "서울도심", housing: "아파트", weather: "폭우", timeSlot: "오후", driver: "파트너/위탁", fresh: false, count: 420, delayed: 67, delayMins: 33, cs: 20 },
    { region: "서울도심", housing: "오피스텔", weather: "맑음", timeSlot: "야간/새벽", driver: "전담 정규직", fresh: false, count: 650, delayed: 39, delayMins: 20, cs: 10 },
    { region: "서울도심", housing: "빌라·다세대", weather: "비", timeSlot: "오전", driver: "파트너/위탁", fresh: true, count: 800, delayed: 64, delayMins: 27, cs: 22 },
    { region: "서울도심", housing: "상가", weather: "흐림", timeSlot: "오후", driver: "전담 정규직", fresh: false, count: 530, delayed: 42, delayMins: 25, cs: 13 },
    { region: "서울도심", housing: "단독주택", weather: "눈", timeSlot: "오전", driver: "파트너/위탁", fresh: false, count: 400, delayed: 25, delayMins: 28, cs: 9 },

    // 수도권신도시
    { region: "수도권신도시", housing: "아파트", weather: "맑음", timeSlot: "오전", driver: "전담 정규직", fresh: true, count: 1800, delayed: 126, delayMins: 22, cs: 30 },
    { region: "수도권신도시", housing: "아파트", weather: "비", timeSlot: "오후", driver: "파트너/위탁", fresh: false, count: 600, delayed: 48, delayMins: 27, cs: 17 },
    { region: "수도권신도시", housing: "오피스텔", weather: "맑음", timeSlot: "야간/새벽", driver: "전담 정규직", fresh: false, count: 450, delayed: 23, delayMins: 19, cs: 7 },
    { region: "수도권신도시", housing: "빌라·다세대", weather: "폭우", timeSlot: "오후", driver: "파트너/위탁", fresh: true, count: 320, delayed: 35, delayMins: 31, cs: 12 },
    { region: "수도권신도시", housing: "상가", weather: "흐림", timeSlot: "오전", driver: "전담 정규직", fresh: false, count: 300, delayed: 24, delayMins: 23, cs: 8 },
    { region: "수도권신도시", housing: "단독주택", weather: "폭염", timeSlot: "오후", driver: "전담 정규직", fresh: false, count: 230, delayed: 18, delayMins: 24, cs: 6 }
  ],

  // 실시간 시뮬레이터 추론용 로지스틱 회귀 모델 가중치 (Scikit-Learn Calibrated)
  riskModel: {
    intercept: -3.45,
    regionWeights: {
      "도서산간": 1.62,
      "읍면농촌": 0.88,
      "지방중소도시": 0.35,
      "지방광역시": -0.05,
      "서울도심": -0.08,
      "수도권신도시": -0.22
    },
    housingWeights: {
      "아파트": 0.38,
      "빌라·다세대": 0.22,
      "상가": 0.20,
      "단독주택": 0.12,
      "오피스텔": -0.32
    },
    weatherWeights: {
      "폭우": 0.95,
      "눈": 0.91,
      "비": 0.12,
      "맑음": 0.00,
      "흐림": -0.05,
      "폭염": -0.10
    },
    timeSlotWeights: {
      "오전": -0.05,
      "오후": 0.15,
      "야간/새벽": 0.25
    },
    // 연속형 및 이진 특성 계수 (표준화 스케일 환산)
    driverExpPerYear: -0.12, // 연차당 -0.12 (최대 -1.2)
    dailyDestCountOver100Per10: 0.08, // 100건 초과분 10건당 +0.08
    distancePrevKmPerKm: 0.15, // km당 +0.15
    boxWeightOver10kgPer5kg: 0.09, // 10kg 초과 5kg당 +0.09
    isFresh: 0.28, // 신선식품 +0.28
    hasElevator: -0.42, // 승강기 있음 -0.42 (없으면 페널티 0)
    hasEntranceLock: 0.39, // 공동현관 잠금 있음 +0.39
    isMonday: 0.24 // 월요일 +0.24
  }
};

// 전역 접근 가능토록 window에 바인딩
if (typeof window !== "undefined") {
  window.LASTMILE_DATA = LASTMILE_DATA;
}
