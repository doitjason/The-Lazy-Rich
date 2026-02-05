"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export default function PortfolioCalculator() {
    return (
        <div className="space-y-6">
            <Card className="glass-card w-full max-w-2xl mx-auto border-0 text-center py-10">
                <CardHeader>
                    <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-2xl font-serif">로그인이 필요합니다</CardTitle>
                    <CardDescription>
                        내 포트폴리오의 미래를 시뮬레이션 하세요.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-6">
                        이 기능은 Week 2 업데이트(로그인 및 데이터베이스) 이후 사용 가능합니다.
                    </p>
                    <Button disabled className="w-full max-w-xs" variant="outline">
                        곧 출시 예정 (Coming Soon)
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
