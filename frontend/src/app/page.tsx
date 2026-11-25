"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, MapPin, ShieldCheck, Sparkles, SquareStack } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Primitives";
import { Logo } from "@/components/layout/AppShell";
import { KAKAO_LOGIN_URL, USE_MOCK } from "@/lib/config";
import { tokenStore } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "근거가 없으면 답하지 않습니다",
    body: "검색 결과가 비면 생성 모델을 호출하지 않고 안내 문구를 바로 돌려줍니다. 프롬프트 지시가 아니라 코드 경로로 막아, 근거 없는 답이 나올 자리를 없앴습니다.",
  },
  {
    icon: MapPin,
    title: "내 지역 조건을 먼저 거릅니다",
    body: "의미가 비슷한 정책이 아니라 실제로 해당되는 정책을 찾습니다. 거주 지역으로 먼저 걸러 보고 결과가 없으면 전국 정책까지 자동으로 넓힙니다.",
  },
  {
    icon: SquareStack,
    title: "답변마다 출처를 함께 봅니다",
    body: "어떤 공고를 근거로 답했는지 카드로 보여줍니다. 신청 전에 원문 공고를 바로 확인할 수 있습니다.",
  },
];

const FLOW = [
  { step: "01", label: "질문", desc: "원하는 지원을 평소 말로 물어봅니다" },
  { step: "02", label: "검색", desc: "지역 필터 + 벡터 검색으로 근거를 모읍니다" },
  { step: "03", label: "판단", desc: "근거가 없으면 생성 단계로 넘기지 않습니다" },
  { step: "04", label: "답변", desc: "모은 근거와 출처로만 안내합니다" },
];

function LandingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { push } = useToast();
  const { dark, toggle, mounted } = useTheme();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (params.get("expired")) {
      push("info", "로그인이 만료되어 다시 로그인이 필요합니다.");
    }
  }, [params, push]);

  function startLogin() {
    setPending(true);
    if (USE_MOCK) {
      // 목 모드에서는 카카오 왕복 없이 바로 들어간다. 토큰은 자리만 채운다.
      tokenStore.set("mock-access-token");
      router.push("/chat");
      return;
    }
    window.location.href = KAKAO_LOGIN_URL;
  }

  return (
    <div className="mesh min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center gap-2.5 px-5 py-5 sm:px-8">
        <Logo />
        <p className="text-[15px] font-semibold tracking-[-0.02em]">유스링크</p>
        <button
          type="button"
          onClick={toggle}
          aria-label="테마 전환"
          className="ml-auto grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          {mounted && (dark ? <Sun size={16} /> : <Moon size={16} />)}
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <section className="pt-10 sm:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <Badge tone="brand">
              <Sparkles size={12} />
              검색된 근거만 사용하는 RAG 상담
            </Badge>
            <h1 className="mt-5 text-[clamp(2rem,6vw,3.5rem)] leading-[1.1] font-semibold tracking-[-0.04em] text-balance">
              모르는 건 모른다고 말하는
              <br />
              <span className="text-brand">청년정책 상담</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
              청년정책은 매달 쏟아지지만 정작 필요한 사람에게 닿기 전에 공고 속에 묻힙니다.
              유스링크는 모델의 기억이 아니라 실제로 검색된 공고를 근거로만 답합니다.
              틀린 안내로 신청 시기를 놓치는 일이 가장 위험하다고 봤기 때문입니다.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={startLogin} loading={pending}>
                {USE_MOCK ? "데모 데이터로 둘러보기" : "카카오로 시작하기"}
                <ArrowRight size={16} />
              </Button>
              <p className="text-[12.5px] text-muted">
                {USE_MOCK
                  ? "백엔드 없이 화면 전체를 확인할 수 있는 목 데이터 모드입니다."
                  : "카카오 계정으로 로그인하면 프로필 기반 추천이 시작됩니다."}
              </p>
            </div>
          </motion.div>
        </section>

        <section className="mt-16 grid gap-3 sm:mt-24 sm:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="h-full p-5">
                <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Icon size={17} />
                </span>
                <h2 className="mt-4 text-[14.5px] font-semibold tracking-[-0.02em]">{title}</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{body}</p>
              </Card>
            </motion.div>
          ))}
        </section>

        <section className="mt-16 sm:mt-24">
          <h2 className="text-lg font-semibold tracking-[-0.025em]">답변이 만들어지는 경로</h2>
          <p className="mt-1.5 text-[13.5px] text-muted">
            근거를 모으지 못하면 생성 단계로 넘어가지 않습니다. 답할 수 없는 질문에 드는 비용도 0입니다.
          </p>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FLOW.map(({ step, label, desc }) => (
              <li key={step}>
                <Card className="h-full p-4">
                  <span className="font-mono text-[11px] tracking-widest text-brand">{step}</span>
                  <p className="mt-2 text-[14px] font-semibold tracking-[-0.02em]">{label}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{desc}</p>
                </Card>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense>
      <LandingInner />
    </Suspense>
  );
}
