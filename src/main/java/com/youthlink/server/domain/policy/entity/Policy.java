package com.youthlink.server.domain.policy.entity;

import com.youthlink.server.common.base.BaseTimeEntity;
import com.youthlink.server.domain.policy.dto.YouthPolicyResponse;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Policy extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String bizId;

    @Column(length = 300)
    private String polyBizSjnm;

    @Lob
    private String polyItcnCn;

    @Lob
    private String sporCn;

    @Column(length = 500)
    private String rqutPrdCn;

    @Column(length = 100)
    private String ageInfo;

    @Column(length = 100)
    private String empmSttsCd;

    @Column(length = 100)
    private String accrRqisCd;

    @Lob
    private String incmRqisCn;

    @Column(length = 300)
    private String cnsgNmor;

    // 실제 공공데이터 URL이 500자를 종종 넘어서 Lob으로 둔다.
    @Lob
    private String polyUrl;

    // 신 API는 시/도 명칭 대신 기관명을 지역 대용으로 쓰므로(PolicyConverter 참고) 길이를 넉넉히 잡는다.
    // 주의: 이 값은 "표시용 기관명"이며, 검색 지역 필터의 기준이 아니다. 필터 기준은 아래 zipCd 다.
    @Column(length = 300)
    private String ctpvNm;

    // 신 API가 내려주는 법정동코드 목록(콤마 구분). 전국 사업이면 수천 건이 들어올 수 있어 Lob으로 둔다.
    // 이 값만이 정책의 실제 대상 지역을 담고 있어, 벡터 검색의 지역 메타데이터를 만드는 유일한 근거다.
    @Lob
    private String zipCd;

    /**
     * 외부 API 응답으로 필드를 갱신하고, 실제로 변경된 내용이 있으면 true를 반환한다.
     * 변경 없는 정책은 Chroma 재적재 및 알림 생성 대상에서 제외된다.
     *
     * <p>zipCd 가 바뀌면 본문 텍스트는 같아도 검색 메타데이터(대상 지역)가 달라지므로
     * 반드시 변경으로 보고 재적재해야 한다.
     */
    public boolean update(YouthPolicyResponse.PolicyItem item) {
        String newPolyBizSjnm = item.getPlcyNm();
        String newPolyItcnCn = item.getPlcyExplnCn();
        String newSporCn = item.getPlcySprtCn();
        String newRqutPrdCn = item.toRqutPrdCn();
        String newAgeInfo = item.toAgeInfo();
        String newEmpmSttsCd = item.getJobCd();
        String newAccrRqisCd = item.getSchoolCd();
        String newIncmRqisCn = item.toIncmRqisCn();
        String newCnsgNmor = item.toCnsgNmor();
        String newPolyUrl = item.toPolyUrl();
        String newCtpvNm = item.toCtpvNm();
        String newZipCd = item.getZipCd();

        boolean changed =
                !equals(this.polyBizSjnm, newPolyBizSjnm) ||
                !equals(this.polyItcnCn, newPolyItcnCn) ||
                !equals(this.sporCn, newSporCn) ||
                !equals(this.rqutPrdCn, newRqutPrdCn) ||
                !equals(this.ageInfo, newAgeInfo) ||
                !equals(this.empmSttsCd, newEmpmSttsCd) ||
                !equals(this.accrRqisCd, newAccrRqisCd) ||
                !equals(this.incmRqisCn, newIncmRqisCn) ||
                !equals(this.cnsgNmor, newCnsgNmor) ||
                !equals(this.polyUrl, newPolyUrl) ||
                !equals(this.ctpvNm, newCtpvNm) ||
                !equals(this.zipCd, newZipCd);

        if (changed) {
            this.polyBizSjnm = newPolyBizSjnm;
            this.polyItcnCn = newPolyItcnCn;
            this.sporCn = newSporCn;
            this.rqutPrdCn = newRqutPrdCn;
            this.ageInfo = newAgeInfo;
            this.empmSttsCd = newEmpmSttsCd;
            this.accrRqisCd = newAccrRqisCd;
            this.incmRqisCn = newIncmRqisCn;
            this.cnsgNmor = newCnsgNmor;
            this.polyUrl = newPolyUrl;
            this.ctpvNm = newCtpvNm;
            this.zipCd = newZipCd;
        }

        return changed;
    }

    private static boolean equals(String a, String b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.equals(b);
    }
}
