package com.youthlink.server.domain.policy.support;

import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

/**
 * 벡터 스토어의 지역 메타데이터를 만들고, 회원 거주지로 그 메타데이터를 질의할 키를 돌려준다.
 *
 * <p>온통청년 신 API는 시/도 명칭을 내려주지 않고 10자리 법정동코드 목록(zipCd)만 내려준다.
 * 그래서 임베딩 메타데이터의 지역 값으로 운영기관명(ctpvNm)을 대신 쓰고 있었는데,
 * 그 결과 {@code "서울특별시"}(회원 거주지)와 {@code "고양시청"}(기관명)을 동등 비교하게 되어
 * 지역 하드 필터가 사실상 항상 0건을 반환하고 매번 전체 검색으로 폴백했다.
 *
 * <p>이 클래스는 법정동코드 앞 2자리(시/도 코드)를 정규화해
 * {@code Member.region.sido} 와 같은 축에서 비교할 수 있게 만든다.
 *
 * <p>정책 하나가 여러 시/도를 대상으로 할 수 있는데 Chroma 메타데이터 값은 스칼라만 허용되어
 * "목록에 포함되는가"를 직접 질의할 수 없다. 그래서 {@code region_<코드> = true} 형태의
 * 불린 키로 전개해 저장하고, 조회 시에는 해당 키 하나만 확인한다.
 */
public final class RegionMetadata {

    /** 전국 단위(중앙부처) 정책을 표시하는 메타데이터 키. 어떤 지역 회원에게도 매칭된다. */
    public static final String NATIONWIDE_KEY = "region_all";

    /** 사람이 읽는 지역 라벨에 쓰는 전국 표기. */
    public static final String NATIONWIDE_LABEL = "전국";

    /** 사람이 읽는 지역 라벨 메타데이터 키(필터용이 아니라 출처 표시/디버깅용). */
    public static final String LABEL_KEY = "regionLabel";

    /** 이 수 이상의 시/도가 걸려 있으면 광역 제한이 없는 사업으로 본다. */
    private static final int NATIONWIDE_THRESHOLD = 15;

    private static final String KEY_PREFIX = "region_";
    private static final int SIDO_CODE_LENGTH = 2;

    /**
     * 법정동코드 앞 2자리 → 정규화 코드.
     * 행정구역 개편 전/후 코드는 한쪽으로 모아 같은 지역으로 취급한다.
     * 강원 42·51, 전북 45·52가 그렇고, 광주 29와 전남 46은 통합 코드 12로 모은다.
     * (실제 수집 데이터에 29·46은 더 이상 나타나지 않고 12만 쓰인다.)
     */
    private static final Map<String, String> CODE_BY_PREFIX = Map.ofEntries(
            Map.entry("11", "11"), // 서울
            Map.entry("12", "12"), // 전남광주통합특별시
            Map.entry("26", "26"), // 부산
            Map.entry("27", "27"), // 대구
            Map.entry("28", "28"), // 인천
            Map.entry("29", "12"), // 광주광역시(구) → 전남광주통합특별시
            Map.entry("30", "30"), // 대전
            Map.entry("31", "31"), // 울산
            Map.entry("36", "36"), // 세종
            Map.entry("41", "41"), // 경기
            Map.entry("42", "51"), // 강원도(구) → 강원특별자치도
            Map.entry("51", "51"), // 강원특별자치도
            Map.entry("43", "43"), // 충북
            Map.entry("44", "44"), // 충남
            Map.entry("45", "52"), // 전라북도(구) → 전북특별자치도
            Map.entry("52", "52"), // 전북특별자치도
            Map.entry("46", "12"), // 전라남도(구) → 전남광주통합특별시
            Map.entry("47", "47"), // 경북
            Map.entry("48", "48"), // 경남
            Map.entry("50", "50")  // 제주
    );

    /** 정규화 코드 → 대표 시/도 명칭. data.sql 의 region.sido 표기와 일치시킨다. */
    private static final Map<String, String> LABEL_BY_CODE = Map.ofEntries(
            Map.entry("11", "서울특별시"),
            Map.entry("12", "전남광주통합특별시"),
            Map.entry("26", "부산광역시"),
            Map.entry("27", "대구광역시"),
            Map.entry("28", "인천광역시"),
            Map.entry("30", "대전광역시"),
            Map.entry("31", "울산광역시"),
            Map.entry("36", "세종특별자치시"),
            Map.entry("41", "경기도"),
            Map.entry("51", "강원특별자치도"),
            Map.entry("43", "충청북도"),
            Map.entry("44", "충청남도"),
            Map.entry("52", "전북특별자치도"),
            Map.entry("47", "경상북도"),
            Map.entry("48", "경상남도"),
            Map.entry("50", "제주특별자치도")
    );

