import Header from "@/components/layout/Header";
import Container from "@/components/layout/Container";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />

      <div className="flex-1 flex flex-col items-center justify-center py-20 lg:py-32">
        <Container className="flex flex-col items-center text-center space-y-8">

          <div className="space-y-4 max-w-3xl">
            <h1 className="font-serif text-4xl lg:text-7xl font-medium tracking-tight text-foreground">
              투자의 <span className="text-primary italic">본질(Essence)</span>.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              시장 소음은 거부합니다. <br className="hidden md:block" />
              변하지 않는 원칙과 데이터 기반의 통찰력으로 정말 중요한 것에 집중하세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-12">
            {[
              { title: "Timeless", desc: "어떤 사이클에서도 살아남는 불변의 원칙." },
              { title: "Intellectual", desc: "과장이 아닌, 깊이 있는 지적 통찰." },
              { title: "Anti-Noise", desc: "투자를 방해하는 소음을 차단합니다." }
            ].map((item, i) => (
              <div key={i} className="glass-card p-8 rounded-2xl flex flex-col items-center text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-primary mb-2">
                  <span className="font-serif font-bold text-xl">{i + 1}</span>
                </div>
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

        </Container>
      </div>
    </main>
  );
}
