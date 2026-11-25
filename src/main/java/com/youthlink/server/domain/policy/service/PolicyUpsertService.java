package com.youthlink.server.domain.policy.service;

import com.youthlink.server.domain.policy.converter.PolicyConverter;
import com.youthlink.server.domain.policy.dto.YouthPolicyResponse;
import com.youthlink.server.domain.policy.entity.Policy;
import com.youthlink.server.domain.policy.repository.PolicyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 수집한 정책 페이지를 DB에 upsert 하는 쓰기 전용 서비스.
 *
 * <p>이 로직이 {@code PolicyFetchServiceImpl} 안에 있을 때는 {@code fetchAndSave()} 가
 * 같은 빈의 {@code saveAll()} 을 자기 호출(self-invocation)해서 프록시를 우회했고,
 * 그 결과 {@code @Transactional} 이 적용되지 않았다. 트랜잭션이 없으면
 * {@code findByBizId} 로 꺼낸 엔티티가 바로 준영속 상태가 되어 {@code policy.update(item)} 의
 * 더티 체킹이 일어나지 않고, 변경 분기에는 {@code save()} 호출도 없어
 * <b>변경된 정책이 DB에 하나도 반영되지 않았다.</b>
 * 다음 실행에서 또 "변경"으로 감지되므로 변경 정책은 매번 재임베딩돼
 * 증분 배치의 이점까지 함께 사라진다.
 *
 * <p>그래서 쓰기 경로를 별도 빈으로 분리해 프록시를 반드시 거치게 하고,
 * 변경 분기에도 명시적으로 {@code save()} 를 호출한다. 트랜잭션 경계는 페이지 단위라
 * 외부 API 호출이 트랜잭션 안에 들어오지 않는다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PolicyUpsertService {

    private final PolicyRepository policyRepository;

    /**
     * 정책 페이지 1건을 upsert 하고, 신규 저장되거나 내용이 변경된 정책만 반환한다.
     *
     * @return Chroma 재적재 및 알림 생성 대상 정책 목록
     */
    @Transactional
    public List<Policy> upsertPage(List<YouthPolicyResponse.PolicyItem> items) {
        List<YouthPolicyResponse.PolicyItem> valid = items.stream()
                .filter(item -> item.getPlcyNo() != null && !item.getPlcyNo().isBlank())
                .toList();
        if (valid.isEmpty()) {
            return List.of();
        }

        // 건당 findByBizId 를 돌리면 페이지(100건)당 100쿼리가 나가므로 한 번에 끌어온다.
        Map<String, Policy> existingByBizId = new LinkedHashMap<>();
        List<String> bizIds = valid.stream().map(YouthPolicyResponse.PolicyItem::getPlcyNo).toList();
        for (Policy policy : policyRepository.findAllByBizIdIn(bizIds)) {
            existingByBizId.put(policy.getBizId(), policy);
        }

        List<Policy> changed = new ArrayList<>();
        for (YouthPolicyResponse.PolicyItem item : valid) {
            Policy existing = existingByBizId.get(item.getPlcyNo());

            if (existing == null) {
                changed.add(policyRepository.save(PolicyConverter.toPolicy(item)));
                continue;
            }
            if (existing.update(item)) {
                // 트랜잭션 안이라 더티 체킹만으로도 반영되지만,
                // 호출 경로가 바뀌어도 누락되지 않도록 명시적으로 저장한다.
                changed.add(policyRepository.save(existing));
            }
        }

        log.debug("정책 페이지 upsert - 조회 {}건 중 신규/변경 {}건", valid.size(), changed.size());
        return changed;
    }
}
