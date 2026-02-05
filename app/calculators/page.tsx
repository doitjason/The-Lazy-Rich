import Container from "@/components/layout/Container";
import Header from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RegretCalculator from "@/components/calculators/RegretCalculator";
import FireCalculator from "@/components/calculators/FireCalculator";
import PortfolioCalculator from "@/components/calculators/PortfolioCalculator";

export default function CalculatorsPage() {
    return (
        <main className="flex min-h-screen flex-col">
            <Header />

            <div className="flex-1 py-10">
                <Container className="max-w-4xl">
                    <div className="flex flex-col items-center text-center space-y-4 mb-10">
                        <h1 className="font-serif text-3xl md:text-5xl font-medium tracking-tight text-foreground">
                            투자 <span className="text-primary italic">계산기</span>
                        </h1>
                        <p className="text-muted-foreground max-w-lg">
                            후회를 계산하고, 자유를 계획하고, 포트폴리오를 분석하세요.
                            숫자는 거짓말을 하지 않으니까요.
                        </p>
                    </div>

                    <Tabs defaultValue="regret" className="w-full">
                        <div className="flex justify-center mb-8">
                            <TabsList className="grid w-full max-w-md grid-cols-3">
                                <TabsTrigger value="regret">했제?(Regret)</TabsTrigger>
                                <TabsTrigger value="fire">자유(FIRE)</TabsTrigger>
                                <TabsTrigger value="portfolio">포트폴리오</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="regret" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                            <RegretCalculator />
                        </TabsContent>

                        <TabsContent value="fire" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                            <FireCalculator />
                        </TabsContent>

                        <TabsContent value="portfolio" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
                            <PortfolioCalculator />
                        </TabsContent>
                    </Tabs>
                </Container>
            </div>
        </main>
    );
}
