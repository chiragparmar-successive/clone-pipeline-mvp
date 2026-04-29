import type { Section } from "@/types/cms";
import Hero from "./Hero";
import ContentBlock from "./ContentBlock";
import CTA from "./CTA";

export default function SectionRenderer({
  sections,
}: {
  sections?: Section[] | null;
}) {
  if (!sections || sections.length === 0) return null;
  return (
    <>
      {sections.map((section, idx) => {
        const key = `${section.__component}-${section.id ?? idx}`;
        switch (section.__component) {
          case "sections.hero":
            return <Hero key={key} data={section} />;
          case "sections.content-block":
            return <ContentBlock key={key} data={section} />;
          case "sections.cta":
            return <CTA key={key} data={section} />;
          default:
            return null;
        }
      })}
    </>
  );
}
