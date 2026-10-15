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
                    A Website Can Do More Than Sell. It Can Make People Feel Something.
                </h2>
            </AnimText>
            <p className="Statement__text md">
                If you blend in, you get <span>overlooked</span>.
            </p>
        </div>
    </section>
    {/* <Archive/> */}
    <div style={{height:"100svh"}}></div>
    </>
  );
}