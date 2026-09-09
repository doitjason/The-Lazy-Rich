"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

/**
 * URL 쿼리 파라미터를 읽어 콜백으로만 넘겨주는 컴포넌트.
 *
 * 왜 이렇게까지 하는가:
 * useSearchParams() 를 쓰는 컴포넌트는 정적 렌더 단계에서 가장 가까운
 * Suspense 경계의 fallback 으로 대체된다. 페이지 전체를 Suspense 로 감싸면
 * 서버가 내려주는 HTML 에 fallback("Loading...") 만 남고 본문이 통째로
 * 빠진다. 크롤러와 심사 도구는 그 빈 화면을 먼저 본다.
 *
 * 그래서 파라미터를 읽는 부분만 이 컴포넌트로 격리하고 여기에만 Suspense 를
 * 건다. 페이지 본문은 서버에서 그대로 렌더되고, 쿼리 처리만 하이드레이션
 * 이후에 이어진다. 동작은 기존과 같다.
 *
 * 콜백은 매 렌더마다 새로 만들어져도 안전하다. 실행 조건을 콜백의 identity 가
 * 아니라 쿼리 문자열의 변화로 잡아 두었기 때문이다.
 */

interface Props {
    onChange: (params: URLSearchParams) => void;
}

function Reader({ onChange }: Props) {
    const searchParams = useSearchParams();
    const key = searchParams.toString();

    const latest = useRef(onChange);
    latest.current = onChange;

    useEffect(() => {
        latest.current(new URLSearchParams(key));
    }, [key]);

    return null;
}

export function SearchParamsListener({ onChange }: Props) {
    return (
        <Suspense fallback={null}>
            <Reader onChange={onChange} />
        </Suspense>
    );
}
