package com.youthlink.server.policy;

import com.youthlink.server.domain.policy.support.RegionMetadata;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("법정동코드 → 시/도 정규화")
class RegionMetadataTest {

    @Test
    @DisplayName("회원 거주지 표기와 정책 법정동코드가 같은 키로 만난다")
    void memberSidoAndPolicyZipCodeMeetOnTheSameKey() {
        // 과거에는 회원 거주지 "서울특별시"와 정책의 기관명("서울특별시청")을 동등 비교해 필터가 항상 0건이었다.
        assertThat(RegionMetadata.keysOf("1168010100"))
                .containsExactly(RegionMetadata.keyOfSido("서울특별시"));
    }

    @Test
    @DisplayName("행정구역 개편 전/후 코드는 같은 지역으로 모인다")
    void legacyAndCurrentCodesCollapseIntoOneRegion() {
        // 강원 42(구) / 51(현), 전북 45(구) / 52(현)
        assertThat(RegionMetadata.keysOf("4211000000")).isEqualTo(RegionMetadata.keysOf("5111000000"));
        assertThat(RegionMetadata.keyOfSido("강원도")).isEqualTo(RegionMetadata.keyOfSido("강원특별자치도"));
        assertThat(RegionMetadata.keyOfSido("전라북도")).isEqualTo(RegionMetadata.keyOfSido("전북특별자치도"));
    }

    @Test
    @DisplayName("통합된 광주·전남은 하나의 지역 키로 모인다")
    void mergedGwangjuAndJeonnamCollapseIntoOneRegion() {
        // 실제 수집 데이터에는 구 코드 29(광주)·46(전남)이 전혀 없고 통합 코드 12만 쓰인다.
        // 회원 프로필의 시/도 표기는 아직 분리돼 있으므로 양쪽을 같은 키로 모아야 매칭된다.
        String merged = RegionMetadata.keyOfSido("전남광주통합특별시");
        assertThat(RegionMetadata.keysOf("12110,12130")).containsExactly(merged);
        assertThat(RegionMetadata.keyOfSido("광주광역시")).isEqualTo(merged);
        assertThat(RegionMetadata.keyOfSido("전라남도")).isEqualTo(merged);
        assertThat(RegionMetadata.labelOf("12110")).isEqualTo("전남광주통합특별시");
    }

    @Test
    @DisplayName("온통청년 API 가 내려주는 5자리 코드도 시/도로 환원된다")
    void fiveDigitCodesAreResolved() {
        // 실제 응답의 zipCd 는 10자리 법정동코드가 아니라 5자리 코드를 콤마로 이어 붙인 형태다.
        assertThat(RegionMetadata.keysOf("28110,28140,28177"))
                .containsExactly(RegionMetadata.keyOfSido("인천광역시"));
        assertThat(RegionMetadata.labelOf("28125")).isEqualTo("인천광역시");
    }

    @Test
    @DisplayName("대상 지역을 특정할 수 없으면 전국으로 본다")
    void blankZipCodeFallsBackToNationwide() {
        assertThat(RegionMetadata.keysOf(null)).containsExactly(RegionMetadata.NATIONWIDE_KEY);
        assertThat(RegionMetadata.keysOf("   ")).containsExactly(RegionMetadata.NATIONWIDE_KEY);
        assertThat(RegionMetadata.labelOf(null)).isEqualTo("전국");
    }

    @Test
    @DisplayName("전국 17개 시/도가 모두 걸린 사업은 전국 키 하나로 접힌다")
    void policyCoveringEveryRegionCollapsesToNationwide() {
        String everySido = String.join(",",
                "1100000000", "2600000000", "2700000000", "2800000000", "2900000000",
                "3000000000", "3100000000", "3600000000", "4100000000", "5100000000",
                "4300000000", "4400000000", "5200000000", "4600000000", "4700000000",
                "4800000000", "5000000000");

        assertThat(RegionMetadata.keysOf(everySido)).containsExactly(RegionMetadata.NATIONWIDE_KEY);
        assertThat(RegionMetadata.labelOf(everySido)).isEqualTo("전국");
    }

    @Test
    @DisplayName("표에 없는 지역 표기는 필터 근거가 없으므로 null을 돌려준다")
    void unknownSidoHasNoFilterKey() {
        assertThat(RegionMetadata.keyOfSido("뉴욕주")).isNull();
        assertThat(RegionMetadata.keyOfSido(null)).isNull();
        assertThat(RegionMetadata.keyOfSido("")).isNull();
    }
}
