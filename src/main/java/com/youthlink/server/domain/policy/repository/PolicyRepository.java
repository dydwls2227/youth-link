package com.youthlink.server.domain.policy.repository;

import com.youthlink.server.domain.policy.entity.Policy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PolicyRepository extends JpaRepository<Policy, Long> {
    Optional<Policy> findByBizId(String bizId);

    /** 수집 배치에서 페이지 단위로 기존 정책을 한 번에 조회한다. */
    List<Policy> findAllByBizIdIn(Collection<String> bizIds);
}
