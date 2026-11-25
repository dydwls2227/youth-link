package com.youthlink.server.chat;

import com.youthlink.server.domain.chat.dto.ChatRequest;
import com.youthlink.server.domain.chat.dto.ChatResponse;
import com.youthlink.server.domain.chat.repository.ChatMessageRepository;
import com.youthlink.server.domain.chat.service.ChatServiceImpl;
import com.youthlink.server.domain.member.entity.Member;
import com.youthlink.server.domain.member.repository.MemberRepository;
import com.youthlink.server.domain.policy.support.RegionMetadata;
import com.youthlink.server.domain.region.entity.Region;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

/**
 * 환각 차단과 2단계 폴백 검색이 "프롬프트 요청"이 아니라 "코드 경로"로 보장되는지 검증한다.
 *
 * <p>시스템 프롬프트의 "모르면 모른다고 하라"는 지시는 모델이 무시할 수 있으므로,
 * 근거가 없을 때 LLM 호출 경로에 진입조차 하지 않는다는 사실을 테스트로 고정한다.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ChatServiceEvidenceGuardTest {

    private static final Long MEMBER_ID = 1L;

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private ChatClient.Builder chatClientBuilder;
    @Mock
    private VectorStore vectorStore;
    @Mock
    private ChatMessageRepository chatMessageRepository;
    @Mock
    private MemberRepository memberRepository;
    @Mock
    private ResourceLoader resourceLoader;

    @InjectMocks
    private ChatServiceImpl chatService;

    @BeforeEach
    void stubSystemPrompt() {
        // 실제 운영에서는 classpath 리소스를 읽는 지점. 템플릿 로딩은 이 테스트의 관심사가 아니다.
        given(resourceLoader.getResource(anyString()))
                .willReturn(new ByteArrayResource(
                        "정책 컨텍스트: {context}".getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    @DisplayName("검색 결과가 비면 LLM을 호출하지 않고 안내 문구를 즉시 반환한다")
    void noEvidenceMeansNoLlmCall() {
        given(memberRepository.findById(MEMBER_ID)).willReturn(Optional.empty());
        given(vectorStore.similaritySearch(any(SearchRequest.class))).willReturn(List.of());

        ChatResponse response = chatService.chat(MEMBER_ID, chatRequest("월세 지원 알려줘"));

        // LLM 호출 경로에 진입조차 하지 않는다 = 답할 수 없는 질문의 토큰 비용이 0이다.
        verifyNoInteractions(chatClientBuilder);
        assertThat(response.getReply()).contains("관련 정책 정보를 찾을 수 없습니다");
        assertThat(response.getSources()).isEmpty();
        // 근거가 없어도 대화 이력은 남는다 (사용자 질문 + 안내 응답).
        verify(chatMessageRepository, times(2)).save(any());
    }

    @Test
    @DisplayName("거주 지역 필터 검색이 0건이면 필터를 완화한 전체 검색으로 폴백한다")
    void regionFilterFallsBackToUnfilteredSearch() {
        Member member = memberLivingIn("서울특별시");
        given(memberRepository.findById(MEMBER_ID)).willReturn(Optional.of(member));
        given(vectorStore.similaritySearch(any(SearchRequest.class))).willReturn(List.of());

        chatService.chat(MEMBER_ID, chatRequest("월세 지원 알려줘"));

        ArgumentCaptor<SearchRequest> captor = ArgumentCaptor.forClass(SearchRequest.class);
        verify(vectorStore, times(2)).similaritySearch(captor.capture());

        List<SearchRequest> requests = captor.getAllValues();
        assertThat(requests.get(0).getFilterExpression())
                .as("1단계는 거주 지역 하드 필터가 걸린 검색이어야 한다")
                .isNotNull();
        assertThat(requests.get(0).getFilterExpression().toString())
                .contains(RegionMetadata.keyOfSido("서울특별시"))
                .contains(RegionMetadata.NATIONWIDE_KEY);
        assertThat(requests.get(1).getFilterExpression())
                .as("2단계는 필터를 완화한 전체 검색이어야 한다")
                .isNull();
    }

    @Test
    @DisplayName("거주 지역 필터로 결과가 나오면 전체 검색을 하지 않는다")
    void regionFilterHitSkipsFallback() {
        Member member = memberLivingIn("서울특별시");
        given(memberRepository.findById(MEMBER_ID)).willReturn(Optional.of(member));
        given(vectorStore.similaritySearch(any(SearchRequest.class)))
                .willReturn(List.of(new Document("정책 본문")));

        chatService.chat(MEMBER_ID, chatRequest("월세 지원 알려줘"));

        verify(vectorStore, times(1)).similaritySearch(any(SearchRequest.class));
        // 근거가 있을 때는 반대로 LLM 호출 경로를 타야 한다.
        verify(chatClientBuilder).build();
    }

    @Test
    @DisplayName("지역 표기를 알 수 없는 회원은 필터 없이 한 번만 검색한다")
    void unknownRegionSkipsHardFilter() {
        Member member = memberLivingIn("뉴욕주");
        given(memberRepository.findById(MEMBER_ID)).willReturn(Optional.of(member));
        given(vectorStore.similaritySearch(any(SearchRequest.class))).willReturn(List.of());

        chatService.chat(MEMBER_ID, chatRequest("월세 지원 알려줘"));

        ArgumentCaptor<SearchRequest> captor = ArgumentCaptor.forClass(SearchRequest.class);
        verify(vectorStore, times(1)).similaritySearch(captor.capture());
        assertThat(captor.getValue().getFilterExpression()).isNull();
    }

    private ChatRequest chatRequest(String message) {
        ChatRequest request = new ChatRequest();
        ReflectionTestUtils.setField(request, "sessionId", "session-test");
        ReflectionTestUtils.setField(request, "message", message);
        return request;
    }

    private Member memberLivingIn(String sido) {
        Region region = mock(Region.class);
        given(region.getSido()).willReturn(sido);
        return Member.builder().email("test@example.com").region(region).build();
    }
}