    /**
     * 시/도 명칭 → 정규화 코드.
     * 회원 프로필의 정식 명칭뿐 아니라 사용자가 직접 입력할 수 있는 약칭·구명칭도 함께 받는다.
     */
    private static final Map<String, String> CODE_BY_SIDO_NAME = Map.ofEntries(
            Map.entry("서울특별시", "11"), Map.entry("서울", "11"),
            Map.entry("부산광역시", "26"), Map.entry("부산", "26"),
            Map.entry("대구광역시", "27"), Map.entry("대구", "27"),
            Map.entry("인천광역시", "28"), Map.entry("인천", "28"),
            Map.entry("전남광주통합특별시", "12"),
            Map.entry("광주광역시", "12"), Map.entry("광주", "12"),
            Map.entry("대전광역시", "30"), Map.entry("대전", "30"),
            Map.entry("울산광역시", "31"), Map.entry("울산", "31"),
            Map.entry("세종특별자치시", "36"), Map.entry("세종", "36"),
            Map.entry("경기도", "41"), Map.entry("경기", "41"),
            Map.entry("강원특별자치도", "51"), Map.entry("강원도", "51"), Map.entry("강원", "51"),
            Map.entry("충청북도", "43"), Map.entry("충북", "43"),
            Map.entry("충청남도", "44"), Map.entry("충남", "44"),
            Map.entry("전북특별자치도", "52"), Map.entry("전라북도", "52"), Map.entry("전북", "52"),
            Map.entry("전라남도", "12"), Map.entry("전남", "12"),
            Map.entry("경상북도", "47"), Map.entry("경북", "47"),
            Map.entry("경상남도", "48"), Map.entry("경남", "48"),
            Map.entry("제주특별자치도", "50"), Map.entry("제주도", "50"), Map.entry("제주", "50")
    );

    private RegionMetadata() {
    }

    /**
     * 정책 1건을 벡터 스토어에 넣을 때 붙일 지역 메타데이터 키 집합을 만든다.
     * 대상 시/도를 특정할 수 없거나 사실상 전국 사업이면 {@link #NATIONWIDE_KEY} 하나만 돌려준다.
     */
    public static Set<String> keysOf(String zipCd) {
        Set<String> codes = sidoCodesOf(zipCd);
        if (codes.isEmpty() || codes.size() >= NATIONWIDE_THRESHOLD) {
            return Set.of(NATIONWIDE_KEY);
        }
        Set<String> keys = new LinkedHashSet<>();
        for (String code : codes) {
            keys.add(KEY_PREFIX + code);
        }
        return keys;
    }

    /**
     * 회원 거주지 시/도로 질의할 메타데이터 키를 돌려준다.
     * 표에 없는 표기는 필터를 걸 수 없다는 뜻이므로 {@code null} 을 돌려주고, 호출 측은 필터를 생략한다.
     */
    public static String keyOfSido(String sidoName) {
        if (sidoName == null || sidoName.isBlank()) {
            return null;
        }
        String code = CODE_BY_SIDO_NAME.get(sidoName.trim());
        return code == null ? null : KEY_PREFIX + code;
    }

    /** 사람이 읽는 지역 라벨. 예: {@code "서울특별시"}, {@code "서울특별시 외 2곳"}, {@code "전국"}. */
    public static String labelOf(String zipCd) {
        Set<String> codes = sidoCodesOf(zipCd);
        if (codes.isEmpty() || codes.size() >= NATIONWIDE_THRESHOLD) {
            return NATIONWIDE_LABEL;
        }
        String first = LABEL_BY_CODE.getOrDefault(codes.iterator().next(), NATIONWIDE_LABEL);
        return codes.size() == 1 ? first : first + " 외 " + (codes.size() - 1) + "곳";
    }

    /** 콤마로 이어진 법정동코드 목록에서 정규화된 시/도 코드 집합을 뽑는다. */
    private static Set<String> sidoCodesOf(String zipCd) {
        if (zipCd == null || zipCd.isBlank()) {
            return Collections.emptySet();
        }
        Set<String> codes = new LinkedHashSet<>();
        for (String raw : Arrays.asList(zipCd.split(","))) {
            String token = raw.trim();
            if (token.length() < SIDO_CODE_LENGTH) {
                continue;
            }
            String code = CODE_BY_PREFIX.get(token.substring(0, SIDO_CODE_LENGTH));
            if (code != null) {
                codes.add(code);
            }
        }
        return codes;
    }
}
