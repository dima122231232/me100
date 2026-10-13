import Hero from "@/components/Hero/Hero";
import "./home.css";
import Archive from "@/components/Archive/Archive";
import AnimText from "@/components/AnimText/AnimText";


export default function Home() {
    
  return (
    <>
    <Hero/>    
    <section className="Statement">
        <div className="Statement__content">
            <AnimText>
                <h2 className="Statement__title md">
                    A website can do more than sell. It can make people feel something.
                </h2>
            </AnimText>
            <p className="Statement__text md">
                If you blend in, you get <span>overlooked</span>.
            </p>
        </div>
    </section>
    <Archive/>
    </>
  );
}